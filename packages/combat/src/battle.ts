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
import { pickExpertStone } from "./stoneTactic.js";
import {
  classifyCapture,
  gainsForBoardEvent,
} from "./boardEvents.js";
import { composeSummonerUlt } from "./summonerUlt.js";
import { detectShapeBonuses, randomStarPoints } from "./shapes.js";
import {
  circleEventName,
  rollCircleEvent,
  shouldRollCircleEvent,
  type CircleEventId,
} from "./circleEvents.js";
import {
  CAPTURE_SHOP_THRESHOLD,
  pickCaptureShopChoice,
  type CaptureShopChoice,
} from "./captureShop.js";
import { clampAmplify, computeDamage } from "./damage.js";
import {
  itemDef,
  shouldSpawnItem,
  weightedItemId,
  type BoardItemId,
  type BoardToken,
  type BaitLure,
  type TempSeal,
} from "./items.js";
import {
  SKILL_DMG_MUL,
  type SkillDef,
  type SkillEffect,
} from "stonesummoner-data";
import type {
  BattlePhase,
  Element,
  FinishReason,
  SummonerState,
  TeamId,
  Unit,
} from "./types.js";
import {
  randomVictoryPoint,
  BRILLIANT_MISSION_GOAL,
  DUAL_BOARD_SWITCH_INTERVAL,
  randomForbiddenZone,
  pickCircleElement,
  type BattleModules,
} from "./modules.js";

const ATB_THRESHOLD = 100;

function ensureSkillCd(unit: Unit): number[] {
  const n = unit.skills?.length ?? 0;
  if (!unit.skillCd || unit.skillCd.length !== n) {
    unit.skillCd = Array.from({ length: Math.max(n, 3) }, () => 0);
  }
  return unit.skillCd;
}

function tickSkillCooldowns(unit: Unit): void {
  if (!unit.alive || unit.kind !== "monster" || !unit.skillCd) return;
  unit.skillCd = unit.skillCd.map((c) => Math.max(0, c - 1));
}

/** Auto skill pick: S3→S2→S1; healers prefer heal when ally < 55% HP. */
export function pickAutoSkillIndex(unit: Unit, units: Unit[]): number {
  const skills = unit.skills;
  if (!skills?.length) return 0;
  if ((unit.stunnedTurns ?? 0) > 0) return 0;
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
  /** Extra amplify phase cap from circle inscriptions. */
  inscriptionAmplifyCapAdd?: number;
  /** Extra board-item spawn chance from circle inscriptions. */
  inscriptionItemSpawnBonus?: number;
  rng?: () => number;
  /** Override empowered reset threshold (default 50 on 7×7). */
  resetThreshold?: number;
  /** Total waves (default 1). When enemy summons wipe mid-battle, next wave spawns. */
  totalWaves?: number;
  /**
   * Build enemy monster units for wave index (1-based).
   * Wave 1 is already in `units`; called for wave 2+.
   */
  spawnWave?: (wave: number) => Unit[];
  /** Magic-circle module flags (B–G + mana race). */
  modules?: BattleModules;
  /** Module E: affinity element for this battle. */
  circleElement?: Element;
}

export interface SkillResult {
  attackerId: string;
  targetId: string;
  damage: number;
  crit: boolean;
  usedSummonerSkill: boolean;
  /** Stable skill identity for battle presentation and telemetry. */
  skillId?: string;
  /** Stable painted art/VFX identity. */
  vfxId?: string;
  /** All effects represented by this cast, including non-damage effects. */
  effectKinds?: string[];
}

export interface SkillPresentation {
  attackerId: string;
  skillId: string;
  vfxId?: string;
  effectKinds: string[];
  usedSummonerSkill: boolean;
  targetIds: string[];
}

export type StoneReportChipKind =
  | "atk"
  | "def"
  | "spd"
  | "crit"
  | "mana"
  | "capture"
  | "gold"
  | "crystal"
  | "victory"
  | "token"
  | "shape"
  | "heal"
  | "shield"
  | "seal"
  | "dmg";

export interface StoneReportChip {
  kind: StoneReportChipKind;
  n?: number;
  /** BoardItemId or ShapeBonusId */
  id?: string;
}

export interface StoneReport {
  team: TeamId;
  x: number;
  y: number;
  event: "safe_place" | "capture" | "special";
  capturedCount: number;
  chips: StoneReportChip[];
  /** UI: show full result sheet instead of brief inline chips only. */
  showResultSheet?: boolean;
}

export class Battle {
  /**
   * Last team that placed a stone. Go-like alternation: if the same team
   * acts again (SPD / violent), skip stone and go straight to skill.
   */
  lastStoneTeam: TeamId | null = null;
  /**
   * Last enemy stone still on its board (manual place hint). Cleared on
   * circle rebuild or when that stone is captured / overwritten.
   */
  lastEnemyStone: { x: number; y: number; boardIndex: number } | null = null;
  /** UI readout for the stone that just landed. */
  lastStoneReport: StoneReport | null = null;
  /** Bumps on every circle wipe (full board or empowered 7×7). UI rekindle FX. */
  boardClearSeq = 0;
  /** One or two boards (쌍국). Prefer `board` getter for the active one. */
  readonly boards: Board[];
  activeBoardIndex = 0;
  /** Tokens per board index. */
  private tokensByBoard: BoardToken[][] = [];
  circle: CirclePhaseState;
  units: Unit[];
  allySummoner: SummonerState;
  enemySummoner: SummonerState;
  amplify = 1;
  skillAmplifyBonus = 0;
  /**
   * Next monster hit damage mul bonus per team (from captures: N×CAPTURE_DAMAGE_PER_STONE).
   * Consumed on the next monster `applyHit` for that team.
   */
  pendingCaptureDamageBonus: Record<TeamId, number> = {
    ally: 0,
    enemy: 0,
  };
  phase: BattlePhase = "idle";
  activeUnitId: string | null = null;
  finishReason: FinishReason = null;
  log: string[] = [];
  /** Metadata for the most recent cast, including non-damaging skills. */
  lastSkillPresentation: SkillPresentation | null = null;
  /** Module C: fog reduces stone suggestion count. */
  fogTurns = 0;
  /** Module E/F. */
  modules: BattleModules;
  circleElement: Element | null;
  victoryPoint: Point | null;
  manaSealed: boolean;
  victoryPointClaimed: boolean;
  /** Random 화점 seats for this fight (shown from turn 1). */
  hoshiPoints: Point[] = [];
  /** Module G: 묘수 hits toward mission. */
  brilliantCount = 0;
  brilliantGoal = BRILLIANT_MISSION_GOAL;
  brilliantDone = false;
  /** Arena mana race winner. */
  manaRaceWinner: TeamId | null = null;
  /** 금기구역 points. */
  forbiddenZone: Point[] = [];
  /** Per-board temporary seals (봉인못). */
  private sealsByBoard: TempSeal[][] = [];
  /** Active AI lure from 미끼돌 (shared; cleared on empowered reset). */
  baitLure: BaitLure | null = null;
  /**
   * After empowered 7×7 reset: next stone play gets center-biased suggest
   * and a small Amp/mana 포석 보너스.
   */
  openingBonusPending = false;
  /** Ally large-capture shop waiting for choice. */
  pendingCaptureShop: { unitId: string } | null = null;
  /** 1-based current wave. */
  currentWave: number;
  readonly totalWaves: number;
  /** Completed skill/attack turns (not stone-only or skipped stun). */
  attackTurnCount = 0;
  /** Ally HP damage actually applied to enemies (no overkill / shield). */
  allyDamageDealt = 0;
  private powerGapCap: number;
  private inscriptionAmplifyAdd: number;
  private inscriptionItemSpawn: number;
  private rng: () => number;
  private spawnWaveFn?: (wave: number) => Unit[];

  get board(): Board {
    return this.boards[this.activeBoardIndex]!;
  }

  get tokens(): BoardToken[] {
    return this.tokensByBoard[this.activeBoardIndex]!;
  }

  set tokens(next: BoardToken[]) {
    this.tokensByBoard[this.activeBoardIndex] = next;
  }

  get tempSeals(): TempSeal[] {
    return this.sealsByBoard[this.activeBoardIndex]!;
  }

  set tempSeals(next: TempSeal[]) {
    this.sealsByBoard[this.activeBoardIndex] = next;
  }

  constructor(config: BattleConfig) {
    const dual = !!config.modules?.dualBoard;
    this.boards = dual
      ? [new Board(config.boardSize), new Board(config.boardSize)]
      : [new Board(config.boardSize)];
    this.tokensByBoard = this.boards.map(() => []);
    this.sealsByBoard = this.boards.map(() => []);
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
    this.inscriptionAmplifyAdd = config.inscriptionAmplifyCapAdd ?? 0;
    this.inscriptionItemSpawn = config.inscriptionItemSpawnBonus ?? 0;
    this.rng = config.rng ?? Math.random;
    this.modules = config.modules ?? {};
    this.circleElement =
      config.circleElement ??
      (this.modules.moduleE ? pickCircleElement(this.rng) : null);
    this.manaSealed = !!this.modules.moduleF;
    this.victoryPointClaimed = false;
    this.manaRaceWinner = null;
    this.pendingCaptureShop = null;
    this.forbiddenZone =
      this.modules.forbidZone || this.modules.moduleC
        ? randomForbiddenZone(config.boardSize, this.rng)
        : [];
    this.victoryPoint = this.modules.moduleF
      ? randomVictoryPoint(config.boardSize, this.rng, this.forbiddenZone)
      : null;
    this.hoshiPoints = randomStarPoints(
      config.boardSize,
      this.rng,
      this.forbiddenZone,
    );
    this.totalWaves = Math.max(1, config.totalWaves ?? 1);
    this.currentWave = 1;
    this.spawnWaveFn = config.spawnWave;
    if (this.modules.moduleE && this.circleElement) {
      this.log.push(`속성진: ${this.circleElement} 테두리`);
    }
    if (this.modules.moduleF && this.victoryPoint) {
      this.log.push(
        `보스보드: 필승점 (${this.victoryPoint.x},${this.victoryPoint.y}) · 마나봉인`,
      );
    }
    if (this.modules.moduleG) {
      this.log.push(`묘수 미션: 추천 착수 ${this.brilliantGoal}회`);
    }
    if (this.modules.manaRace) {
      this.log.push(`맞마나 레이스: 먼저 마나 풀충전`);
    }
    if (this.forbiddenZone.length) {
      this.log.push(`금기구역: ${this.forbiddenZone.length}점 착수 금지`);
    }
    if (this.boards.length > 1) {
      this.log.push(`쌍국: A국·B국 — ${DUAL_BOARD_SWITCH_INTERVAL}수마다 전환`);
    }
    this.applySymbolStartShields();
  }

