import {
  Board,
  amplifyCapForPhase,
  createCirclePhaseState,
  itemSpawnBonusForPhase,
  manaBonusMultiplierForPhase,
  registerStoneSummon,
  resetBoardInPlace,
  type CirclePhaseState,
  type CombatBoardSize,
  type Point,
} from "stonesummoner-board";
import {
  aliveSummons,
  pickDefaultTarget,
  rankStoneSuggestions,
  teamStoneColor,
  type StoneSuggestion,
} from "./ai.js";
import { classifyCapture, gainsForBoardEvent } from "./boardEvents.js";
import { detectShapeBonuses } from "./shapes.js";
import { clampAmplify, computeDamage } from "./damage.js";
import {
  itemDef,
  shouldSpawnItem,
  weightedItemId,
  type BoardToken,
} from "./items.js";
import type { SkillDef } from "stonesummoner-data";
import type {
  BattlePhase,
  FinishReason,
  SummonerState,
  TeamId,
  Unit,
} from "./types.js";

const ATB_THRESHOLD = 100;

function ensureSkillCd(unit: Unit): number[] {
  const n = unit.skills?.length ?? 0;
  if (!unit.skillCd || unit.skillCd.length !== n) {
    unit.skillCd = Array.from({ length: Math.max(n, 3) }, () => 0);
  }
  return unit.skillCd;
}

function tickSkillCooldowns(units: Unit[]): void {
  for (const u of units) {
    if (!u.alive || !u.skillCd) continue;
    u.skillCd = u.skillCd.map((c) => Math.max(0, c - 1));
  }
}

/** Auto skill pick: S3→S2→S1; healers prefer heal when ally < 55% HP. */
export function pickAutoSkillIndex(unit: Unit, units: Unit[]): number {
  const skills = unit.skills;
  if (!skills?.length) return 0;
  const cds = ensureSkillCd(unit);

  const allies = units.filter(
    (u) => u.alive && u.team === unit.team && u.kind === "monster",
  );
  const lowest = allies.reduce<Unit | null>((best, u) => {
    if (!best) return u;
    return u.hp / u.stats.hp < best.hp / best.stats.hp ? u : best;
  }, null);
  const needHeal = !!lowest && lowest.hp / lowest.stats.hp < 0.55;

  if (needHeal) {
    for (let i = 0; i < skills.length; i++) {
      if (cds[i]! > 0) continue;
      if (skills[i]!.effects.some((e) => e.kind === "heal")) return i;
    }
  }

  for (let i = skills.length - 1; i >= 0; i--) {
    if (cds[i]! <= 0) return i;
  }
  return 0;
}

export interface BattleConfig {
  boardSize: CombatBoardSize;
  units: Unit[];
  allySummoner: SummonerState;
  enemySummoner: SummonerState;
  /** Optional power-gap amplify cap (default 1.25). */
  powerGapAmplifyCap?: number;
  rng?: () => number;
  /** Override empowered reset threshold (default 50 on 9×9). */
  resetThreshold?: number;
  /** Total waves (default 1). When enemy summons wipe mid-battle, next wave spawns. */
  totalWaves?: number;
  /**
   * Build enemy monster units for wave index (1-based).
   * Wave 1 is already in `units`; called for wave 2+.
   */
  spawnWave?: (wave: number) => Unit[];
}

export interface SkillResult {
  attackerId: string;
  targetId: string;
  damage: number;
  crit: boolean;
  usedSummonerSkill: boolean;
}

export class Battle {
  readonly board: Board;
  circle: CirclePhaseState;
  units: Unit[];
  allySummoner: SummonerState;
  enemySummoner: SummonerState;
  /** Tokens sitting on empty intersections. */
  tokens: BoardToken[] = [];
  amplify = 1;
  skillAmplifyBonus = 0;
  phase: BattlePhase = "idle";
  activeUnitId: string | null = null;
  finishReason: FinishReason = null;
  log: string[] = [];
  /** 1-based current wave. */
  currentWave: number;
  readonly totalWaves: number;
  private powerGapCap: number;
  private rng: () => number;
  private spawnWaveFn?: (wave: number) => Unit[];

