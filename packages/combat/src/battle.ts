import {
  Board,
  amplifyCapForPhase,
  createCirclePhaseState,
  manaBonusMultiplierForPhase,
  registerStoneSummon,
  resetBoardInPlace,
  type CirclePhaseState,
  type CombatBoardSize,
  type Point,
} from "stonesummoner-board";
import { pickAutoStone, pickDefaultTarget, teamStoneColor } from "./ai.js";
import { classifyCapture, gainsForBoardEvent } from "./boardEvents.js";
import { clampAmplify, computeDamage } from "./damage.js";
import type {
  BattlePhase,
  FinishReason,
  SummonerState,
  TeamId,
  Unit,
} from "./types.js";

const ATB_THRESHOLD = 100;

export interface BattleConfig {
  boardSize: CombatBoardSize;
  units: Unit[];
  allySummoner: SummonerState;
  enemySummoner: SummonerState;
  /** Optional power-gap amplify cap (default 1.25). */
  powerGapAmplifyCap?: number;
  rng?: () => number;
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
  amplify = 1;
  skillAmplifyBonus = 0;
  phase: BattlePhase = "idle";
  activeUnitId: string | null = null;
  finishReason: FinishReason = null;
  log: string[] = [];
  private powerGapCap: number;
  private rng: () => number;

  constructor(config: BattleConfig) {
    this.board = new Board(config.boardSize);
    this.circle = createCirclePhaseState(config.boardSize);
    this.units = config.units.map((u) => ({ ...u, stats: { ...u.stats } }));
    this.allySummoner = { ...config.allySummoner };
    this.enemySummoner = { ...config.enemySummoner };
    this.powerGapCap = config.powerGapAmplifyCap ?? 1.25;
    this.rng = config.rng ?? Math.random;
  }

  getUnit(id: string): Unit | undefined {
    return this.units.find((u) => u.id === id);
  }

  alive(team?: TeamId): Unit[] {
    return this.units.filter((u) => u.alive && (team ? u.team === team : true));
  }

  currentAmplify(): number {
    const phaseCap = amplifyCapForPhase(this.circle.boardPhase);
    return clampAmplify(
      this.amplify + this.skillAmplifyBonus,
      phaseCap,
      this.powerGapCap,
    );
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
    // Board doesn't expose setKo — trial starts ko-null; good enough for AI
    void ko;
    const r = trial.play(color, p);
    return r.ok ? r.capturedCount : -1;
  }

  autoPickStone(unit: Unit): Point | null {
    const color = teamStoneColor(unit.team);
    const legal = this.board.legalMoves(color);
    return pickAutoStone(legal, this.board.size, (p) =>
      Math.max(0, this.previewCapture(color, p)),
    );
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
    const manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(unit.team).boardSense);
    const gains = gainsForBoardEvent(kind, result.capturedCount, manaMul);

    this.amplify = clampAmplify(
      this.amplify + gains.amplifyDelta,
      amplifyCapForPhase(this.circle.boardPhase),
      this.powerGapCap,
    );
    this.skillAmplifyBonus = gains.skillAmplifyBonus;

    const sm = this.summonerOf(unit.team);
    sm.mana = Math.min(sm.manaMax, sm.mana + gains.mana);

    const prog = registerStoneSummon(this.circle);
    this.circle = prog.state;
    if (prog.shouldReset) {
      resetBoardInPlace(this.board);
      this.log.push(`empowered circle phase ${this.circle.boardPhase}`);
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

  /**
   * Skill phase. If useSummonerSkill and mana full, cast 진문개방 (AoE).
   * Otherwise basic attack on target (or auto-pick).
   */
  useSkill(opts?: {
    targetId?: string;
    useSummonerSkill?: boolean;
  }): SkillResult[] {
    if (this.phase !== "await_skill" || !this.activeUnitId) return [];
    const unit = this.getUnit(this.activeUnitId);
    if (!unit) return [];

    const enemies = this.alive(unit.team === "ally" ? "enemy" : "ally");
    const results: SkillResult[] = [];
    const wantUlt = opts?.useSummonerSkill ?? this.canUseSummonerSkill(unit);

    if (wantUlt && this.canUseSummonerSkill(unit)) {
      const sm = this.summonerOf(unit.team);
      sm.mana = 0;
      this.skillAmplifyBonus += 0.15;
      this.log.push(`${unit.name} 진문개방`);
      for (const t of enemies) {
        const dmg = this.applyHit(unit, t, 1.8, true);
        results.push(dmg);
      }
    } else {
      let target =
        (opts?.targetId && this.getUnit(opts.targetId)) ||
        pickDefaultTarget(enemies);
      if (!target || !target.alive) {
        this.phase = "resolved";
        this.activeUnitId = null;
        this.checkFinish();
        return results;
      }
      results.push(this.applyHit(unit, target, unit.skillCoeff, false));
    }

    this.skillAmplifyBonus = 0;
    this.phase = "resolved";
    this.activeUnitId = null;
    this.checkFinish();
    return results;
  }

  private applyHit(
    attacker: Unit,
    target: Unit,
    coeff: number,
    usedSummonerSkill: boolean,
  ): SkillResult {
    const { damage, crit } = computeDamage({
      atk: attacker.stats.atk,
      skillCoeff: coeff,
      attackerElement: attacker.element,
      defenderElement: target.element,
      defenderDef: target.stats.def,
      amplify: this.currentAmplify(),
      critRate: attacker.stats.critRate,
      critDmg: attacker.stats.critDmg,
      rng: this.rng,
    });
    target.hp = Math.max(0, target.hp - damage);
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
    const allySum = this.units.find(
      (u) => u.team === "ally" && u.kind === "summoner",
    );
    const enemySum = this.units.find(
      (u) => u.team === "enemy" && u.kind === "summoner",
    );
    if (allySum && !allySum.alive) {
      this.finishReason = "enemy_win";
      this.phase = "finished";
      return;
    }
    if (enemySum && !enemySum.alive) {
      this.finishReason = "ally_win";
      this.phase = "finished";
      return;
    }
    if (this.alive("ally").length === 0) {
      this.finishReason = "enemy_win";
      this.phase = "finished";
    } else if (this.alive("enemy").length === 0) {
      this.finishReason = "ally_win";
      this.phase = "finished";
    }
  }

  /** Run one full auto turn: ATB → stone → skill. */
  runAutoTurn(): SkillResult[] {
    const unit = this.tickUntilReady();
    if (!unit) return [];
    if (!this.autoStone()) return [];
    return this.useSkill({ useSummonerSkill: this.canUseSummonerSkill(unit) });
  }
}

export function makeUnit(
  partial: Omit<Unit, "hp" | "atb" | "alive"> & { hp?: number },
): Unit {
  return {
    ...partial,
    hp: partial.hp ?? partial.stats.hp,
    atb: 0,
    alive: true,
  };
}