  /** 보강: pool wearers' HP×pct onto every ally monster for N turns. */
  private applySymbolStartShields(): void {
    for (const team of ["ally", "enemy"] as const) {
      const mons = this.units.filter(
        (u) => u.alive && u.team === team && u.kind === "monster",
      );
      const pool = mons.reduce(
        (sum, u) => sum + Math.round((u.startShieldPct ?? 0) * u.stats.hp),
        0,
      );
      if (pool <= 0) continue;
      const turns = Math.max(
        ...mons.map((u) => (u.startShieldPct ? 3 : 0)),
        0,
      );
      for (const u of mons) {
        u.shieldHp = (u.shieldHp ?? 0) + pool;
        u.shieldTurns = Math.max(u.shieldTurns ?? 0, turns);
      }
      this.log.push(
        `보강 실드 (${team === "ally" ? "아군" : "적군"} +${pool} · ${turns}턴)`,
      );
    }
  }

  get boardLabel(): string {
    if (this.boards.length < 2) return "";
    return this.activeBoardIndex === 0 ? "A국" : "B국";
  }

  /** Switch active board (쌍국). */
  switchBoard(reason = "전환"): boolean {
    if (this.boards.length < 2) return false;
    this.activeBoardIndex = 1 - this.activeBoardIndex;
    this.log.push(`쌍국 ${reason}: ${this.boardLabel}`);
    return true;
  }

  isForbidden(p: Point): boolean {
    if (this.forbiddenZone.some((z) => z.x === p.x && z.y === p.y)) return true;
    return this.tempSeals.some((z) => z.x === p.x && z.y === p.y);
  }

  isBaitLureFor(team: TeamId, p: Point): boolean {
    const bait = this.baitLure;
    if (!bait || bait.targetTeam !== team) return false;
    return bait.x === p.x && bait.y === p.y;
  }

  getUnit(id: string): Unit | undefined {
    return this.units.find((u) => u.id === id);
  }

  /** True when this team must place a stone before the current ATB action. */
  needsStoneFor(team: TeamId): boolean {
    return this.lastStoneTeam !== team;
  }

  alive(team?: TeamId): Unit[] {
    return this.units.filter((u) => u.alive && (team ? u.team === team : true));
  }

  tokenAt(x: number, y: number): BoardToken | undefined {
    return this.tokens.find((t) => t.x === x && t.y === y);
  }

  /** Amplify ceiling from empowered circle phase + inscriptions. */
  phaseAmplifyCap(): number {
    return amplifyCapForPhase(this.circle.boardPhase) + this.inscriptionAmplifyAdd;
  }

  currentAmplify(): number {
    const phaseCap = this.phaseAmplifyCap();
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
    if (this.phase === "await_wave") return null;
    for (let i = 0; i < maxTicks; i++) {
      this.regenMana();
      for (const u of this.units) {
        if (!u.alive) continue;
        const spdMul = (u.spdBoostTurns ?? 0) > 0 ? 1.4 : 1;
        const spdBuff = 1 + (u.spdBuffPct ?? 0);
        u.atb += u.stats.spd * 0.1 * spdMul * spdBuff;
      }
      const ready = this.units
        .filter((u) => u.alive && u.atb >= ATB_THRESHOLD)
        .sort((a, b) => b.atb - a.atb || b.stats.spd - a.stats.spd);
      if (ready[0]) {
        const unit = ready[0];
        unit.atb = 0;
        if ((unit.spdBoostTurns ?? 0) > 0) {
          unit.spdBoostTurns = (unit.spdBoostTurns ?? 0) - 1;
        }
        if ((unit.statusImmuneTurns ?? 0) > 0) {
          unit.statusImmuneTurns = (unit.statusImmuneTurns ?? 0) - 1;
        }
        if ((unit.stunnedTurns ?? 0) > 0) {
          unit.stunnedTurns = (unit.stunnedTurns ?? 0) - 1;
          this.log.push(`${unit.name} 기절 — 행동 불가`);
          tickSkillCooldowns(unit);
          continue;
        }
        if ((unit.shieldTurns ?? 0) > 0) {
          unit.shieldTurns = (unit.shieldTurns ?? 0) - 1;
          if ((unit.shieldTurns ?? 0) <= 0) {
            unit.shieldTurns = 0;
            unit.shieldHp = 0;
          }
        }
        tickSkillCooldowns(unit);
        if ((unit.dotTicks ?? 0) > 0 && (unit.dotSourceAtk ?? 0) > 0) {
          const dotDmg = Math.round(
            (unit.dotSourceAtk ?? 0) * (unit.dotAtkCoeff ?? 0),
          );
          if (dotDmg > 0 && unit.alive) {
            unit.hp = Math.max(0, unit.hp - dotDmg);
            this.log.push(`${unit.name} 지속피해 ${dotDmg}`);
            if (unit.hp <= 0) {
              unit.alive = false;
              this.log.push(`${unit.name} defeated`);
            }
          }
        }
        for (const u of this.units) {
          this.tickStatus(u);
        }
        this.activeUnitId = unit.id;
        // Go-like stone by TEAM, not by summoner vs monster: if this side
        // already placed, skip stone (SPD / violent extras). Opponent monster
        // turns still place.
        this.phase = this.needsStoneFor(unit.team)
          ? "await_stone"
          : "await_skill";
        if (this.phase === "await_stone") this.ensurePlayableCircle();
        this.skillAmplifyBonus = 0;
        return unit;
      }
    }
    return null;
  }

  private regenMana(): void {
    const allyRegen = this.manaSealed
      ? this.allySummoner.manaRegenPerTick * 0.1
      : this.allySummoner.manaRegenPerTick;
    this.allySummoner.mana = Math.min(
      this.allySummoner.manaMax,
      this.allySummoner.mana + allyRegen,
    );
    this.enemySummoner.mana = Math.min(
      this.enemySummoner.manaMax,
      this.enemySummoner.mana + this.enemySummoner.manaRegenPerTick,
    );
    this.checkManaRace("ally");
    this.checkManaRace("enemy");
  }

  private checkManaRace(team: TeamId): void {
    if (!this.modules.manaRace || this.manaRaceWinner) return;
    const sm = this.summonerOf(team);
    if (sm.mana < sm.manaMax) return;
    this.manaRaceWinner = team;
    this.amplify = clampAmplify(
      this.amplify + 0.08,
      this.phaseAmplifyCap(),
      this.powerGapCap,
    );
    this.log.push(
      `맞마나 레이스: ${team === "ally" ? "아군" : "적"} 승리 (Amp+)`,
    );
  }

  summonerOf(team: TeamId): SummonerState {
    return team === "ally" ? this.allySummoner : this.enemySummoner;
  }

  private isPhase(phase: BattlePhase): boolean {
    return this.phase === phase;
  }

  /** Estimate captures if color played at p (trial board). */
  private previewCapture(color: "black" | "white", p: Point): number {
    const trial = this.board.clone();
    const r = trial.play(color, p);
    return r.ok ? r.capturedCount : -1;
  }

  /** Legal, unsealed intersections the unit may play. */
  playableStonePoints(unit: Unit): Point[] {
    const color = teamStoneColor(unit.team);
    return this.board.legalMoves(color).filter((p) => !this.isForbidden(p));
  }

  /**
   * If the active unit has nowhere to play, wipe the circle so the turn
   * can continue. Returns true when a wipe ran.
   */
  ensurePlayableCircle(): boolean {
    const unit = this.activeUnitId ? this.getUnit(this.activeUnitId) : null;
    if (!unit) return false;
    if (this.playableStonePoints(unit).length > 0) return false;
    this.wipeCircle("full");
    return true;
  }

  private wipeCircle(kind: "empowered" | "full"): void {
    for (const b of this.boards) resetBoardInPlace(b);
    this.tokensByBoard = this.boards.map(() => []);
    this.sealsByBoard = this.boards.map(() => []);
    this.baitLure = null;
    this.lastEnemyStone = null;
    this.boardClearSeq += 1;
    if (kind === "empowered") {
      this.openingBonusPending = true;
      this.log.push(
        `강화 진문 ${this.circle.boardPhase} — 보드 재건 (Amp상한 ${this.phaseAmplifyCap()})`,
      );
      this.log.push(`진문 붕괴 → 재점화 · 다음 착수 포석 보너스`);
      if (this.modules.moduleF) {
        this.log.push(`진형파괴 — 보스 페이즈 보드 재건`);
      }
      return;
    }
    this.log.push(`진문 붕괴 → 재점화`);
  }