  constructor(config: BattleConfig) {
    this.board = new Board(config.boardSize);
    this.circle = createCirclePhaseState(
      config.boardSize,
      config.resetThreshold,
    );
    this.units = config.units.map((u) => {
      const copy: Unit = {
        ...u,
        stats: { ...u.stats },
        skills: u.skills ? u.skills.map((s) => ({ ...s, effects: [...s.effects] })) : u.skills,
      };
      ensureSkillCd(copy);
      return copy;
    });
    this.allySummoner = { ...config.allySummoner };
    this.enemySummoner = { ...config.enemySummoner };
    this.powerGapCap = config.powerGapAmplifyCap ?? 1.25;
    this.rng = config.rng ?? Math.random;
    this.totalWaves = Math.max(1, config.totalWaves ?? 1);
    this.currentWave = 1;
    this.spawnWaveFn = config.spawnWave;
  }

  getUnit(id: string): Unit | undefined {
    return this.units.find((u) => u.id === id);
  }

  alive(team?: TeamId): Unit[] {
    return this.units.filter((u) => u.alive && (team ? u.team === team : true));
  }

  tokenAt(x: number, y: number): BoardToken | undefined {
    return this.tokens.find((t) => t.x === x && t.y === y);
  }

  currentAmplify(): number {
    const phaseCap = amplifyCapForPhase(this.circle.boardPhase);
    return clampAmplify(
      this.amplify + this.skillAmplifyBonus,
      phaseCap,
      this.powerGapCap,
    );
  }

  /** Effective ΔPower amplify ceiling used this battle. */
  powerAmplifyCap(): number {
    return this.powerGapCap;
  }

  /** Advance ATB until a unit is ready, or battle finished. */
  tickUntilReady(maxTicks = 1000): Unit | null {
    if (this.finishReason) return null;
    for (let i = 0; i < maxTicks; i++) {
      this.regenMana();
      for (const u of this.units) {
        if (!u.alive) continue;
        u.atb += u.stats.spd * 0.1;
      }
      const ready = this.units
        .filter((u) => u.alive && u.atb >= ATB_THRESHOLD)
        .sort((a, b) => b.atb - a.atb || b.stats.spd - a.stats.spd);
      if (ready[0]) {
        const unit = ready[0];
        unit.atb = 0;
        tickSkillCooldowns(this.units);
        this.activeUnitId = unit.id;
        this.phase = "await_stone";
        this.skillAmplifyBonus = 0;
        return unit;
      }
    }
    return null;
  }

  private regenMana(): void {
    this.allySummoner.mana = Math.min(
      this.allySummoner.manaMax,
      this.allySummoner.mana + this.allySummoner.manaRegenPerTick,
    );
    this.enemySummoner.mana = Math.min(
      this.enemySummoner.manaMax,
      this.enemySummoner.mana + this.enemySummoner.manaRegenPerTick,
    );
  }

  private summonerOf(team: TeamId): SummonerState {
    return team === "ally" ? this.allySummoner : this.enemySummoner;
  }

  /** Estimate captures if color played at p (trial board). */
  private previewCapture(color: "black" | "white", p: Point): number {
    const trial = Board.fromGrid(this.board.getBoard());
    const ko = this.board.getKoPoint();
    void ko;
    const r = trial.play(color, p);
    return r.ok ? r.capturedCount : -1;
  }

  autoPickStone(unit: Unit): Point | null {
    const suggestions = this.suggestStones(unit);
    return suggestions[0]?.point ?? null;
  }