  autoPickStone(unit: Unit): Point | null {
    const color = teamStoneColor(unit.team);
    const legal = this.playableStonePoints(unit);
    if (legal.length === 0) return null;
    if (unit.team === "enemy") {
      return (
        pickExpertStone(this.board, color, legal, {
          hasToken: (p) => !!this.tokenAt(p.x, p.y),
          baitLure: (p) => this.isBaitLureFor(unit.team, p),
          openingBias: this.openingBonusPending,
          stars: this.hoshiPoints,
        }) ?? legal[0]!
      );
    }
    return this.suggestStones(unit)[0]?.point ?? null;
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
    const legal = this.playableStonePoints(u);
    const manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(u.team).boardSense);
    const topN =
      this.fogTurns > 0
        ? 1
        : u.stonePassive === "suggest_plus"
          ? 4
          : 3;
    return rankStoneSuggestions(
      legal,
      this.board.size,
      (p) => ({
        capturedCount: Math.max(0, this.previewCapture(color, p)),
        hasToken: !!this.tokenAt(p.x, p.y),
        baitLure: this.isBaitLureFor(u.team, p),
        hoshi: this.hoshiPoints.some((h) => h.x === p.x && h.y === p.y),
      }),
      manaMul,
      topN,
      this.openingBonusPending ? 8 : 0,
    );
  }

  private applyTokenPickup(unit: Unit, token: BoardToken): StoneReportChip[] {
    this.tokens = this.tokens.filter(
      (t) => !(t.x === token.x && t.y === token.y),
    );
    const name = itemDef(token.id).nameKo;
    const chips: StoneReportChip[] = [{ kind: "token", id: token.id }];
    if (token.id === "crit_charm") {
      const bonus = unit.stonePassive === "crit_charm_plus" ? 75 * 2 : 75;
      unit.critCharm = (unit.critCharm ?? 0) + bonus;
      chips.push({ kind: "crit", n: bonus });
      this.log.push(
        `${unit.name} 획득 ${name} (치명↑${unit.stonePassive === "crit_charm_plus" ? "×2" : ""})`,
      );
      return chips;
    }
    if (token.id === "shield_core") {
      const shield = Math.round(unit.stats.hp * 0.28);
      unit.shieldHp = (unit.shieldHp ?? 0) + shield;
      chips.push({ kind: "shield", n: shield });
      this.log.push(`${unit.name} 획득 ${name} (실드 +${shield})`);
      if (unit.stonePassive === "shield_core_heal") {
        const heal = Math.round(unit.stats.hp * 0.12);
        unit.hp = Math.min(unit.stats.hp, unit.hp + heal);
        chips.push({ kind: "heal", n: heal });
        this.log.push(`스톤패시브: ${unit.name} 회복 +${heal}`);
      }
      return chips;
    }
    if (token.id === "stride_sand") {
      let boosted = 0;
      for (const u of this.units) {
        if (!u.alive || u.team !== unit.team || u.kind !== "monster") continue;
        u.atb = Math.min(ATB_THRESHOLD, u.atb + 50);
        boosted++;
      }
      unit.spdBoostTurns = (unit.spdBoostTurns ?? 0) + 3;
      chips.push({ kind: "spd", n: boosted });
      this.log.push(
        `${unit.name} 획득 ${name} (아군 ATB↑×${boosted} · 공속 2행동)`,
      );
      return chips;
    }
    if (token.id === "seal_nail") {
      const sealed = this.applySealNail({ x: token.x, y: token.y });
      chips.push({ kind: "seal", n: sealed });
      this.log.push(
        `${unit.name} 획득 ${name} (금수 ${sealed}점 · 3수)`,
      );
      return chips;
    }
    if (token.id === "element_ward") {
      const sm = this.summonerOf(unit.team);
      sm.elementWardElement = unit.element;
      sm.elementWardCharges = 3;
      this.amplify = clampAmplify(
        this.amplify + 0.08,
        this.phaseAmplifyCap(),
        this.powerGapCap,
      );
      chips.push({ kind: "atk", n: 8 });
      this.log.push(
        `${unit.name} 획득 ${name} (${unit.element} · 동속성 3수 Amp)`,
      );
      return chips;
    }
    if (token.id === "bait_stone") {
      const shield = Math.round(unit.stats.hp * 0.15);
      unit.shieldHp = (unit.shieldHp ?? 0) + shield;
      this.amplify = clampAmplify(
        this.amplify + 0.05,
        this.phaseAmplifyCap(),
        this.powerGapCap,
      );
      const lure = this.placeBaitLure({ x: token.x, y: token.y }, unit.team);
      chips.push({ kind: "shield", n: shield });
      this.log.push(
        `${unit.name} 획득 ${name} (실드 +${shield}${lure ? ` · 미끼 (${lure.x},${lure.y})` : ""})`,
      );
      return chips;
    }
    if (token.id === "transform_dust") {
      const flipped = this.applyTransformDust({ x: token.x, y: token.y });
      this.amplify = clampAmplify(
        this.amplify + 0.06 + flipped * 0.03,
        this.phaseAmplifyCap(),
        this.powerGapCap,
      );
      chips.push({ kind: "dmg", n: flipped });
      this.log.push(
        `${unit.name} 획득 ${name} (인접 변환 ${flipped})`,
      );
      return chips;
    }
    if (token.id === "heal_orb") {
      const healed = this.applyPercentHpToTeam(unit.team, 0.28, "heal");
      chips.push({ kind: "heal", n: healed });
      this.log.push(`${unit.name} 획득 ${name} (아군 회복 ${healed})`);
      return chips;
    }
    if (token.id === "hp_bomb") {
      const foe = unit.team === "ally" ? "enemy" : "ally";
      const dmg = this.applyPercentHpToTeam(foe, 0.24, "hurt");
      if (unit.team === "ally" && dmg > 0) this.allyDamageDealt += dmg;
      chips.push({ kind: "dmg", n: dmg });
      this.log.push(`${unit.name} 획득 ${name} (적 피해 ${dmg})`);
      return chips;
    }
    // capture_magnet
    const manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(unit.team).boardSense);
    const gains = gainsForBoardEvent("item_magnet", 0, manaMul);
    this.amplify = clampAmplify(
      this.amplify + gains.amplifyDelta,
      this.phaseAmplifyCap(),
      this.powerGapCap,
    );
    this.skillAmplifyBonus += gains.skillAmplifyBonus;
    const sm = this.summonerOf(unit.team);
    const mana = Math.round(gains.mana);
    sm.mana = Math.min(sm.manaMax, sm.mana + gains.mana);
    chips.push({ kind: "mana", n: mana });
    this.log.push(
      `${unit.name} 획득 ${name} (마나 +${mana})`,
    );
    return chips;
  }

  /** Seal up to 2 adjacent empty points for ~3 stone plays. */
  private applySealNail(origin: Point): number {
    const size = this.board.size;
    const grid = this.board.getBoard();
    const dirs: Point[] = [
      { x: origin.x + 1, y: origin.y },
      { x: origin.x - 1, y: origin.y },
      { x: origin.x, y: origin.y + 1 },
      { x: origin.x, y: origin.y - 1 },
    ];
    const candidates = dirs.filter((p) => {
      if (p.x < 0 || p.y < 0 || p.x >= size || p.y >= size) return false;
      if (grid[p.y]![p.x] !== null) return false;
      if (this.isForbidden(p)) return false;
      if (this.tokenAt(p.x, p.y)) return false;
      return true;
    });
    // Shuffle lightly via rng picks
    const picked: Point[] = [];
    const pool = [...candidates];
    while (picked.length < 2 && pool.length > 0) {
      const i = Math.floor(this.rng() * pool.length);
      picked.push(pool.splice(i, 1)[0]!);
    }
    if (picked.length === 0) {
      const empty: Point[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (grid[y]![x] !== null) continue;
          if (x === origin.x && y === origin.y) continue;
          if (this.isForbidden({ x, y })) continue;
          empty.push({ x, y });
        }
      }
      if (empty.length > 0) {
        const i = Math.floor(this.rng() * empty.length);
        picked.push(empty[i]!);
      }
    }
    // remaining=4 so end-of-play tick leaves 3 plays of seal
    const next = [...this.tempSeals];
    for (const p of picked) {
      next.push({ x: p.x, y: p.y, remaining: 4 });
      this.log.push(`봉인 (${p.x},${p.y})`);
    }
    this.tempSeals = next;
    return picked.length;
  }

  private tickTempSeals(): void {
    this.sealsByBoard = this.sealsByBoard.map((board) =>
      board
        .map((s) => ({ ...s, remaining: s.remaining - 1 }))
        .filter((s) => s.remaining > 0),
    );
    if (this.baitLure) {
      this.baitLure = {
        ...this.baitLure,
        remaining: this.baitLure.remaining - 1,
      };
      if (this.baitLure.remaining <= 0) this.baitLure = null;
    }
  }

  /** Place lure on an empty adjacent (or nearby) point for the opposing team. */
  private placeBaitLure(
    origin: Point,
    ownerTeam: TeamId,
  ): Point | null {
    const size = this.board.size;
    const grid = this.board.getBoard();
    const dirs: Point[] = [
      { x: origin.x + 1, y: origin.y },
      { x: origin.x - 1, y: origin.y },
      { x: origin.x, y: origin.y + 1 },
      { x: origin.x, y: origin.y - 1 },
    ];
    const candidates = dirs.filter((p) => {
      if (p.x < 0 || p.y < 0 || p.x >= size || p.y >= size) return false;
      if (grid[p.y]![p.x] !== null) return false;
      if (this.isForbidden(p)) return false;
      return true;
    });
    let spot: Point | null = null;
    if (candidates.length > 0) {
      spot = candidates[Math.floor(this.rng() * candidates.length)]!;
    } else {
      const empty: Point[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (grid[y]![x] !== null) continue;
          if (x === origin.x && y === origin.y) continue;
          if (this.isForbidden({ x, y })) continue;
          empty.push({ x, y });
        }
      }
      if (empty.length > 0) {
        spot = empty[Math.floor(this.rng() * empty.length)]!;
      }
    }
    if (!spot) return null;
    this.baitLure = {
      x: spot.x,
      y: spot.y,
      targetTeam: ownerTeam === "ally" ? "enemy" : "ally",
      remaining: 4,
    };
    return spot;
  }

  /** Flip colors of stones orthogonally adjacent to origin. */
  private applyTransformDust(origin: Point): number {
    const dirs: Point[] = [
      { x: origin.x + 1, y: origin.y },
      { x: origin.x - 1, y: origin.y },
      { x: origin.x, y: origin.y + 1 },
      { x: origin.x, y: origin.y - 1 },
    ];
    let flipped = 0;
    for (const p of dirs) {
      if (this.board.forceFlip(p)) {
        flipped += 1;
        this.log.push(`변환 (${p.x},${p.y})`);
      }
    }
    return flipped;
  }

  private trySpawnItem(): void {
    const bonus =
      itemSpawnBonusForPhase(this.circle.boardPhase) + this.inscriptionItemSpawn;
    if (!shouldSpawnItem(bonus, this.rng)) return;

    const size = this.board.size;
    const grid = this.board.getBoard();
    const empty: Point[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y]![x] !== null) continue;
        if (this.tokenAt(x, y)) continue;
        if (this.isForbidden({ x, y })) continue;
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
    let brilliantTarget: Point | null = null;
    if (this.modules.moduleG && unit.team === "ally") {
      brilliantTarget = this.suggestStones(unit)[0]?.point ?? null;
    }
    if (this.isForbidden(point)) {
      this.log.push(`금기구역 — 착수 불가 (${point.x},${point.y})`);
      return false;
    }
    const result = this.board.play(color, point);
    if (!result.ok) {
      this.log.push(`illegal stone ${result.reason}`);
      return false;
    }

    this.lastStoneReport = null;
    const chips: StoneReportChip[] = [];
    let claimedVictory = false;

    const kind = classifyCapture(result.capturedCount);
    let manaMul =
      manaBonusMultiplierForPhase(this.circle.boardPhase) *
      (1 + this.summonerOf(unit.team).boardSense);
    if (unit.stonePassive === "capture_mana" && result.capturedCount > 0) {
      manaMul *= 1.3;
    }
    const gains = gainsForBoardEvent(kind, result.capturedCount, manaMul);

    if (kind === "safe_place") {
      // Plain placements grant mana only — no combat buff auras.
      this.log.push(`일반 소환: 마력 +${Math.round(gains.mana)}`);
    }

    let ampDelta = gains.amplifyDelta;
    let manaGain = gains.mana;
    if (unit.stonePassive === "capture_amp" && result.capturedCount > 0) {
      ampDelta += 0.04;
    }
    if (unit.stonePassive === "stone_amp_proc" && this.rng() < 0.15) {
      ampDelta += 0.06;
      this.log.push(`스톤패시브: ${unit.name} 연타착수`);
    }

    if (this.modules.moduleE) {
      if (unit.kind === "summoner") {
        manaGain += 12;
        ampDelta += 0.02;
        this.log.push(`소환사 착수 보너스`);
      }
      if (this.circleElement && unit.element === this.circleElement) {
        ampDelta += 0.04;
        this.log.push(`속성 테두리 (${unit.element})`);
      }
      if (
        (unit.element === "light" || unit.element === "dark") &&
        this.circle.boardPhase >= 1
      ) {
        ampDelta += 0.03;
        this.log.push(`이중층 (${unit.element})`);
      }
    }

    {
      const sm = this.summonerOf(unit.team);
      if (
        (sm.elementWardCharges ?? 0) > 0 &&
        sm.elementWardElement === unit.element
      ) {
        ampDelta += 0.1;
        sm.elementWardCharges = (sm.elementWardCharges ?? 0) - 1;
        this.log.push(
          `속성의뢰 (${unit.element}) 잔여 ${sm.elementWardCharges}`,
        );
      }
    }

    if (
      brilliantTarget &&
      brilliantTarget.x === point.x &&
      brilliantTarget.y === point.y
    ) {
      this.brilliantCount += 1;
      this.log.push(
        `묘수! (${this.brilliantCount}/${this.brilliantGoal})`,
      );
      if (!this.brilliantDone && this.brilliantCount >= this.brilliantGoal) {
        this.brilliantDone = true;
        manaGain += 25;
        ampDelta += 0.05;
        this.log.push(`묘수 미션 완료`);
      }
    }

    if (
      this.modules.moduleF &&
      this.victoryPoint &&
      point.x === this.victoryPoint.x &&
      point.y === this.victoryPoint.y &&
      !this.victoryPointClaimed
    ) {
      this.victoryPointClaimed = true;
      this.manaSealed = false;
      ampDelta += 0.12;
      manaGain += 30;
      claimedVictory = true;
      chips.push({ kind: "victory", n: 30 });
      this.log.push(`필승점 해금 — 마나봉인 해제`);
    }

    if (this.modules.moduleF && this.manaSealed && unit.team === "ally") {
      manaGain = Math.floor(manaGain * 0.15);
    }

    if (
      this.modules.moduleF &&
      kind === "capture_large" &&
      unit.team === "enemy"
    ) {
      this.enemySummoner.mana = Math.min(
        this.enemySummoner.manaMax,
        this.enemySummoner.mana + 25,
      );
      this.log.push(`돌흡수: 적 마나 +25`);
    }

    if (this.openingBonusPending) {
      ampDelta += 0.03;
      manaGain += 8;
      this.openingBonusPending = false;
      this.log.push(`포석 보너스 (중앙 국면)`);
    }

    this.amplify = clampAmplify(
      this.amplify + ampDelta,
      this.phaseAmplifyCap(),
      this.powerGapCap,
    );
    // Capture no longer grants skillAmplifyBonus — N×10% goes to next monster hit.
    this.skillAmplifyBonus = gains.skillAmplifyBonus;

    const sm = this.summonerOf(unit.team);
    if (gains.captureDamageBonus > 0) {
      // One capture payoff only: next monster hit damage (no stacked atk/crit auras).
      this.pendingCaptureDamageBonus[unit.team] = gains.captureDamageBonus;
      chips.push({
        kind: "capture",
        n: Math.round(gains.captureDamageBonus * 100),
      });
      this.log.push(
        `따냄 버프: 다음 소환수 피해 +${Math.round(gains.captureDamageBonus * 100)}%`,
      );
    }
    if (gains.captureManaFrac > 0) {
      const captureMana = Math.round(sm.manaMax * gains.captureManaFrac);
      manaGain += captureMana;
      this.log.push(
        `따냄 마력: +${Math.round(gains.captureManaFrac * 100)}%p (${captureMana})`,
      );
    }
    sm.mana = Math.min(sm.manaMax, sm.mana + manaGain);
    this.checkManaRace(unit.team);

    if (this.modules.moduleB) {
      const shapes = detectShapeBonuses(
        this.board,
        color,
        point,
        this.hoshiPoints,
      );
      for (const sh of shapes) {
        this.amplify = clampAmplify(
          this.amplify + sh.amplifyDelta,
          this.phaseAmplifyCap(),
          this.powerGapCap,
        );
        if (sh.skillAmplifyBonus) {
          this.skillAmplifyBonus += sh.skillAmplifyBonus;
        }
        const shapeMana = sh.mana * manaMul;
        if (shapeMana > 0) manaGain += shapeMana;
        sm.mana = Math.min(sm.manaMax, sm.mana + shapeMana);
        if (sh.shieldPct) {
          const shield = Math.round(unit.stats.hp * sh.shieldPct);
          unit.shieldHp = (unit.shieldHp ?? 0) + shield;
          chips.push({ kind: "shape", id: sh.id });
          chips.push({ kind: "shield", n: shield });
          this.log.push(`형상 ${sh.labelKo}: 실드 +${shield}`);
        } else {
          chips.push({ kind: "shape", id: sh.id });
          this.log.push(`형상 ${sh.labelKo}`);
        }
        // Shape amplify/mana/shield only — no stacked combat stat auras on place.
        if (sh.id === "axis") {
          unit.cutImmune = Math.max(unit.cutImmune ?? 0, 1);
          this.log.push(`형상 축 연결: 절단 면역 1회`);
        }
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
    if (picked) {
      chips.push(...this.applyTokenPickup(unit, picked));
    }

    if (
      this.modules.moduleD &&
      result.capturedCount >= CAPTURE_SHOP_THRESHOLD
    ) {
      if (unit.team === "enemy") {
        this.resolveCaptureShop(unit, pickCaptureShopChoice(this.rng));
      } else {
        this.pendingCaptureShop = { unitId: unit.id };
      }
    }

    const prog = registerStoneSummon(this.circle);
    this.circle = prog.state;
    const placedBoardIndex = this.activeBoardIndex;
    if (prog.shouldReset) {
      this.wipeCircle("empowered");
    } else {
      this.trySpawnItem();
      if (
        this.modules.moduleC &&
        shouldRollCircleEvent(this.circle.stoneSummonCount)
      ) {
        this.applyCircleEvent(rollCircleEvent(this.rng), unit);
      }
    }

    this.tickTempSeals();

    if (
      this.boards.length > 1 &&
      this.circle.stoneSummonCount > 0 &&
      this.circle.stoneSummonCount % DUAL_BOARD_SWITCH_INTERVAL === 0
    ) {
      this.switchBoard("자동");
    }

    if (this.fogTurns > 0) this.fogTurns -= 1;

    this.log.push(
      `${unit.name} stone (${point.x},${point.y}) cap=${result.capturedCount} amp=${this.currentAmplify().toFixed(2)}`,
    );
    this.lastStoneTeam = unit.team;
    if (manaGain > 0) chips.push({ kind: "mana", n: Math.round(manaGain) });
    const event: StoneReport["event"] =
      result.capturedCount > 0
        ? "capture"
        : claimedVictory || picked
          ? "special"
          : "safe_place";
    const showResultSheet =
      !!picked ||
      claimedVictory ||
      result.capturedCount > 0 ||
      chips.some((c) => c.kind === "shape" || c.kind === "shield");
    this.lastStoneReport = {
      team: unit.team,
      x: point.x,
      y: point.y,
      event,
      capturedCount: result.capturedCount,
      chips,
      showResultSheet,
    };
    if (!prog.shouldReset) {
      if (unit.team === "enemy") {
        this.lastEnemyStone = {
          x: point.x,
          y: point.y,
          boardIndex: placedBoardIndex,
        };
      } else if (
        this.lastEnemyStone &&
        this.lastEnemyStone.boardIndex === placedBoardIndex
      ) {
        const grid = this.boards[placedBoardIndex]!.getBoard();
        if (
          grid[this.lastEnemyStone.y]?.[this.lastEnemyStone.x] !== "white"
        ) {
          this.lastEnemyStone = null;
        }
      }
    }
    this.checkFinish();
    if (this.phase === "finished" || this.phase === "await_wave") {
      return true;
    }
    if (this.pendingCaptureShop) {
      this.phase = "await_capture_shop";
      this.log.push(`사석상점: 보상을 선택하세요`);
    } else {
      this.phase = "await_skill";
    }
    return true;
  }

  /** Module D: player/AI pick after large capture. */
  chooseCaptureShop(choice: CaptureShopChoice): boolean {
    if (this.phase !== "await_capture_shop" || !this.pendingCaptureShop) {
      return false;
    }
    const unit = this.getUnit(this.pendingCaptureShop.unitId);
    if (!unit) {
      this.pendingCaptureShop = null;
      this.phase = "await_skill";
      return false;
    }
    this.resolveCaptureShop(unit, choice);
    this.pendingCaptureShop = null;
    this.phase = "await_skill";
    return true;
  }

  /** Module D: apply a capture-shop choice. */
  resolveCaptureShop(unit: Unit, choice: CaptureShopChoice): void {
    const sm = this.summonerOf(unit.team);
    if (choice === "mana") {
      sm.mana = Math.min(sm.manaMax, sm.mana + 40);
      this.log.push(`사석상점: 마나 충전 (+40)`);
    } else if (choice === "amplify") {
      this.amplify = clampAmplify(
        this.amplify + 0.08,
        this.phaseAmplifyCap(),
        this.powerGapCap,
      );
      this.log.push(`사석상점: Amplify 강화`);
    } else {
      const shield = Math.round(unit.stats.hp * 0.12);
      unit.shieldHp = (unit.shieldHp ?? 0) + shield;
      sm.mana = Math.min(sm.manaMax, sm.mana + 10);
      this.log.push(`사석상점: 청소 실드 +${shield}`);
    }
  }

  /** Module C: apply a circle event. */
  applyCircleEvent(eventId: CircleEventId, unit: Unit): void {
    const name = circleEventName(eventId);
    this.log.push(`이벤트: ${name}`);
    if (eventId === "meteor") {
      const stones: Point[] = [];
      for (let y = 0; y < this.board.size; y++) {
        for (let x = 0; x < this.board.size; x++) {
          if (this.board.at({ x, y })) stones.push({ x, y });
        }
      }
      for (let i = 0; i < 3 && stones.length; i++) {
        const idx = Math.floor(this.rng() * stones.length);
        const p = stones.splice(idx, 1)[0]!;
        this.board.forceClear(p);
      }
      this.trySpawnItem();
      this.log.push(`운석: 돌 최대 3개 제거`);
      return;
    }
    if (eventId === "fog") {
      this.fogTurns = Math.max(this.fogTurns, 3);
      this.log.push(`안개: 착수 미리보기 축소 (3턴)`);
      return;
    }
    if (eventId === "bag_full") {
      this.trySpawnItem();
      this.trySpawnItem();
      this.log.push(`배낭만땅: 아이템 추가 스폰`);
      return;
    }
    if (eventId === "attr_tune") {
      this.amplify = clampAmplify(
        this.amplify + 0.06,
        this.phaseAmplifyCap(),
        this.powerGapCap,
      );
      this.log.push(`속성조율: Amplify +0.06`);
      return;
    }
    if (eventId === "ko_bonus") {
      if (this.board.getKoPoint()) {
        this.amplify = clampAmplify(
          this.amplify + 0.05,
          this.phaseAmplifyCap(),
          this.powerGapCap,
        );
        this.log.push(`패왕전: 패점 보너스 Amp`);
      } else {
        const sm = this.summonerOf(unit.team);
        sm.mana = Math.min(sm.manaMax, sm.mana + 15);
        this.log.push(`패왕전: 마나 +15`);
      }
      return;
    }
    // tide
    const sm = this.summonerOf(unit.team);
    sm.mana = Math.min(sm.manaMax, sm.mana + 20);
    this.log.push(`조수: 마나 +20`);
  }

  /** Auto stone then ready for skill. */
  autoStone(): boolean {
    if (!this.activeUnitId) return false;
    const unit = this.getUnit(this.activeUnitId);
    if (!unit) return false;
    this.ensurePlayableCircle();
    const p = this.autoPickStone(unit);
    if (!p) return false;
    return this.playStone(p);
  }

  canUseSummonerSkill(unit: Unit): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    return sm.mana >= sm.manaMax;
  }

  canUseMagicSkill(unit: Unit, skillId: string): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    const def = sm.magicSkills?.find((s) => s.id === skillId);
    if (!def) return false;
    return sm.mana >= sm.manaMax * def.manaCostFrac;
  }

  private presentationTargetIds(
    unit: Unit,
    effects: SkillEffect[],
    targetId?: string,
  ): string[] {
    const ids = new Set<string>();
    const foes = () =>
      aliveSummons(
        this.units,
        unit.team === "ally" ? "enemy" : "ally",
      ).map((u) => u.id);
    const allies = () => aliveSummons(this.units, unit.team).map((u) => u.id);
    for (const effect of effects) {
      switch (effect.target) {
        case "single":
          ids.add(this.resolveSingleTarget(unit, targetId)?.id ?? unit.id);
          break;
        case "all_enemies":
          foes().forEach((id) => ids.add(id));
          break;
        case "self":
          ids.add(unit.id);
          break;
        case "ally_lowest":
          ids.add(this.lowestAllyMonster(unit.team)?.id ?? unit.id);
          break;
        case "all_allies":
          allies().forEach((id) => ids.add(id));
          break;
        default:
          ids.add(unit.id);
          break;
      }
    }
    if (!ids.size) ids.add(unit.id);
    return [...ids];
  }

  private tagSkillResults(
    results: SkillResult[],
    unit: Unit,
    meta: {
      skillId: string;
      vfxId?: string;
      effectKinds: string[];
      usedSummonerSkill: boolean;
    },
    targetIds: string[],
  ): SkillResult[] {
    this.lastSkillPresentation = {
      attackerId: unit.id,
      skillId: meta.skillId,
      vfxId: meta.vfxId,
      effectKinds: meta.effectKinds,
      usedSummonerSkill: meta.usedSummonerSkill,
      targetIds,
    };
    return results.map((result) => ({
      ...result,
      skillId: meta.skillId,
      vfxId: meta.vfxId,
      effectKinds: meta.effectKinds,
      usedSummonerSkill: meta.usedSummonerSkill || result.usedSummonerSkill,
    }));
  }

  private castMagicSkill(
    unit: Unit,
    skillId: string,
    targetId?: string,
  ): SkillResult[] {
    const sm = this.summonerOf(unit.team);
    const def = sm.magicSkills?.find((s) => s.id === skillId);
    if (!def) return [];
    const cost = sm.manaMax * def.manaCostFrac;
    sm.mana = Math.max(0, sm.mana - cost);
    const power = def.power * (1 + (sm.skillPowerBonus ?? 0));
    const results: SkillResult[] = [];
    const targetIds = this.presentationTargetIds(
      unit,
      [
        ...(def.kind === "aoe_damage" || def.kind === "enemy_debuff"
          ? [{ kind: "damage", target: "all_enemies", coeff: 0 } as const]
          : def.kind === "single_damage"
            ? [{ kind: "damage", target: "single", coeff: 0 } as const]
            : [{ kind: "buff", target: "all_allies", axis: "atk", amount: 0, turns: 0 } as const]),
      ],
      targetId,
    );
    const finish = (): SkillResult[] =>
      this.tagSkillResults(
        results,
        unit,
        {
          skillId: def.id,
          vfxId: def.vfxId,
          effectKinds: [def.kind],
          usedSummonerSkill: true,
        },
        targetIds,
      );
    this.log.push(`${unit.name} ${def.nameKo}`);

    switch (def.kind) {
      case "aoe_damage": {
        const foes = aliveSummons(
          this.units,
          unit.team === "ally" ? "enemy" : "ally",
        );
        for (const t of foes) {
          results.push(this.applyHit(unit, t, power, true));
        }
        break;
      }
      case "single_damage": {
        const target = this.resolveSingleTarget(unit, targetId);
        if (target) results.push(this.applyHit(unit, target, power, true));
        break;
      }
      case "ally_buff_atk": {
        for (const u of aliveSummons(this.units, unit.team)) {
          this.applyStatBuff(u, "atk", power, def.turns ?? 2);
        }
        break;
      }
      case "ally_buff_spd": {
        for (const u of aliveSummons(this.units, unit.team)) {
          this.applyStatBuff(u, "spd", power, def.turns ?? 2);
        }
        break;
      }
      case "ally_buff_crit": {
        for (const u of aliveSummons(this.units, unit.team)) {
          this.applyStatBuff(u, "critRate", power, def.turns ?? 2);
        }
        break;
      }
      case "ally_heal": {
        for (const u of aliveSummons(this.units, unit.team)) {
          const amount = Math.round(u.stats.hp * power);
          u.hp = Math.min(u.stats.hp, u.hp + amount);
          this.log.push(`${u.name} 회복 +${amount}`);
        }
        break;
      }
      case "ally_shield": {
        for (const u of aliveSummons(this.units, unit.team)) {
          const amount = Math.round(u.stats.hp * power);
          u.shieldHp = (u.shieldHp ?? 0) + amount;
        }
        break;
      }
      case "enemy_debuff": {
        for (const t of aliveSummons(
          this.units,
          unit.team === "ally" ? "enemy" : "ally",
        )) {
          this.applyStatDebuff(t, "atk", power, def.turns ?? 2);
          this.applyStatDebuff(t, "def", power * 0.8, def.turns ?? 2);
        }
        break;
      }
      case "amplify": {
        this.amplify = clampAmplify(
          Math.max(this.amplify, 1.12) + power,
          this.phaseAmplifyCap(),
          this.powerGapCap,
        );
        break;
      }
      case "dual_stone": {
        this.phase = "await_stone";
        this.autoStone();
        if (this.isPhase("await_capture_shop")) {
          this.chooseCaptureShop(pickCaptureShopChoice(this.rng));
        }
        return finish();
      }
      case "board_clean": {
        const center = this.pickCleanCenter(unit.team);
        const removed = this.clearNeighborhood(center);
        if (removed > 0) {
          this.amplify = clampAmplify(
            this.amplify + Math.min(0.08, removed * 0.015),
            this.phaseAmplifyCap(),
            this.powerGapCap,
          );
        }
        break;
      }
      case "damage_reduce": {
        for (const u of aliveSummons(this.units, unit.team)) {
          u.damageTakenMul = Math.min(
            u.damageTakenMul ?? 1,
            1 - power,
          );
        }
        break;
      }
      default:
        break;
    }

    this.skillAmplifyBonus = 0;
    this.phase = "resolved";
    this.activeUnitId = null;
    this.checkFinish();
    return finish();
  }

  /** 증폭선언: half mana (× cost mul) — short Amplify fix (no damage). */
  canUseSummonerDeclare(unit: Unit): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    const need = sm.manaMax * 0.5 * (sm.declareCostMul ?? 1);
    return sm.mana >= need;
  }

  /** 쌍착수: 35% mana (× cost mul) — bonus second stone this turn. */
  canUseSummonerDual(unit: Unit): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    const need = sm.manaMax * 0.35 * (sm.dualCostMul ?? 1);
    return sm.mana >= need;
  }

  /** 진문청소: 45% mana (× cost mul) — clear 3×3 stones/tokens. */
  canUseSummonerClean(unit: Unit): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    const need = sm.manaMax * 0.45 * (sm.cleanCostMul ?? 1);
    return sm.mana >= need;
  }

  /** 진문수호: 40% mana — shield ally monsters. */
  canUseSummonerGuard(unit: Unit): boolean {
    if (unit.kind !== "summoner") return false;
    const sm = this.summonerOf(unit.team);
    const need = sm.manaMax * 0.4;
    return sm.mana >= need;
  }

  /** True if any ally monster is below the HP ratio threshold. */
  allyMonstersWounded(team: TeamId, ratio = 0.55): boolean {
    const allies = this.units.filter(
      (u) => u.alive && u.team === team && u.kind === "monster",
    );
    if (allies.length === 0) return false;
    return allies.some((u) => u.hp / u.stats.hp < ratio);
  }

  /** Enemy stone count on the active board (for AUTO clean gating). */
  countEnemyStones(team: TeamId): number {
    const enemy = teamStoneColor(team === "ally" ? "enemy" : "ally");
    const size = this.board.size;
    let n = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.board.at({ x, y }) === enemy) n += 1;
      }
    }
    return n;
  }

  /** Pick 3×3 center that hits the most enemy stones (then tokens). */
  private pickCleanCenter(team: TeamId): Point {
    const enemy = teamStoneColor(team === "ally" ? "enemy" : "ally");
    const size = this.board.size;
    const mid = Math.floor(size / 2);
    let best: Point = { x: mid, y: mid };
    let bestScore = -1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let score = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const p = { x: x + dx, y: y + dy };
            if (p.x < 0 || p.y < 0 || p.x >= size || p.y >= size) continue;
            const cell = this.board.at(p);
            if (cell === enemy) score += 3;
            else if (cell) score += 1;
            if (this.tokenAt(p.x, p.y)) score += 2;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }
    }
    return best;
  }

  /** Clear stones and tokens in a 3×3 around center. Returns removed stone count. */
  private clearNeighborhood(center: Point): number {
    const size = this.board.size;
    let removed = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const p = { x: center.x + dx, y: center.y + dy };
        if (p.x < 0 || p.y < 0 || p.x >= size || p.y >= size) continue;
        if (this.board.forceClear(p)) removed += 1;
        if (this.tokenAt(p.x, p.y)) {
          this.tokens = this.tokens.filter(
            (t) => !(t.x === p.x && t.y === p.y),
          );
        }
      }
    }
    return removed;
  }

  canUseSkill(unit: Unit, skillIndex: number): boolean {
    if (!unit.skills?.[skillIndex]) return skillIndex === 0;
    const cds = ensureSkillCd(unit);
    return (cds[skillIndex] ?? 0) <= 0;
  }

  /**
   * Skill phase. Summoner skills: 진문개방 / 증폭선언 / 쌍착수 / 진문청소 / 진문수호.
   * Otherwise cast S1/S2/S3 (or fallback basic) on target.
   */
  useSkill(opts?: {
    targetId?: string;
    useSummonerSkill?: boolean;
    /** Legacy open/declare/dual/clean/guard OR Phase 2 magic skill id. */
    summonerSkill?: string;
    skillIndex?: number;
  }): SkillResult[] {
    if (this.phase !== "await_skill" || !this.activeUnitId) return [];
    const unit = this.getUnit(this.activeUnitId);
    if (!unit) return [];
    this.lastSkillPresentation = null;

    const enemies = aliveSummons(
      this.units,
      unit.team === "ally" ? "enemy" : "ally",
    );
    const results: SkillResult[] = [];
    const summonerSkill =
      opts?.summonerSkill ??
      (opts?.useSummonerSkill ? "open" : undefined);

    const smEarly = this.summonerOf(unit.team);
    if (
      summonerSkill &&
      smEarly.magicSkills?.some((s) => s.id === summonerSkill) &&
      this.canUseMagicSkill(unit, summonerSkill)
    ) {
      this.attackTurnCount += 1;
      return this.castMagicSkill(unit, summonerSkill, opts?.targetId);
    }

    if (summonerSkill === "declare" && this.canUseSummonerDeclare(unit)) {
      const sm = this.summonerOf(unit.team);
      const cost = sm.manaMax * 0.5 * (sm.declareCostMul ?? 1);
      sm.mana = Math.max(0, sm.mana - cost);
      const power =
        0.1 +
        (sm.skillPowerBonus ?? 0) * 0.05 +
        (sm.declarePowerBonus ?? 0);
      this.amplify = clampAmplify(
        Math.max(this.amplify, 1.12) + power,
        this.phaseAmplifyCap(),
        this.powerGapCap,
      );
      this.log.push(
        `${unit.name} 증폭선언 (Amp ${this.amplify.toFixed(2)})`,
      );
    } else if (summonerSkill === "dual" && this.canUseSummonerDual(unit)) {
      const sm = this.summonerOf(unit.team);
      const cost = sm.manaMax * 0.35 * (sm.dualCostMul ?? 1);
      sm.mana = Math.max(0, sm.mana - cost);
      this.log.push(`${unit.name} 쌍착수`);
      this.phase = "await_stone";
      const placed = this.autoStone();
      if (!placed) {
        this.log.push(`쌍착수 착수 공간 없음`);
      }
      if (this.isPhase("await_capture_shop")) {
        this.chooseCaptureShop(pickCaptureShopChoice(this.rng));
      }
    } else if (summonerSkill === "clean" && this.canUseSummonerClean(unit)) {
      const sm = this.summonerOf(unit.team);
      const cost = sm.manaMax * 0.45 * (sm.cleanCostMul ?? 1);
      sm.mana = Math.max(0, sm.mana - cost);
      const center = this.pickCleanCenter(unit.team);
      const removed = this.clearNeighborhood(center);
      const perStone = 0.015 + (sm.cleanAmpBonus ?? 0);
      const ampGain = Math.min(0.08, removed * perStone);
      if (ampGain > 0) {
        this.amplify = clampAmplify(
          this.amplify + ampGain,
          this.phaseAmplifyCap(),
          this.powerGapCap,
        );
      }
      this.log.push(
        `${unit.name} 진문청소 (${center.x},${center.y}) 제거 ${removed}`,
      );
    } else if (summonerSkill === "guard" && this.canUseSummonerGuard(unit)) {
      const sm = this.summonerOf(unit.team);
      const cost = sm.manaMax * 0.4;
      sm.mana = Math.max(0, sm.mana - cost);
      let shielded = 0;
      let totalShield = 0;
      for (const u of this.units) {
        if (!u.alive || u.team !== unit.team || u.kind !== "monster") continue;
        const amount = Math.round(u.stats.hp * 0.18);
        u.shieldHp = (u.shieldHp ?? 0) + amount;
        shielded += 1;
        totalShield += amount;
      }
      this.log.push(
        `${unit.name} 진문수호 (아군 ${shielded} · 실드 +${totalShield})`,
      );
    } else if (summonerSkill === "open" && this.canUseSummonerSkill(unit)) {
      const sm = this.summonerOf(unit.team);
      const ult = composeSummonerUlt(sm);
      sm.mana = 0;
      if (ult.manaRefundFrac > 0) {
        sm.mana = Math.min(
          sm.manaMax,
          sm.mana + Math.round(sm.manaMax * ult.manaRefundFrac),
        );
      }
      this.skillAmplifyBonus += ult.skillAmplifyBonus;
      if (ult.amplifyDelta > 0 || ult.declareAmpBump) {
        const bump = ult.amplifyDelta + (ult.declareAmpBump ? 0.04 : 0);
        this.amplify = clampAmplify(
          Math.max(this.amplify, ult.declareAmpBump ? 1.12 : this.amplify) +
            bump,
          this.phaseAmplifyCap(),
          this.powerGapCap,
        );
      }
      if (ult.boardClean) {
        const center = this.pickCleanCenter(unit.team);
        const removed = this.clearNeighborhood(center);
        this.log.push(
          `${unit.name} 고유기·청소 (${center.x},${center.y}) 제거 ${removed}`,
        );
      }
      if (ult.leaderAtkBuffTicks > 0 && ult.leaderAtkBuffPct > 0) {
        for (const u of this.units) {
          if (!u.alive || u.team !== unit.team || u.kind !== "monster") continue;
          u.atkBuffPct = Math.max(u.atkBuffPct ?? 0, ult.leaderAtkBuffPct);
          u.atkBuffTicks = Math.max(
            u.atkBuffTicks ?? 0,
            ult.leaderAtkBuffTicks,
          );
        }
      }
      this.log.push(
        `${unit.name} 진문개방 [${ult.modules.join("+")}] coeff=${ult.coeff.toFixed(2)}`,
      );
      for (const t of enemies) {
        results.push(this.applyHit(unit, t, ult.coeff, true));
      }
      if (ult.bonusStone) {
        this.phase = "await_stone";
        this.activeUnitId = unit.id;
        const placed = this.autoStone();
        if (!placed) {
          this.log.push(`고유기 추가 착수 공간 없음`);
        }
        if (this.isPhase("await_capture_shop")) {
          this.chooseCaptureShop(pickCaptureShopChoice(this.rng));
        }
      }
    } else if (!summonerSkill) {
      let skillIndex =
        opts?.skillIndex ?? pickAutoSkillIndex(unit, this.units);
      if ((unit.stunnedTurns ?? 0) > 0) {
        this.log.push(`${unit.name} 기절 — 스킬 불가`);
        return [];
      }
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
        results.push({
          ...this.applyHit(unit, target, unit.skillCoeff, false),
          skillId: "basic",
          effectKinds: ["damage"],
        });
      }
    } else {
      // Requested summoner skill but not ready — no-op
      return [];
    }

    const output = summonerSkill
      ? this.tagSkillResults(
          results,
          unit,
          {
            skillId: summonerSkill,
            vfxId: `summoner:legacy-${summonerSkill}`,
            effectKinds: [summonerSkill],
            usedSummonerSkill: true,
          },
          this.presentationTargetIds(
            unit,
            [
              summonerSkill === "open"
                ? ({ kind: "damage", target: "all_enemies", coeff: 0 } as const)
                : ({ kind: "buff", target: "all_allies", axis: "atk", amount: 0, turns: 0 } as const),
            ],
            opts?.targetId,
          ),
        )
      : results;
    this.attackTurnCount += 1;
    this.skillAmplifyBonus = 0;
    // Violent: extra turn (not from counter)
    if (
      !summonerSkill &&
      unit.alive &&
      (unit.violentChance ?? 0) > 0 &&
      this.rng() * 100 < (unit.violentChance ?? 0)
    ) {
      unit.atb = ATB_THRESHOLD;
      this.log.push(`${unit.name} 격노 — 추가 턴`);
      // Extra turn from SPD/violent: no stone (Go alternation).
      this.phase = "await_skill";
      this.activeUnitId = unit.id;
      this.checkFinish();
      return output;
    }
    this.phase = "resolved";
    this.activeUnitId = null;
    this.checkFinish();
    return output;
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
    const targetIds = this.presentationTargetIds(unit, skill.effects, targetId);
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
        const targets =
          effect.target === "self"
            ? [unit]
            : effect.target === "all_allies"
              ? aliveSummons(this.units, unit.team)
              : [this.lowestAllyMonster(unit.team) ?? unit];
        for (const target of targets) {
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
        }
      } else if (effect.kind === "shield") {
        const targets =
          effect.target === "all_allies"
            ? aliveSummons(this.units, unit.team)
            : [unit];
        for (const t of targets) {
          const amount = Math.round(t.stats.hp * effect.coeff);
          t.shieldHp = (t.shieldHp ?? 0) + amount;
          this.log.push(`${t.name} 실드 +${amount}`);
          results.push({
            attackerId: unit.id,
            targetId: t.id,
            damage: 0,
            crit: false,
            usedSummonerSkill: false,
          });
        }
      } else if (effect.kind === "mana") {
        const sm = this.summonerOf(unit.team);
        sm.mana = Math.min(sm.manaMax, sm.mana + effect.amount);
        this.log.push(`${unit.name} 마나 +${effect.amount}`);
      } else if (effect.kind === "buff") {
        const targets =
          effect.target === "self"
            ? [unit]
            : aliveSummons(this.units, unit.team);
        for (const t of targets) {
          this.applyStatBuff(t, effect.axis, effect.amount, effect.turns);
          this.log.push(
            `${t.name} ${effect.axis} 버프 +${Math.round(effect.amount * 100)}%`,
          );
        }
      } else if (effect.kind === "debuff") {
        const targets =
          effect.target === "all_enemies"
            ? aliveSummons(
                this.units,
                unit.team === "ally" ? "enemy" : "ally",
              )
            : [this.resolveSingleTarget(unit, targetId)].filter(
                (t): t is Unit => !!t,
              );
        for (const t of targets) {
          this.applyStatDebuff(t, effect.axis, effect.amount, effect.turns);
          this.log.push(
            `${t.name} ${effect.axis} 약화 -${Math.round(effect.amount * 100)}%`,
          );
        }
      } else if (effect.kind === "dot") {
        const targets =
          effect.target === "all_enemies"
            ? aliveSummons(
                this.units,
                unit.team === "ally" ? "enemy" : "ally",
              )
            : [this.resolveSingleTarget(unit, targetId)].filter(
                (t): t is Unit => !!t,
              );
        for (const t of targets) {
          t.dotAtkCoeff = effect.coeff;
          t.dotTicks = effect.turns;
          t.dotSourceAtk = unit.stats.atk * (1 + (unit.atkBuffPct ?? 0));
          this.log.push(`${t.name} 지속피해 ${effect.turns}턴`);
        }
      } else if (effect.kind === "cc") {
        const chance = effect.chance ?? 1;
        const targets =
          effect.target === "all_enemies"
            ? aliveSummons(
                this.units,
                unit.team === "ally" ? "enemy" : "ally",
              )
            : [this.resolveSingleTarget(unit, targetId)].filter(
                (t): t is Unit => !!t,
              );
        for (const t of targets) {
          if (this.rng() > chance) continue;
          if ((t.statusImmuneTurns ?? 0) > 0) continue;
          t.stunnedTurns = Math.max(t.stunnedTurns ?? 0, effect.turns);
          this.log.push(`${t.name} ${effect.cc} ${effect.turns}턴`);
        }
      } else if (effect.kind === "strip") {
        const targets =
          effect.target === "all_enemies"
            ? aliveSummons(
                this.units,
                unit.team === "ally" ? "enemy" : "ally",
              )
            : [this.resolveSingleTarget(unit, targetId)].filter(
                (t): t is Unit => !!t,
              );
        for (const t of targets) {
          t.atkBuffPct = 0;
          t.atkBuffTicks = 0;
          t.defBuffPct = 0;
          t.defBuffTicks = 0;
          t.spdBuffPct = 0;
          t.spdBuffTicks = 0;
          t.shieldHp = 0;
          this.log.push(`${t.name} 강화 해제`);
        }
      } else if (effect.kind === "cleanse") {
        const targets =
          effect.target === "self"
            ? [unit]
            : aliveSummons(this.units, unit.team);
        for (const t of targets) {
          t.atkDebuffPct = 0;
          t.atkDebuffTicks = 0;
          t.defDebuffPct = 0;
          t.defDebuffTicks = 0;
          t.spdDebuffPct = 0;
          t.spdDebuffTicks = 0;
          t.dotTicks = 0;
          t.stunnedTurns = 0;
          this.log.push(`${t.name} 약화 해제`);
        }
      } else if (effect.kind === "provoke") {
        const target = this.resolveSingleTarget(unit, targetId);
        if (target) {
          target.provokeTargetId = unit.id;
          target.provokeTicks = effect.turns;
          this.log.push(`${target.name} 도발 ${effect.turns}턴`);
        }
      }
    }
    const cds = ensureSkillCd(unit);
    cds[skillIndex] = skill.cooldown;
    return this.tagSkillResults(
      results,
      unit,
      {
        skillId: skill.id,
        vfxId: skill.vfxId,
        effectKinds: skill.effects.map((effect) => effect.kind),
        usedSummonerSkill: false,
      },
      targetIds,
    );
  }

  private applyBoardAuraToTeam(
    team: TeamId,
    opts: {
      atk?: number;
      def?: number;
      spd?: number;
      critRate?: number;
      turns: number;
    },
  ): void {
    for (const u of this.units) {
      if (!u.alive || u.team !== team || u.kind !== "monster") continue;
      if (opts.atk) this.applyStatBuff(u, "atk", opts.atk, opts.turns);
      if (opts.def) this.applyStatBuff(u, "def", opts.def, opts.turns);
      if (opts.spd) this.applyStatBuff(u, "spd", opts.spd, opts.turns);
      if (opts.critRate) this.applyStatBuff(u, "critRate", opts.critRate, opts.turns);
    }
  }

  private applyShapeBoardAura(team: TeamId, shapeId: string): void {
    switch (shapeId) {
      case "corner":
        this.applyBoardAuraToTeam(team, { atk: 0.08, turns: 3 });
        break;
      case "star":
        this.applyBoardAuraToTeam(team, { spd: 0.1, turns: 3 });
        break;
      case "star_control":
        this.applyBoardAuraToTeam(team, { atk: 0.14, def: 0.1, turns: 3 });
        break;
      case "tiger":
        this.applyBoardAuraToTeam(team, { def: 0.14, turns: 3 });
        break;
      case "kosumi":
        this.applyBoardAuraToTeam(team, { spd: 0.08, critRate: 0.12, turns: 3 });
        break;
      case "axis":
        this.applyBoardAuraToTeam(team, { atk: 0.12, turns: 3 });
        break;
      default:
        break;
    }
  }

  private applyStatBuff(
    unit: Unit,
    axis: string,
    amount: number,
    turns: number,
  ): void {
    switch (axis) {
      case "atk":
        unit.atkBuffPct = (unit.atkBuffPct ?? 0) + amount;
        unit.atkBuffTicks = Math.max(unit.atkBuffTicks ?? 0, turns);
        break;
      case "def":
        unit.defBuffPct = (unit.defBuffPct ?? 0) + amount;
        unit.defBuffTicks = Math.max(unit.defBuffTicks ?? 0, turns);
        break;
      case "spd":
        unit.spdBuffPct = (unit.spdBuffPct ?? 0) + amount;
        unit.spdBuffTicks = Math.max(unit.spdBuffTicks ?? 0, turns);
        break;
      case "critRate":
        unit.critRateBuff = (unit.critRateBuff ?? 0) + amount * 100;
        unit.critRateBuffTicks = Math.max(unit.critRateBuffTicks ?? 0, turns);
        break;
      case "critDmg":
        unit.critDmgBuff = (unit.critDmgBuff ?? 0) + amount * 100;
        unit.critDmgBuffTicks = Math.max(unit.critDmgBuffTicks ?? 0, turns);
        break;
      case "accuracy":
        unit.accuracyBuff = (unit.accuracyBuff ?? 0) + amount * 100;
        unit.accuracyBuffTicks = Math.max(unit.accuracyBuffTicks ?? 0, turns);
        break;
      default:
        break;
    }
  }

  private applyStatDebuff(
    unit: Unit,
    axis: string,
    amount: number,
    turns: number,
  ): void {
    switch (axis) {
      case "atk":
        unit.atkDebuffPct = Math.min(
          0.7,
          (unit.atkDebuffPct ?? 0) + amount,
        );
        unit.atkDebuffTicks = Math.max(unit.atkDebuffTicks ?? 0, turns);
        break;
      case "def":
        unit.defDebuffPct = Math.min(
          0.7,
          (unit.defDebuffPct ?? 0) + amount,
        );
        unit.defDebuffTicks = Math.max(unit.defDebuffTicks ?? 0, turns);
        break;
      case "spd":
        unit.spdDebuffPct = Math.min(
          0.7,
          (unit.spdDebuffPct ?? 0) + amount,
        );
        unit.spdDebuffTicks = Math.max(unit.spdDebuffTicks ?? 0, turns);
        break;
      default:
        // accuracy/crit debuffs: reuse atkDebuff as soft stub for accuracy
        if (axis === "accuracy") {
          unit.atkDebuffPct = Math.min(
            0.5,
            (unit.atkDebuffPct ?? 0) + amount * 0.5,
          );
          unit.atkDebuffTicks = Math.max(unit.atkDebuffTicks ?? 0, turns);
        }
        break;
    }
  }

  private tickStatus(u: Unit): void {
    if ((u.atkBuffTicks ?? 0) > 0) {
      u.atkBuffTicks = (u.atkBuffTicks ?? 0) - 1;
      if ((u.atkBuffTicks ?? 0) <= 0) u.atkBuffPct = 0;
    }
    if ((u.defBuffTicks ?? 0) > 0) {
      u.defBuffTicks = (u.defBuffTicks ?? 0) - 1;
      if ((u.defBuffTicks ?? 0) <= 0) u.defBuffPct = 0;
    }
    if ((u.spdBuffTicks ?? 0) > 0) {
      u.spdBuffTicks = (u.spdBuffTicks ?? 0) - 1;
      if ((u.spdBuffTicks ?? 0) <= 0) u.spdBuffPct = 0;
    }
    if ((u.critRateBuffTicks ?? 0) > 0) {
      u.critRateBuffTicks = (u.critRateBuffTicks ?? 0) - 1;
      if ((u.critRateBuffTicks ?? 0) <= 0) u.critRateBuff = 0;
    }
    if ((u.critDmgBuffTicks ?? 0) > 0) {
      u.critDmgBuffTicks = (u.critDmgBuffTicks ?? 0) - 1;
      if ((u.critDmgBuffTicks ?? 0) <= 0) u.critDmgBuff = 0;
    }
    if ((u.accuracyBuffTicks ?? 0) > 0) {
      u.accuracyBuffTicks = (u.accuracyBuffTicks ?? 0) - 1;
      if ((u.accuracyBuffTicks ?? 0) <= 0) u.accuracyBuff = 0;
    }
    if ((u.atkDebuffTicks ?? 0) > 0) {
      u.atkDebuffTicks = (u.atkDebuffTicks ?? 0) - 1;
      if ((u.atkDebuffTicks ?? 0) <= 0) u.atkDebuffPct = 0;
    }
    if ((u.defDebuffTicks ?? 0) > 0) {
      u.defDebuffTicks = (u.defDebuffTicks ?? 0) - 1;
      if ((u.defDebuffTicks ?? 0) <= 0) u.defDebuffPct = 0;
    }
    if ((u.spdDebuffTicks ?? 0) > 0) {
      u.spdDebuffTicks = (u.spdDebuffTicks ?? 0) - 1;
      if ((u.spdDebuffTicks ?? 0) <= 0) u.spdDebuffPct = 0;
    }
    if ((u.dotTicks ?? 0) > 0) {
      u.dotTicks = (u.dotTicks ?? 0) - 1;
      if ((u.dotTicks ?? 0) <= 0) {
        u.dotAtkCoeff = 0;
        u.dotSourceAtk = 0;
      }
    }
    if ((u.provokeTicks ?? 0) > 0) {
      u.provokeTicks = (u.provokeTicks ?? 0) - 1;
      if ((u.provokeTicks ?? 0) <= 0) u.provokeTargetId = undefined;
    }
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
    opts?: { fromCounter?: boolean },
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

    if (target.cutImmune && target.cutImmune > 0) {
      target.cutImmune -= 1;
      this.log.push(`${target.name} 절단 면역`);
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

    let incomingMul = target.damageTakenMul ?? 1;
    if (
      target.stonePassive === "high_amp_dr" &&
      this.currentAmplify() >= 1.08
    ) {
      incomingMul *= 0.9;
    }

    const atkMul =
      (1 + (attacker.atkBuffPct ?? 0)) *
      (1 - (attacker.atkDebuffPct ?? 0));
    const defMul =
      (1 + (target.defBuffPct ?? 0)) *
      (1 - (target.defDebuffPct ?? 0));
    const { damage, crit } = computeDamage({
      atk: attacker.stats.atk * Math.max(0.3, atkMul),
      skillCoeff: coeff,
      attackerElement: attacker.element,
      defenderElement: target.element,
      defenderDef: target.stats.def * Math.max(0.3, defMul),
      amplify: this.currentAmplify(),
      critRate:
        attacker.stats.critRate +
        critBonus +
        (attacker.critRateBuff ?? 0),
      critDmg:
        attacker.stats.critDmg +
        critDmgExtra +
        (attacker.critDmgBuff ?? 0),
      rng: this.rng,
    });

    let captureMul = 1;
    if (attacker.kind === "monster") {
      const bonus = this.pendingCaptureDamageBonus[attacker.team] ?? 0;
      if (bonus > 0) {
        captureMul = 1 + bonus;
        this.pendingCaptureDamageBonus[attacker.team] = 0;
        this.log.push(
          `따냄 추가피해 ×${captureMul.toFixed(2)} (${attacker.name})`,
        );
      }
    }

    let remaining = Math.round(damage * incomingMul * captureMul);
    if (target.shieldHp && target.shieldHp > 0) {
      const absorbed = Math.min(target.shieldHp, remaining);
      target.shieldHp -= absorbed;
      remaining -= absorbed;
      if (target.shieldHp <= 0) target.shieldHp = 0;
    }

    const hpBefore = target.hp;
    target.hp = Math.max(0, target.hp - remaining);
    const applied = hpBefore - target.hp;
    if (attacker.team === "ally" && target.team === "enemy" && applied > 0) {
      this.allyDamageDealt += applied;
    }
    if (target.hp <= 0) {
      target.alive = false;
      this.log.push(`${target.name} defeated`);
    }

    // Nemesis: ATB on HP loss thresholds
    if (
      remaining > 0 &&
      target.alive &&
      (target.nemesisAtbPer7 ?? 0) > 0
    ) {
      const maxHp = target.originalMaxHp ?? target.stats.hp;
      const lostChunks = Math.floor((remaining / Math.max(1, maxHp)) * 100 / 7);
      if (lostChunks > 0) {
        const gain = lostChunks * (target.nemesisAtbPer7 ?? 0);
        target.atb = Math.min(ATB_THRESHOLD, target.atb + gain);
        this.log.push(`${target.name} 응징 ATB +${gain}`);
      }
    }

    // Destroy: reduce target max HP
    if (
      remaining > 0 &&
      target.alive &&
      (attacker.destroySets ?? 0) > 0 &&
      target.kind === "monster"
    ) {
      const orig = target.originalMaxHp ?? target.stats.hp;
      const already = target.destroyTakenFrac ?? 0;
      const perHitCap = 0.04 * (attacker.destroySets ?? 1);
      const fromDmg = (remaining * 0.3) / Math.max(1, orig);
      const add = Math.min(perHitCap, fromDmg, 0.6 - already);
      if (add > 0) {
        target.destroyTakenFrac = already + add;
        const newMax = Math.max(
          Math.round(orig * 0.4),
          Math.round(orig * (1 - (target.destroyTakenFrac ?? 0))),
        );
        target.stats = { ...target.stats, hp: newMax };
        target.hp = Math.min(target.hp, newMax);
        this.log.push(`${target.name} 파멸 최대HP → ${newMax}`);
      }
    }

    if (remaining > 0 && (attacker.lifestealPct ?? 0) > 0 && attacker.alive) {
      const heal = Math.round((remaining * (attacker.lifestealPct ?? 0)) / 100);
      if (heal > 0) {
        attacker.hp = Math.min(attacker.stats.hp, attacker.hp + heal);
        this.log.push(`${attacker.name} 흡혈 +${heal}`);
      }
    }

    if (
      remaining > 0 &&
      target.alive &&
      (attacker.stunOnHitChance ?? 0) > 0
    ) {
      if ((target.statusImmuneTurns ?? 0) > 0) {
        this.log.push(`${target.name} 상태이상 면역`);
      } else if (this.rng() * 100 < (attacker.stunOnHitChance ?? 0)) {
        target.stunnedTurns = Math.max(target.stunnedTurns ?? 0, 1);
        this.log.push(`${target.name} 기절`);
      }
    }

    if (
      remaining > 0 &&
      !opts?.fromCounter &&
      target.alive &&
      attacker.alive &&
      (target.counterChance ?? 0) > 0 &&
      this.rng() * 100 < (target.counterChance ?? 0)
    ) {
      this.log.push(`${target.name} 반격`);
      this.applyHit(target, attacker, 0.75 * SKILL_DMG_MUL, false, {
        fromCounter: true,
      });
    }

    return {
      attackerId: attacker.id,
      targetId: target.id,
      damage: Math.round(damage * captureMul),
      crit,
      usedSummonerSkill,
    };
  }

  /** Circle pickups: heal the picker's team, or bomb the opposing monsters. */
  private applyPercentHpToTeam(
    team: TeamId,
    pct: number,
    mode: "heal" | "hurt",
  ): number {
    let total = 0;
    for (const u of this.units) {
      if (!u.alive || u.team !== team) continue;
      if (mode === "hurt" && u.kind !== "monster") continue;
      const amount = Math.round(u.stats.hp * pct);
      if (mode === "heal") {
        const before = u.hp;
        u.hp = Math.min(u.stats.hp, u.hp + amount);
        total += u.hp - before;
        continue;
      }
      let rest = amount;
      const shield = u.shieldHp ?? 0;
      if (shield > 0) {
        const soak = Math.min(shield, rest);
        u.shieldHp = shield - soak;
        rest -= soak;
      }
      const before = u.hp;
      u.hp = Math.max(0, u.hp - rest);
      total += before - u.hp;
      if (u.hp <= 0) {
        u.alive = false;
        this.log.push(`${u.name} defeated`);
      }
    }
    return total;
  }

  private checkFinish(): void {
    // Defeat = all ally summons fallen.
    if (aliveSummons(this.units, "ally").length === 0) {
      this.finishReason = "enemy_win";
      this.phase = "finished";
      return;
    }
    // Enemy summons wiped — pause for next-wave intro, or win.
    if (aliveSummons(this.units, "enemy").length === 0) {
      if (this.currentWave < this.totalWaves && this.spawnWaveFn) {
        // Clear fallen enemy monsters so the rim empties before the next wave.
        this.units = this.units.filter(
          (u) => !(u.team === "enemy" && u.kind === "monster"),
        );
        this.phase = "await_wave";
        this.activeUnitId = null;
        this.log.push(`웨이브 ${this.currentWave} 격파`);
        return;
      }
      this.finishReason = "ally_win";
      this.phase = "finished";
    }
  }

  /**
   * Spawn the next enemy wave after a wipe. Call from UI after a short beat
   * so the empty rim / entrance animation can play.
   */
  resolveWaveTransition(): boolean {
    if (this.phase !== "await_wave" || !this.spawnWaveFn) return false;
    this.advanceWave();
    this.phase = "idle";
    this.activeUnitId = null;
    return true;
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
    if (this.phase === "await_wave") {
      this.resolveWaveTransition();
    }
    const unit = this.tickUntilReady();
    if (!unit) return [];
    if (this.phase === "await_stone") {
      if (!this.autoStone()) return [];
    }
    if (this.phase === "await_capture_shop") {
      this.chooseCaptureShop(pickCaptureShopChoice(this.rng));
    }
    if (this.phase !== "await_skill") return [];
    const sm = this.summonerOf(unit.team);
    const magics = sm.magicSkills ?? [];
    if (magics.length > 0) {
      const full = magics.find(
        (s) =>
          s.manaCostFrac >= 0.95 && this.canUseMagicSkill(unit, s.id),
      );
      if (full) return this.useSkill({ summonerSkill: full.id });
      const amp = magics.find(
        (s) => s.kind === "amplify" && this.canUseMagicSkill(unit, s.id),
      );
      if (amp && this.amplify < 1.08) {
        return this.useSkill({ summonerSkill: amp.id });
      }
      const clean = magics.find(
        (s) => s.kind === "board_clean" && this.canUseMagicSkill(unit, s.id),
      );
      if (clean && this.countEnemyStones(unit.team) >= 4) {
        return this.useSkill({ summonerSkill: clean.id });
      }
      const guard = magics.find(
        (s) =>
          (s.kind === "ally_shield" || s.kind === "damage_reduce") &&
          this.canUseMagicSkill(unit, s.id),
      );
      if (guard && this.allyMonstersWounded(unit.team, 0.55)) {
        return this.useSkill({ summonerSkill: guard.id });
      }
      const dual = magics.find(
        (s) => s.kind === "dual_stone" && this.canUseMagicSkill(unit, s.id),
      );
      if (dual) return this.useSkill({ summonerSkill: dual.id });
      const any = magics.find((s) => this.canUseMagicSkill(unit, s.id));
      if (any) return this.useSkill({ summonerSkill: any.id });
    }
    if (this.canUseSummonerSkill(unit)) {
      return this.useSkill({ summonerSkill: "open" });
    }
    // Contest Amplify early when lagging (esp. enemy summoner mana race).
    if (this.canUseSummonerDeclare(unit) && this.amplify < 1.08) {
      return this.useSkill({ summonerSkill: "declare" });
    }
    const cleanNeed = unit.team === "enemy" ? 3 : 4;
    if (
      this.canUseSummonerClean(unit) &&
      this.countEnemyStones(unit.team) >= cleanNeed
    ) {
      return this.useSkill({ summonerSkill: "clean" });
    }
    if (
      this.canUseSummonerGuard(unit) &&
      this.allyMonstersWounded(unit.team, 0.55)
    ) {
      return this.useSkill({ summonerSkill: "guard" });
    }
    if (this.canUseSummonerDeclare(unit)) {
      return this.useSkill({ summonerSkill: "declare" });
    }
    if (this.canUseSummonerDual(unit)) {
      return this.useSkill({ summonerSkill: "dual" });
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