  /**
   * Top stone candidates for the active (or given) unit — semi-auto preview.
   */
  suggestStones(unit?: Unit | null): StoneSuggestion[] {
    const u =
      unit ??
      (this.activeUnitId ? this.getUnit(this.activeUnitId) : undefined);
    if (!u) return [];
    const color = teamStoneColor(u.team);
    const legal = this.board.legalMoves(color);
    const manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(u.team).boardSense);
    const topN = u.stonePassive === "suggest_plus" ? 4 : 3;
    return rankStoneSuggestions(
      legal,
      this.board.size,
      (p) => ({
        capturedCount: Math.max(0, this.previewCapture(color, p)),
        hasToken: !!this.tokenAt(p.x, p.y),
      }),
      manaMul,
      topN,
    );
  }

  private applyTokenPickup(unit: Unit, token: BoardToken): void {
    this.tokens = this.tokens.filter(
      (t) => !(t.x === token.x && t.y === token.y),
    );
    const name = itemDef(token.id).nameKo;
    if (token.id === "crit_charm") {
      const bonus = unit.stonePassive === "crit_charm_plus" ? 55 * 2 : 55;
      unit.critCharm = (unit.critCharm ?? 0) + bonus;
      this.log.push(
        `${unit.name} 획득 ${name} (치명↑${unit.stonePassive === "crit_charm_plus" ? "×2" : ""})`,
      );
      return;
    }
    if (token.id === "shield_core") {
      const shield = Math.round(unit.stats.hp * 0.18);
      unit.shieldHp = (unit.shieldHp ?? 0) + shield;
      this.log.push(`${unit.name} 획득 ${name} (실드 +${shield})`);
      if (unit.stonePassive === "shield_core_heal") {
        const heal = Math.round(unit.stats.hp * 0.12);
        unit.hp = Math.min(unit.stats.hp, unit.hp + heal);
        this.log.push(`스톤패시브: ${unit.name} 회복 +${heal}`);
      }
      return;
    }
    // capture_magnet
    const manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(unit.team).boardSense);
    const gains = gainsForBoardEvent("item_magnet", 0, manaMul);
    this.amplify = clampAmplify(
      this.amplify + gains.amplifyDelta,
      amplifyCapForPhase(this.circle.boardPhase),
      this.powerGapCap,
    );
    this.skillAmplifyBonus += gains.skillAmplifyBonus;
    const sm = this.summonerOf(unit.team);
    sm.mana = Math.min(sm.manaMax, sm.mana + gains.mana);
    this.log.push(
      `${unit.name} 획득 ${name} (마나 +${Math.round(gains.mana)})`,
    );
  }

  private trySpawnItem(): void {
    const bonus = itemSpawnBonusForPhase(this.circle.boardPhase);
    if (!shouldSpawnItem(bonus, this.rng)) return;

    const size = this.board.size;
    const grid = this.board.getBoard();
    const empty: Point[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y]![x] !== null) continue;
        if (this.tokenAt(x, y)) continue;
        empty.push({ x, y });
      }
    }
    if (empty.length === 0) return;

    const spot = empty[Math.floor(this.rng() * empty.length)]!;
    const id = weightedItemId(this.circle.boardPhase, this.rng);
    this.tokens.push({ id, x: spot.x, y: spot.y });
    this.log.push(`${itemDef(id).nameKo} 스폰 (${spot.x},${spot.y})`);
  }

  /**
   * Stone summon phase. Returns false if illegal.
   */
  playStone(point: Point): boolean {
    if (this.phase !== "await_stone" || !this.activeUnitId) return false;
    const unit = this.getUnit(this.activeUnitId);
    if (!unit) return false;

    const color = teamStoneColor(unit.team);
    const result = this.board.play(color, point);
    if (!result.ok) {
      this.log.push(`illegal stone ${result.reason}`);
      return false;
    }

    const kind = classifyCapture(result.capturedCount);
    let manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(unit.team).boardSense);
    if (unit.stonePassive === "capture_mana" && result.capturedCount > 0) {
      manaMul *= 1.3;
    }
    const gains = gainsForBoardEvent(kind, result.capturedCount, manaMul);

    let ampDelta = gains.amplifyDelta;
    if (unit.stonePassive === "capture_amp" && result.capturedCount > 0) {
      ampDelta += 0.04;
    }
    if (unit.stonePassive === "stone_amp_proc" && this.rng() < 0.15) {
      ampDelta += 0.06;
      this.log.push(`스톤패시브: ${unit.name} 연타착수`);
    }

    this.amplify = clampAmplify(
      this.amplify + ampDelta,
      amplifyCapForPhase(this.circle.boardPhase),
      this.powerGapCap,
    );
    this.skillAmplifyBonus = gains.skillAmplifyBonus;

    const sm = this.summonerOf(unit.team);
    sm.mana = Math.min(sm.manaMax, sm.mana + gains.mana);

    const shapes = detectShapeBonuses(this.board, color, point);
    for (const sh of shapes) {
      this.amplify = clampAmplify(
        this.amplify + sh.amplifyDelta,
        amplifyCapForPhase(this.circle.boardPhase),
        this.powerGapCap,
      );
      if (sh.skillAmplifyBonus) {
        this.skillAmplifyBonus += sh.skillAmplifyBonus;
      }
      sm.mana = Math.min(sm.manaMax, sm.mana + sh.mana * manaMul);
      if (sh.shieldPct) {
        const shield = Math.round(unit.stats.hp * sh.shieldPct);
        unit.shieldHp = (unit.shieldHp ?? 0) + shield;
        this.log.push(`형상 ${sh.labelKo}: 실드 +${shield}`);
      } else {
        this.log.push(`형상 ${sh.labelKo}`);
      }
    }

    if (unit.stonePassive === "capture_crit" && result.capturedCount > 0) {
      unit.critDmgBonus = (unit.critDmgBonus ?? 0) + 10;
      this.log.push(`스톤패시브: ${unit.name} 치피 +10%`);
    }
    if (unit.stonePassive === "stone_ally_atb") {
      const ally = this.units.find(
        (u) =>
          u.alive &&
          u.team === unit.team &&
          u.kind === "monster" &&
          u.id !== unit.id,
      );
      if (ally) {
        ally.atb = Math.min(100, ally.atb + 5);
        this.log.push(`스톤패시브: ${ally.name} ATB +5`);
      }
    }
    if (unit.stonePassive === "stone_ally_heal") {
      const ally =
        this.units
          .filter(
            (u) =>
              u.alive && u.team === unit.team && u.kind === "monster",
          )
          .sort((a, b) => a.hp / a.stats.hp - b.hp / b.stats.hp)[0] ?? unit;
      const heal = Math.round(ally.stats.hp * 0.06);
      ally.hp = Math.min(ally.stats.hp, ally.hp + heal);
      this.log.push(`스톤패시브: ${ally.name} 회복 +${heal}`);
    }

    const picked = this.tokenAt(point.x, point.y);
    if (picked) this.applyTokenPickup(unit, picked);

    const prog = registerStoneSummon(this.circle);
    this.circle = prog.state;
    if (prog.shouldReset) {
      resetBoardInPlace(this.board);
      this.tokens = [];
      this.log.push(
        `강화 진문 ${this.circle.boardPhase} — 보드 재건 (Amp상한 ${amplifyCapForPhase(this.circle.boardPhase)})`,
      );
    } else {
      this.trySpawnItem();
    }

    this.log.push(
      `${unit.name} stone (${point.x},${point.y}) cap=${result.capturedCount} amp=${this.currentAmplify().toFixed(2)}`,
    );
    this.phase = "await_skill";
    return true;
  }

  /** Auto stone then ready for skill. */
  autoStone(): boolean {
    if (!this.activeUnitId) return false;
    const unit = this.getUnit(this.activeUnitId);
    if (!unit) return false;
    const p = this.autoPickStone(unit);
    if (!p) return false;
    return this.playStone(p);
  }

  canUseSummonerSkill(unit: Unit): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    return sm.mana >= sm.manaMax;
  }

  canUseSkill(unit: Unit, skillIndex: number): boolean {
    if (!unit.skills?.[skillIndex]) return skillIndex === 0;
    const cds = ensureSkillCd(unit);
    return (cds[skillIndex] ?? 0) <= 0;
  }

  /**
   * Skill phase. If useSummonerSkill and mana full, cast 진문개방 (AoE).
   * Otherwise cast S1/S2/S3 (or fallback basic) on target.
   */
  useSkill(opts?: {
    targetId?: string;
    useSummonerSkill?: boolean;
    skillIndex?: number;
  }): SkillResult[] {
    if (this.phase !== "await_skill" || !this.activeUnitId) return [];
    const unit = this.getUnit(this.activeUnitId);
    if (!unit) return [];

    const enemies = aliveSummons(
      this.units,
      unit.team === "ally" ? "enemy" : "ally",
    );
    const results: SkillResult[] = [];
    const wantUlt = opts?.useSummonerSkill ?? false;

    if (wantUlt && this.canUseSummonerSkill(unit)) {
      const sm = this.summonerOf(unit.team);
      sm.mana = 0;
      this.skillAmplifyBonus += 0.15;
      this.log.push(`${unit.name} 진문개방`);
      for (const t of enemies) {
        results.push(this.applyHit(unit, t, 1.8, true));
      }
    } else {
      const skillIndex =
        opts?.skillIndex ?? pickAutoSkillIndex(unit, this.units);
      if (!this.canUseSkill(unit, skillIndex) && unit.skills?.[skillIndex]) {
        this.log.push(`${unit.name} 스킬 쿨다운`);
        return [];
      }
      const skill = unit.skills?.[skillIndex];
      if (skill) {
        results.push(
          ...this.resolveSkill(unit, skill, skillIndex, opts?.targetId),
        );
      } else {
        const target = this.resolveSingleTarget(unit, opts?.targetId);
        if (!target) {
          this.phase = "resolved";
          this.activeUnitId = null;
          this.checkFinish();
          return results;
        }
        results.push(this.applyHit(unit, target, unit.skillCoeff, false));
      }
    }

    this.skillAmplifyBonus = 0;
    this.phase = "resolved";
    this.activeUnitId = null;
    this.checkFinish();
    return results;
  }

  private resolveSingleTarget(
    unit: Unit,
    targetId?: string,
  ): Unit | null {
    let target =
      (targetId && this.getUnit(targetId)) ||
      pickDefaultTarget(
        this.units.filter(
          (u) => u.team === (unit.team === "ally" ? "enemy" : "ally"),
        ),
      );
    if (target?.kind === "summoner") {
      target = pickDefaultTarget(
        this.units.filter(
          (u) => u.team === (unit.team === "ally" ? "enemy" : "ally"),
        ),
      );
    }
    if (!target || !target.alive) return null;
    return target;
  }

  private resolveSkill(
    unit: Unit,
    skill: SkillDef,
    skillIndex: number,
    targetId?: string,
  ): SkillResult[] {
    const results: SkillResult[] = [];
    this.log.push(`${unit.name} ${skill.nameKo}`);
    for (const effect of skill.effects) {
      if (effect.kind === "damage") {
        if (effect.target === "all_enemies") {
          const foes = aliveSummons(
            this.units,
            unit.team === "ally" ? "enemy" : "ally",
          );
          for (const t of foes) {
            results.push(this.applyHit(unit, t, effect.coeff, false));
          }
        } else {
          const target = this.resolveSingleTarget(unit, targetId);
          if (target) {
            results.push(this.applyHit(unit, target, effect.coeff, false));
          }
        }
      } else if (effect.kind === "heal") {
        const target =
          effect.target === "self"
            ? unit
            : this.lowestAllyMonster(unit.team) ?? unit;
        const amount = Math.round(target.stats.hp * effect.coeff);
        target.hp = Math.min(target.stats.hp, target.hp + amount);
        this.log.push(`${target.name} 회복 +${amount}`);
        results.push({
          attackerId: unit.id,
          targetId: target.id,
          damage: -amount,
          crit: false,
          usedSummonerSkill: false,
        });
      } else if (effect.kind === "shield") {
        const amount = Math.round(unit.stats.hp * effect.coeff);
        unit.shieldHp = (unit.shieldHp ?? 0) + amount;
        this.log.push(`${unit.name} 실드 +${amount}`);
        results.push({
          attackerId: unit.id,
          targetId: unit.id,
          damage: 0,
          crit: false,
          usedSummonerSkill: false,
        });
      } else if (effect.kind === "mana") {
        const sm = this.summonerOf(unit.team);
        sm.mana = Math.min(sm.manaMax, sm.mana + effect.amount);
        this.log.push(`${unit.name} 마나 +${effect.amount}`);
      }
    }
    const cds = ensureSkillCd(unit);
    cds[skillIndex] = skill.cooldown;
    return results;
  }

  private lowestAllyMonster(team: TeamId): Unit | null {
    const allies = this.units.filter(
      (u) => u.alive && u.team === team && u.kind === "monster",
    );
    if (allies.length === 0) return null;
    return allies.reduce((best, u) =>
      u.hp / u.stats.hp < best.hp / best.stats.hp ? u : best,
    );
  }

  private applyHit(
    attacker: Unit,
    target: Unit,
    coeff: number,
    usedSummonerSkill: boolean,
  ): SkillResult {
    if (target.kind === "summoner") {
      this.log.push(`${target.name}는 후열 — 공격 무효`);
      return {
        attackerId: attacker.id,
        targetId: target.id,
        damage: 0,
        crit: false,
        usedSummonerSkill,
      };
    }

    const critBonus = attacker.critCharm ?? 0;
    if (critBonus > 0) attacker.critCharm = 0;
    const critDmgExtra = attacker.critDmgBonus ?? 0;
    if (critDmgExtra > 0) attacker.critDmgBonus = 0;

    let incomingMul = 1;
    if (
      target.stonePassive === "high_amp_dr" &&
      this.currentAmplify() >= 1.08
    ) {
      incomingMul = 0.9;
    }

    const { damage, crit } = computeDamage({
      atk: attacker.stats.atk,
      skillCoeff: coeff,
      attackerElement: attacker.element,
      defenderElement: target.element,
      defenderDef: target.stats.def,
      amplify: this.currentAmplify(),
      critRate: attacker.stats.critRate + critBonus,
      critDmg: attacker.stats.critDmg + critDmgExtra,
      rng: this.rng,
    });

    let remaining = Math.round(damage * incomingMul);
    if (target.shieldHp && target.shieldHp > 0) {
      const absorbed = Math.min(target.shieldHp, remaining);
      target.shieldHp -= absorbed;
      remaining -= absorbed;
      if (target.shieldHp <= 0) target.shieldHp = 0;
    }

    target.hp = Math.max(0, target.hp - remaining);
    if (target.hp <= 0) {
      target.alive = false;
      this.log.push(`${target.name} defeated`);
    }
    return {
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      crit,
      usedSummonerSkill,
    };
  }

  private checkFinish(): void {
    // Defeat = all ally summons fallen.
    if (aliveSummons(this.units, "ally").length === 0) {
      this.finishReason = "enemy_win";
      this.phase = "finished";
      return;
    }
    // Enemy summons wiped — advance wave or win.
    if (aliveSummons(this.units, "enemy").length === 0) {
      if (this.currentWave < this.totalWaves && this.spawnWaveFn) {
        this.advanceWave();
        return;
      }
      this.finishReason = "ally_win";
      this.phase = "finished";
    }
  }

  /** Replace fallen enemy summons with the next wave; keep board & summoners. */
  private advanceWave(): void {
    const next = this.currentWave + 1;
    const spawned = this.spawnWaveFn!(next).map((u) => ({
      ...u,
      stats: { ...u.stats },
      alive: true,
      atb: 0,
      hp: u.hp ?? u.stats.hp,
    }));
    // Drop dead enemy monsters; keep summoners + allies + living (none)
    this.units = [
      ...this.units.filter(
        (u) => !(u.team === "enemy" && u.kind === "monster"),
      ),
      ...spawned,
    ];
    this.currentWave = next;
    this.log.push(`웨이브 ${this.currentWave}/${this.totalWaves} 출현`);
    // Soft reset ATB pressure: nudge ally ATB down slightly so wave isn't insta-cleared
    for (const u of this.units) {
      if (u.team === "ally" && u.kind === "monster") {
        u.atb = Math.min(u.atb, 40);
      }
    }
  }

  /** Run one full auto turn: ATB → stone → skill. */
  runAutoTurn(): SkillResult[] {
    const unit = this.tickUntilReady();
    if (!unit) return [];
    if (!this.autoStone()) return [];
    if (this.canUseSummonerSkill(unit)) {
      return this.useSkill({ useSummonerSkill: true });
    }
    return this.useSkill({
      skillIndex: pickAutoSkillIndex(unit, this.units),
    });
  }
}

export function makeUnit(
  partial: Omit<Unit, "hp" | "atb" | "alive"> & { hp?: number },
): Unit {
  const skills = partial.skills;
  const skillCd =
    partial.skillCd ??
    (skills ? skills.map(() => 0) : undefined);
  return {
    ...partial,
    skills,
    skillCd,
    hp: partial.hp ?? partial.stats.hp,
    atb: 0,
    alive: true,
  };
}
