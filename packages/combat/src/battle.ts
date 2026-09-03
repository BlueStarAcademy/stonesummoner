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
  MAX_BOARD_TOKENS,
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
import {
  addStatus,
  advanceUnitStatuses,
  ensureStatuses,
  hasStatus,
  removeStatusKind,
  removeStatuses,
  statusesOf,
  syncLegacyStatuses,
  tickUnitStatuses,
} from "./statuses.js";
import type {
  BattlePhase,
  Element,
  FinishReason,
  SummonerState,
  TeamId,
  Unit,
  BoardTeamBuff,
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

/** Utility AUTO: emergency recovery/control first, then highest ready skill. */
export function pickAutoSkillIndex(unit: Unit, units: Unit[]): number {
  const skills = unit.skills;
  if (!skills?.length) return 0;
  if (
    hasStatus(unit, "stun") ||
    hasStatus(unit, "freeze") ||
    hasStatus(unit, "sleep") ||
    hasStatus(unit, "silence") ||
    hasStatus(unit, "provoke")
  ) {
    return 0;
  }
  const cds = ensureSkillCd(unit);

  const allies = units.filter(
    (u) => u.alive && u.team === unit.team && u.kind === "monster",
  );
  const deadAllies = units.filter(
    (u) => !u.alive && u.team === unit.team && u.kind === "monster",
  );
  const enemies = units.filter(
    (u) => u.alive && u.team !== unit.team && u.kind === "monster",
  );
  const lowest = allies.reduce<Unit | null>((best, u) => {
    if (!best) return u;
    return u.hp / u.stats.hp < best.hp / best.stats.hp ? u : best;
  }, null);
  const needHeal = !!lowest && lowest.hp / lowest.stats.hp < 0.55;

  const firstReady = (predicate: (skill: SkillDef) => boolean): number => {
    for (let i = skills.length - 1; i >= 0; i--) {
      if (cds[i]! > 0) continue;
      if (predicate(skills[i]!)) return i;
    }
    return -1;
  };

  if (deadAllies.length) {
    const revive = firstReady((skill) =>
      skill.effects.some((effect) => effect.kind === "revive"),
    );
    if (revive >= 0) return revive;
  }
  if (needHeal) {
    const heal = firstReady((skill) =>
      skill.effects.some(
        (effect) => effect.kind === "heal" || effect.kind === "hot",
      ),
    );
    if (heal >= 0) return heal;
  }
  if (allies.some((ally) => statusesOf(ally, "debuff").length > 0)) {
    const cleanse = firstReady((skill) =>
      skill.effects.some((effect) => effect.kind === "cleanse"),
    );
    if (cleanse >= 0) return cleanse;
  }
  if (enemies.some((enemy) => statusesOf(enemy, "buff").length > 0)) {
    const strip = firstReady((skill) =>
      skill.effects.some((effect) => effect.kind === "strip"),
    );
    if (strip >= 0) return strip;
  }

  const useful = firstReady((skill) =>
    skill.effects.some((effect) => {
      if (effect.kind === "dot") {
        return enemies.some((enemy) => !hasStatus(enemy, "dot"));
      }
      if (effect.kind === "silence") {
        return enemies.some((enemy) => !hasStatus(enemy, "silence"));
      }
      return true;
    }),
  );
  if (useful >= 0) return useful;

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
  /**
   * Mid-placement gold/crystal loot (ally only). Chance values are 0–1;
   * amounts roll inclusive [min, max] then apply amountMul.
   */
  stoneLoot?: {
    goldChance: number;
    goldMin: number;
    goldMax: number;
    goldAmountMul: number;
    crystalChance: number;
    crystalMin: number;
    crystalMax: number;
  };
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
  /** Modern Cairos boss rules, independent of StoneSummoner board modules. */
  dungeonBoss?: {
    kind: "giant" | "dragon" | "necro";
    unitId: string;
    abyss: boolean;
  };
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
  /** Capture/item effects active until immediately before this team's next stone. */
  boardTeamBuffs: Record<TeamId, BoardTeamBuff[]> = {
    ally: [],
    enemy: [],
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
  private readonly dungeonBoss: BattleConfig["dungeonBoss"];
  private giantHitCounter = 0;
  private necroBarrierHits = 0;
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
  private stoneLoot: BattleConfig["stoneLoot"];
  private rng: () => number;
  private spawnWaveFn?: (wave: number) => Unit[];
  private turnStatusUnitId: string | null = null;
  private turnStatusIds = new Set<string>();

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
        statuses: u.statuses?.map((status) => ({ ...status })),
        skills: u.skills ? u.skills.map((s) => ({ ...s, effects: [...s.effects] })) : u.skills,
      };
      ensureSkillCd(copy);
      ensureStatuses(copy);
      return copy;
    });
    this.allySummoner = { ...config.allySummoner };
    this.enemySummoner = { ...config.enemySummoner };
    this.powerGapCap = config.powerGapAmplifyCap ?? 1.25;
    this.inscriptionAmplifyAdd = config.inscriptionAmplifyCapAdd ?? 0;
    this.inscriptionItemSpawn = config.inscriptionItemSpawnBonus ?? 0;
    this.stoneLoot = config.stoneLoot;
    this.rng = config.rng ?? Math.random;
    this.modules = config.modules ?? {};
    this.dungeonBoss = config.dungeonBoss;
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
    this.resetDungeonBossState();
  }

  private resetDungeonBossState(): void {
    this.giantHitCounter = 0;
    const boss = this.dungeonBoss
      ? this.getUnit(this.dungeonBoss.unitId)
      : undefined;
    this.necroBarrierHits =
      boss && this.dungeonBoss?.kind === "necro"
        ? this.dungeonBoss.abyss
          ? 7
          : 5
        : 0;
  }

  private applyDungeonBossTurnRule(unit: Unit): void {
    if (!this.dungeonBoss || unit.id !== this.dungeonBoss.unitId) return;
    if (this.dungeonBoss.kind !== "dragon") return;
    removeStatuses(unit, "debuff");
    this.log.push(`용의 정화`);
  }

  /** 보강: each completed set shields only the monster wearing it. */
  private applySymbolStartShields(): void {
    for (const team of ["ally", "enemy"] as const) {
      const mons = this.units.filter(
        (u) => u.alive && u.team === team && u.kind === "monster",
      );
      for (const u of mons) {
        const shield = Math.round((u.startShieldPct ?? 0) * u.stats.hp);
        if (shield <= 0) continue;
        u.shieldHp = (u.shieldHp ?? 0) + shield;
        u.shieldTurns = Math.max(u.shieldTurns ?? 0, 3);
        u.shieldStatusVisible = false;
        this.log.push(`보강 실드 (${u.name} +${shield} · 3턴)`);
      }
    }
  }

  activeBoardBuffs(team: TeamId): readonly BoardTeamBuff[] {
    return this.boardTeamBuffs[team];
  }

  private addBoardTeamBuff(team: TeamId, buff: BoardTeamBuff): void {
    this.boardTeamBuffs[team] = [
      ...this.boardTeamBuffs[team].filter((item) => item.id !== buff.id),
      buff,
    ];
  }

  private clearBoardTeamBuffs(team: TeamId): void {
    if (this.boardTeamBuffs[team].length === 0) return;
    this.boardTeamBuffs[team] = [];
    this.log.push(`보드 버프 종료 (${team})`);
  }

  private boardBuffTotals(team: TeamId): {
    damageBonus: number;
    critRateBonus: number;
    critDmgBonus: number;
    spdPct: number;
  } {
    return this.boardTeamBuffs[team].reduce(
      (out, buff) => ({
        damageBonus: out.damageBonus + (buff.damageBonus ?? 0),
        critRateBonus: out.critRateBonus + (buff.critRateBonus ?? 0),
        critDmgBonus: out.critDmgBonus + (buff.critDmgBonus ?? 0),
        spdPct: out.spdPct + (buff.spdPct ?? 0),
      }),
      { damageBonus: 0, critRateBonus: 0, critDmgBonus: 0, spdPct: 0 },
    );
  }

  private boardShieldForTeam(team: TeamId, pct: number): Record<string, number> {
    return Object.fromEntries(
      this.units
        .filter((u) => u.alive && u.team === team)
        .map((u) => [u.id, Math.round(u.stats.hp * pct)]),
    );
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

  /**
   * Remaining unit actions before `team` next places a stone.
   * 0 means that team is placing now.
   */
  turnsUntilStone(team: TeamId): number {
    if (this.finishReason) return 0;
    const active = this.activeUnitId ? this.getUnit(this.activeUnitId) : null;
    if (
      this.phase === "await_stone" &&
      active?.alive &&
      active.team === team
    ) {
      return 0;
    }

    const atb = new Map<string, number>();
    for (const u of this.units) atb.set(u.id, u.atb);
    let last: TeamId | null = this.lastStoneTeam;
    let actions = 0;
    if (
      active?.alive &&
      (this.phase === "await_stone" ||
        this.phase === "await_skill" ||
        this.phase === "await_capture_shop")
    ) {
      atb.set(active.id, 0);
      if (this.phase === "await_stone") last = active.team;
      if (active.team !== team) actions += 1;
    }

    const spdMulOf = (u: Unit): number => {
      const boardSpd = this.boardBuffTotals(u.team).spdPct;
      const boost = ((u.spdBoostTurns ?? 0) > 0 ? 1.4 : 1) * (1 + boardSpd);
      const buff =
        (1 + (u.spdBuffPct ?? 0)) *
        Math.max(0.3, 1 - (u.spdDebuffPct ?? 0));
      return boost * buff;
    };
    const locked = (u: Unit): boolean =>
      hasStatus(u, "stun") ||
      hasStatus(u, "freeze") ||
      hasStatus(u, "sleep");

    for (let step = 0; step < 240; step++) {
      for (const u of this.units) {
        if (!u.alive) continue;
        atb.set(
          u.id,
          (atb.get(u.id) ?? 0) + u.stats.spd * 0.1 * spdMulOf(u),
        );
      }
      const ready = this.units
        .filter((u) => u.alive && (atb.get(u.id) ?? 0) >= ATB_THRESHOLD)
        .sort(
          (a, b) =>
            (atb.get(b.id) ?? 0) - (atb.get(a.id) ?? 0) ||
            b.stats.spd - a.stats.spd,
        );
      const unit = ready[0];
      if (!unit) continue;
      atb.set(unit.id, 0);
      if (locked(unit)) continue;
      if (last !== unit.team) {
        if (unit.team === team) return actions;
        last = unit.team;
      }
      actions += 1;
    }
    return actions;
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
        const boardSpd = this.boardBuffTotals(u.team).spdPct;
        const spdMul = ((u.spdBoostTurns ?? 0) > 0 ? 1.4 : 1) * (1 + boardSpd);
        const spdBuff =
          (1 + (u.spdBuffPct ?? 0)) *
          Math.max(0.3, 1 - (u.spdDebuffPct ?? 0));
        u.atb += u.stats.spd * 0.1 * spdMul * spdBuff;
      }
      const ready = this.units
        .filter((u) => u.alive && u.atb >= ATB_THRESHOLD)
        .sort((a, b) => b.atb - a.atb || b.stats.spd - a.stats.spd);
      if (ready[0]) {
        const unit = ready[0];
        unit.atb = 0;
        this.beginStatusTurn(unit);
        if ((unit.spdBoostTurns ?? 0) > 0) {
          unit.spdBoostTurns = (unit.spdBoostTurns ?? 0) - 1;
        }
        const control = hasStatus(unit, "stun")
          ? "기절"
          : hasStatus(unit, "freeze")
            ? "빙결"
            : hasStatus(unit, "sleep")
              ? "수면"
              : null;
        const periodic = tickUnitStatuses(unit);
        if (periodic.hotHeal > 0 && !hasStatus(unit, "heal_block")) {
          const before = unit.hp;
          unit.hp = Math.min(unit.stats.hp, unit.hp + periodic.hotHeal);
          this.log.push(`${unit.name} 지속회복 +${unit.hp - before}`);
        }
        if (periodic.dotDamage > 0) {
          this.dealDirectDamage(unit, periodic.dotDamage);
          this.log.push(`${unit.name} 지속피해 ${periodic.dotDamage}`);
        }
        if (!unit.alive) {
          this.checkFinish();
          if (this.finishReason || this.isPhase("await_wave")) return null;
          continue;
        }
        if (control) {
          this.log.push(`${unit.name} ${control} — 행동 불가`);
          this.advanceStatusesAfterTurn(unit);
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
      this.addBoardTeamBuff(unit.team, {
        id: token.id,
        source: "item",
        critRateBonus: bonus,
      });
      chips.push({ kind: "crit", n: bonus });
      this.log.push(
        `${unit.name} 획득 ${name} (치명↑${unit.stonePassive === "crit_charm_plus" ? "×2" : ""})`,
      );
      return chips;
    }
    if (token.id === "shield_core") {
      const shieldByUnit = this.boardShieldForTeam(unit.team, 0.28);
      const shield = Object.values(shieldByUnit).reduce((sum, n) => sum + n, 0);
      this.addBoardTeamBuff(unit.team, {
        id: token.id,
        source: "item",
        shieldByUnit,
      });
      chips.push({ kind: "shield", n: shield });
      this.log.push(`${unit.name} 획득 ${name} (아군 실드 +${shield})`);
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
        if (!u.alive || u.team !== unit.team) continue;
        u.atb = Math.min(ATB_THRESHOLD, u.atb + 50);
        boosted++;
      }
      this.addBoardTeamBuff(unit.team, {
        id: token.id,
        source: "item",
        spdPct: 0.4,
      });
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
      this.addBoardTeamBuff(unit.team, {
        id: token.id,
        source: "item",
        damageBonus: 0.08,
      });
      chips.push({ kind: "atk", n: 8 });
      this.log.push(
        `${unit.name} 획득 ${name} (아군 피해 +8%)`,
      );
      return chips;
    }
    if (token.id === "bait_stone") {
      const shieldByUnit = this.boardShieldForTeam(unit.team, 0.15);
      const shield = Object.values(shieldByUnit).reduce((sum, n) => sum + n, 0);
      this.addBoardTeamBuff(unit.team, {
        id: token.id,
        source: "item",
        damageBonus: 0.05,
        shieldByUnit,
      });
      const lure = this.placeBaitLure({ x: token.x, y: token.y }, unit.team);
      chips.push({ kind: "shield", n: shield });
      this.log.push(
        `${unit.name} 획득 ${name} (실드 +${shield}${lure ? ` · 미끼 (${lure.x},${lure.y})` : ""})`,
      );
      return chips;
    }
    if (token.id === "transform_dust") {
      const flipped = this.applyTransformDust({ x: token.x, y: token.y });
      this.addBoardTeamBuff(unit.team, {
        id: token.id,
        source: "item",
        damageBonus: 0.06 + flipped * 0.03,
      });
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
    this.addBoardTeamBuff(unit.team, {
      id: token.id,
      source: "item",
      damageBonus: gains.skillAmplifyBonus,
    });
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
    if (this.tokens.length >= MAX_BOARD_TOKENS) return;
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
    this.tokens.push({ id, x: spot.x, y: spot.y, turnsLeft: 1 });
    this.log.push(`${itemDef(id).nameKo} 스폰 (${spot.x},${spot.y})`);
  }

  /** Uneaten board items age out after one intervening stone play. */
  private tickBoardTokenExpiry(): void {
    if (this.tokens.length === 0) return;
    this.tokens = this.tokens
      .map((token) => ({
        ...token,
        turnsLeft: (token.turnsLeft ?? 1) - 1,
      }))
      .filter((token) => token.turnsLeft > 0);
  }

  /** Ally stone placement: chance to earn gold/crystal from difficulty + gear. */
  private rollStoneLootChips(): StoneReportChip[] {
    const loot = this.stoneLoot;
    if (!loot) return [];
    const chips: StoneReportChip[] = [];
    if (this.rng() < loot.goldChance) {
      const span = Math.max(0, loot.goldMax - loot.goldMin);
      const base = loot.goldMin + Math.floor(this.rng() * (span + 1));
      const n = Math.max(1, Math.round(base * loot.goldAmountMul));
      chips.push({ kind: "gold", n });
      this.log.push(`착수 골드 +${n}`);
    }
    if (this.rng() < loot.crystalChance) {
      const span = Math.max(0, loot.crystalMax - loot.crystalMin);
      const n = Math.max(
        1,
        loot.crystalMin + Math.floor(this.rng() * (span + 1)),
      );
      chips.push({ kind: "crystal", n });
      this.log.push(`착수 크리스탈 +${n}`);
    }
    return chips;
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

    // The old cycle ends only once the team's next placement is known legal.
    this.clearBoardTeamBuffs(unit.team);
    this.lastStoneReport = null;
    this.tickBoardTokenExpiry();
    const chips: StoneReportChip[] = [];
    let claimedVictory = false;
    const picked = this.tokenAt(point.x, point.y);

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
    let capturePassiveDamage = 0;
    if (unit.stonePassive === "capture_amp" && result.capturedCount > 0) {
      capturePassiveDamage += 0.04;
    }
    if (
      unit.stonePassive === "stone_amp_proc" &&
      result.capturedCount > 0 &&
      this.rng() < 0.15
    ) {
      capturePassiveDamage += 0.06;
      this.log.push(`스톤패시브: ${unit.name} 연타착수`);
    }

    if (this.modules.moduleE) {
      if (unit.kind === "summoner") {
        manaGain += 12;
        this.log.push(`소환사 착수 보너스`);
      }
      if (this.circleElement && unit.element === this.circleElement) {
        this.log.push(`속성 테두리 (${unit.element})`);
      }
      if (
        (unit.element === "light" || unit.element === "dark") &&
        this.circle.boardPhase >= 1
      ) {
        this.log.push(`이중층 (${unit.element})`);
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
      this.openingBonusPending = false;
      this.log.push(`포석 안내 종료`);
    }

    this.amplify = clampAmplify(
      this.amplify + ampDelta,
      this.phaseAmplifyCap(),
      this.powerGapCap,
    );
    this.skillAmplifyBonus = 0;

    const sm = this.summonerOf(unit.team);
    if (gains.captureDamageBonus > 0) {
      this.addBoardTeamBuff(unit.team, {
        id: "capture",
        source: "capture",
        damageBonus: gains.captureDamageBonus + capturePassiveDamage,
        critDmgBonus:
          unit.stonePassive === "capture_crit" ? 10 : undefined,
      });
      chips.push({
        kind: "capture",
        n: Math.round(gains.captureDamageBonus * 100),
      });
      this.log.push(
        `따냄 버프: 아군 피해 +${Math.round(gains.captureDamageBonus * 100)}%`,
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
        const shapeMana = sh.mana * manaMul;
        if (shapeMana > 0) manaGain += shapeMana;
        sm.mana = Math.min(sm.manaMax, sm.mana + shapeMana);
        // Shape bonuses still grant mana; do not surface Go jargon chips in UI.
        this.log.push(`형상 ${sh.labelKo}`);
      }
    }

    if (unit.team === "ally") {
      chips.push(...this.rollStoneLootChips());
    }

    const earnedBoardEffect = result.capturedCount > 0 || !!picked;
    if (earnedBoardEffect && unit.stonePassive === "stone_ally_atb") {
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
    if (earnedBoardEffect && unit.stonePassive === "stone_ally_heal") {
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
      chips.some((c) => c.kind === "shield");
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
    if (this.isPhase("finished") || this.isPhase("await_wave")) {
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
      this.addBoardTeamBuff(unit.team, {
        id: "capture-shop-amplify",
        source: "capture",
        damageBonus: 0.08,
      });
      this.log.push(`사석상점: Amplify 강화`);
    } else {
      const shieldByUnit = this.boardShieldForTeam(unit.team, 0.12);
      const shield = Object.values(shieldByUnit).reduce((sum, n) => sum + n, 0);
      this.addBoardTeamBuff(unit.team, {
        id: "capture-shop-clean",
        source: "capture",
        shieldByUnit,
      });
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
      if (!("target" in effect)) {
        ids.add(unit.id);
        continue;
      }
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
          ids.add(
            (effect.kind === "revive"
              ? this.resolveAllyTarget(unit, targetId, true)
              : this.resolveAllyTarget(unit, targetId))?.id ?? unit.id,
          );
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


  /** Pick up to `count` living units; prefer `preferredId` when present. */
  private pickLivingTargets(
    pool: Unit[],
    count: number | undefined,
    preferredId?: string,
  ): Unit[] {
    const living = pool.filter((u) => u.alive);
    if (!living.length) return [];
    if (count == null || count <= 0 || count >= living.length) return living;
    const n = Math.max(1, Math.min(5, Math.floor(count)));
    const chosen: Unit[] = [];
    const preferred = preferredId
      ? living.find((u) => u.id === preferredId)
      : undefined;
    if (preferred) chosen.push(preferred);
    const rest = living.filter((u) => u.id !== preferred?.id);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
    for (const u of rest) {
      if (chosen.length >= n) break;
      chosen.push(u);
    }
    return chosen.slice(0, n);
  }

  private applyMagicAilment(
    source: Unit,
    target: Unit,
    ailment: {
      kind: "burn" | "poison" | "stun" | "freeze" | "sleep" | "silence";
      turns: number;
      chance: number;
    },
  ): void {
    if (!this.effectLands(source, target, ailment.chance)) return;
    if (ailment.kind === "burn" || ailment.kind === "poison") {
      const value =
        ailment.kind === "poison"
          ? target.stats.hp * 0.05
          : source.stats.atk *
            Math.max(
              0.3,
              (1 + (source.atkBuffPct ?? 0)) * (1 - (source.atkDebuffPct ?? 0)),
            ) *
            0.12;
      addStatus(target, {
        kind: ailment.kind,
        sourceUnitId: source.id,
        polarity: "debuff",
        turns: ailment.turns,
        stacking: "stack",
        dispellable: true,
        amount: ailment.kind === "poison" ? 0.05 : 0.12,
        value,
      });
    } else {
      addStatus(target, {
        kind: ailment.kind,
        sourceUnitId: source.id,
        polarity: "debuff",
        turns: ailment.turns,
        stacking: "replace",
        dispellable: true,
      });
    }
    this.log.push(`${target.name} ${ailment.kind} ${ailment.turns}턴`);
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
        ...(def.kind === "aoe_damage" ||
          def.kind === "enemy_debuff" ||
          def.kind === "enemy_ailment"
          ? [{ kind: "damage", target: "all_enemies", coeff: 0 } as const]
          : def.kind === "single_damage"
            ? [{ kind: "damage", target: "single", coeff: 0 } as const]
            : [{ kind: "buff", target: "all_allies", axis: "atk", amount: 0, turns: 0 } as const]),
      ],
      targetId,
    );
    const finish = (): SkillResult[] => {
      this.advanceStatusesAfterTurn(unit);
      return this.tagSkillResults(
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
    };
    this.log.push(`${unit.name} ${def.nameKo}`);

    switch (def.kind) {
      case "aoe_damage": {
        const foes = this.pickLivingTargets(
          aliveSummons(
            this.units,
            unit.team === "ally" ? "enemy" : "ally",
          ),
          def.hitCount,
          targetId,
        );
        const hits = Math.max(1, Math.min(5, def.hits ?? 1));
        const perHit = power / hits;
        for (const t of foes) {
          for (let hit = 0; hit < hits; hit += 1) {
            results.push(this.applyHit(unit, t, perHit, true));
            if (def.ailment) this.applyMagicAilment(unit, t, def.ailment);
          }
        }
        break;
      }
      case "single_damage": {
        const foes = this.pickLivingTargets(
          aliveSummons(
            this.units,
            unit.team === "ally" ? "enemy" : "ally",
          ),
          def.hitCount && def.hitCount > 1 ? def.hitCount : 1,
          targetId,
        );
        const hits = Math.max(1, Math.min(5, def.hits ?? 1));
        const perHit = power / hits;
        for (const t of foes) {
          for (let hit = 0; hit < hits; hit += 1) {
            results.push(this.applyHit(unit, t, perHit, true));
            if (def.ailment) this.applyMagicAilment(unit, t, def.ailment);
          }
        }
        break;
      }
      case "enemy_ailment": {
        const foes = this.pickLivingTargets(
          aliveSummons(
            this.units,
            unit.team === "ally" ? "enemy" : "ally",
          ),
          def.hitCount,
          targetId,
        );
        const ailment = def.ailment ?? {
          kind: "burn" as const,
          turns: def.turns ?? 2,
          chance: 1,
        };
        for (const t of foes) {
          this.applyMagicAilment(unit, t, ailment);
        }
        break;
      }
      case "ally_cleanse": {
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const ally of allies) {
          const removed = removeStatuses(
            ally,
            "debuff",
            def.cleanseCount ?? Infinity,
          );
          this.log.push(`${ally.name} 약화 해제 ${removed.length}`);
        }
        break;
      }
      case "ally_buff_atk": {
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const u of allies) {
          this.applyStatBuff(u, "atk", power, def.turns ?? 2);
        }
        break;
      }
      case "ally_buff_spd": {
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const u of allies) {
          this.applyStatBuff(u, "spd", power, def.turns ?? 2);
        }
        break;
      }
      case "ally_buff_crit": {
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const u of allies) {
          this.applyStatBuff(u, "critRate", power, def.turns ?? 2);
        }
        break;
      }
      case "ally_heal": {
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const u of allies) {
          const amount = Math.round(u.stats.hp * power);
          u.hp = Math.min(u.stats.hp, u.hp + amount);
          this.log.push(`${u.name} 회복 +${amount}`);
        }
        break;
      }
      case "ally_shield": {
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const u of allies) {
          const amount = Math.round(u.stats.hp * power);
          u.shieldHp = (u.shieldHp ?? 0) + amount;
          u.shieldStatusVisible = true;
          addStatus(u, {
            kind: "shield",
            sourceUnitId: unit.id,
            polarity: "buff",
            turns: def.turns ?? 2,
            stacking: "stack",
            dispellable: true,
            value: amount,
          });
        }
        break;
      }
      case "enemy_debuff": {
        const foes = this.pickLivingTargets(
          aliveSummons(
            this.units,
            unit.team === "ally" ? "enemy" : "ally",
          ),
          def.hitCount,
          targetId,
        );
        for (const t of foes) {
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
        const allies = this.pickLivingTargets(
          aliveSummons(this.units, unit.team),
          def.hitCount,
          targetId,
        );
        for (const u of allies) {
          this.applyStatBuff(u, "damageReduce", power, def.turns ?? 2);
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
    this.beginStatusTurn(unit);
    this.applyDungeonBossTurnRule(unit);
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
        u.shieldStatusVisible = true;
        addStatus(u, {
          kind: "shield",
          sourceUnitId: unit.id,
          polarity: "buff",
          turns: 2,
          stacking: "stack",
          dispellable: true,
          value: amount,
        });
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
          this.applyStatBuff(
            u,
            "atk",
            ult.leaderAtkBuffPct,
            ult.leaderAtkBuffTicks,
            unit.id,
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
      if (
        hasStatus(unit, "stun") ||
        hasStatus(unit, "freeze") ||
        hasStatus(unit, "sleep")
      ) {
        this.log.push(`${unit.name} 기절 — 스킬 불가`);
        return [];
      }
      if (hasStatus(unit, "silence") || hasStatus(unit, "provoke")) {
        skillIndex = 0;
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
          this.advanceStatusesAfterTurn(unit);
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
    this.advanceStatusesAfterTurn(unit);
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
    const provoke = statusesOf(unit, "debuff").find(
      (status) => status.kind === "provoke",
    );
    if (provoke?.linkedUnitId) {
      const forced = this.getUnit(provoke.linkedUnitId);
      if (forced?.alive && forced.team !== unit.team && forced.kind === "monster") {
        return forced;
      }
    }
    const enemies = this.units.filter(
      (candidate) =>
        candidate.alive &&
        candidate.team !== unit.team &&
        candidate.kind === "monster",
    );
    let target =
      (targetId && enemies.find((candidate) => candidate.id === targetId)) ||
      enemies.sort((a, b) => {
        const dangerA =
          (a.stats.atk * a.stats.spd) / Math.max(1, a.hp / a.stats.hp);
        const dangerB =
          (b.stats.atk * b.stats.spd) / Math.max(1, b.hp / b.stats.hp);
        return dangerB - dangerA || a.hp - b.hp;
      })[0] ||
      pickDefaultTarget(enemies);
    if (!target || !target.alive) return null;
    return target;
  }

  private resolveHostileEffectTarget(
    unit: Unit,
    effectKind: SkillEffect["kind"],
    targetId?: string,
  ): Unit | null {
    if (targetId || hasStatus(unit, "provoke")) {
      return this.resolveSingleTarget(unit, targetId);
    }
    const enemies = aliveSummons(
      this.units,
      unit.team === "ally" ? "enemy" : "ally",
    );
    if (effectKind === "strip") {
      return (
        enemies.sort(
          (a, b) =>
            statusesOf(b, "buff").length - statusesOf(a, "buff").length,
        )[0] ?? null
      );
    }
    if (
      effectKind === "dot" ||
      effectKind === "silence" ||
      effectKind === "heal_block"
    ) {
      const kind =
        effectKind === "heal_block" ? "heal_block" : effectKind;
      const fresh = enemies.filter((enemy) => !hasStatus(enemy, kind));
      if (fresh.length) {
        return fresh.sort((a, b) => a.hp - b.hp)[0] ?? null;
      }
    }
    return this.resolveSingleTarget(unit);
  }

  private resolveAllyTarget(
    unit: Unit,
    targetId?: string,
    includeDead = false,
  ): Unit | null {
    const allies = this.units.filter(
      (candidate) =>
        candidate.team === unit.team &&
        candidate.kind === "monster" &&
        (includeDead || candidate.alive),
    );
    const explicit =
      targetId && allies.find((candidate) => candidate.id === targetId);
    if (explicit) return explicit;
    return (
      allies.sort(
        (a, b) =>
          Number(a.alive) - Number(b.alive) ||
          a.hp / a.stats.hp - b.hp / b.stats.hp,
      )[0] ?? null
    );
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
      const effectTarget = "target" in effect ? effect.target : "self";
      const enemyTargets =
        effectTarget === "all_enemies"
          ? aliveSummons(
              this.units,
              unit.team === "ally" ? "enemy" : "ally",
            )
          : [this.resolveHostileEffectTarget(unit, effect.kind, targetId)].filter(
              (target): target is Unit => !!target,
            );
      const allyTargets =
        effectTarget === "self"
          ? [unit]
          : effectTarget === "all_allies"
            ? aliveSummons(this.units, unit.team)
            : [this.resolveAllyTarget(unit, targetId)].filter(
                (target): target is Unit => !!target,
              );

      if (effect.kind === "damage") {
        const hits = Math.max(1, Math.min(5, effect.hits ?? 1));
        const perHit = effect.coeff / hits;
        for (const target of enemyTargets) {
          for (let hit = 0; hit < hits; hit += 1) {
            results.push(
              this.applyHit(unit, target, perHit, false, {
                source: effect.source,
                sourceFactor: effect.sourceFactor,
                ignoreDef: effect.ignoreDef,
              }),
            );
          }
        }
      } else if (effect.kind === "heal") {
        for (const target of allyTargets) {
          const amount = hasStatus(target, "heal_block")
            ? 0
            : Math.round(target.stats.hp * effect.coeff);
          const before = target.hp;
          target.hp = Math.min(target.stats.hp, target.hp + amount);
          const applied = target.hp - before;
          this.log.push(`${target.name} 회복 +${applied}`);
          results.push({
            attackerId: unit.id,
            targetId: target.id,
            damage: -applied,
            crit: false,
            usedSummonerSkill: false,
          });
        }
      } else if (effect.kind === "hot") {
        for (const target of allyTargets) {
          addStatus(target, {
            kind: "hot",
            sourceUnitId: unit.id,
            polarity: "buff",
            turns: effect.turns,
            stacking: "stack",
            dispellable: true,
            value: Math.round(target.stats.hp * effect.coeff),
          });
        }
      } else if (effect.kind === "shield") {
        for (const target of allyTargets) {
          const amount = Math.round(target.stats.hp * effect.coeff);
          target.shieldHp = (target.shieldHp ?? 0) + amount;
          target.shieldStatusVisible = true;
          addStatus(target, {
            kind: "shield",
            sourceUnitId: unit.id,
            polarity: "buff",
            turns: 2,
            stacking: "stack",
            dispellable: true,
            value: amount,
          });
          this.log.push(`${target.name} 실드 +${amount}`);
          results.push({
            attackerId: unit.id,
            targetId: target.id,
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
        for (const target of allyTargets) {
          this.applyStatBuff(target, effect.axis, effect.amount, effect.turns, unit.id);
          this.log.push(
            `${target.name} ${effect.axis} 버프 +${Math.round(effect.amount * 100)}%`,
          );
        }
      } else if (effect.kind === "debuff") {
        for (const target of enemyTargets) {
          if (!this.effectLands(unit, target, this.effectChance(effect))) continue;
          this.applyStatDebuff(target, effect.axis, effect.amount, effect.turns, unit.id);
          this.log.push(
            `${target.name} ${effect.axis} 약화 -${Math.round(effect.amount * 100)}%`,
          );
        }
      } else if (effect.kind === "dot") {
        const damageHits = Math.max(
          1,
          ...skill.effects
            .filter((entry): entry is Extract<SkillDef["effects"][number], { kind: "damage" }> =>
              entry.kind === "damage",
            )
            .map((entry) => entry.hits ?? 1),
        );
        const rolls =
          effect.chance != null && damageHits > 1 ? damageHits : 1;
        const statusKind =
          effect.dotKind === "burn"
            ? "burn"
            : effect.dotKind === "poison"
              ? "poison"
              : "dot";
        for (const target of enemyTargets) {
          for (let roll = 0; roll < rolls; roll += 1) {
            if (!this.effectLands(unit, target, this.effectChance(effect))) continue;
            const atkSnapshot =
              unit.stats.atk *
              Math.max(
                0.3,
                (1 + (unit.atkBuffPct ?? 0)) *
                  (1 - (unit.atkDebuffPct ?? 0)),
              );
            const value =
              statusKind === "poison"
                ? target.stats.hp * effect.coeff
                : atkSnapshot * effect.coeff;
            addStatus(target, {
              kind: statusKind,
              sourceUnitId: unit.id,
              polarity: "debuff",
              turns: effect.turns,
              stacking: "stack",
              dispellable: true,
              amount: effect.coeff,
              value,
            });
            this.log.push(`${target.name} ${statusKind} ${effect.turns}턴`);
          }
        }
      } else if (effect.kind === "cc") {
        const damageHits = Math.max(
          1,
          ...skill.effects
            .filter((entry): entry is Extract<SkillDef["effects"][number], { kind: "damage" }> =>
              entry.kind === "damage",
            )
            .map((entry) => entry.hits ?? 1),
        );
        const rolls =
          effect.chance != null && damageHits > 1 ? damageHits : 1;
        for (const target of enemyTargets) {
          for (let roll = 0; roll < rolls; roll += 1) {
            if (!this.effectLands(unit, target, effect.chance ?? 1)) continue;
            addStatus(target, {
              kind: effect.cc,
              sourceUnitId: unit.id,
              polarity: "debuff",
              turns: effect.turns,
              stacking: "replace",
              dispellable: true,
            });
            this.log.push(`${target.name} ${effect.cc} ${effect.turns}턴`);
            break;
          }
        }
      } else if (effect.kind === "strip") {
        for (const target of enemyTargets) {
          const removed = removeStatuses(target, "buff", effect.count ?? Infinity);
          const strippedShield = removed
            .filter((status) => status.kind === "shield")
            .reduce((sum, status) => sum + (status.value ?? 0), 0);
          target.shieldHp = Math.max(0, (target.shieldHp ?? 0) - strippedShield);
          this.log.push(`${target.name} 강화 해제 ${removed.length}`);
        }
      } else if (effect.kind === "cleanse") {
        for (const target of allyTargets) {
          const removed = removeStatuses(target, "debuff", effect.count ?? Infinity);
          this.log.push(`${target.name} 약화 해제 ${removed.length}`);
        }
      } else if (effect.kind === "heal_block" || effect.kind === "silence") {
        const damageHits = Math.max(
          1,
          ...skill.effects
            .filter((entry): entry is Extract<SkillDef["effects"][number], { kind: "damage" }> =>
              entry.kind === "damage",
            )
            .map((entry) => entry.hits ?? 1),
        );
        const rolls =
          effect.chance != null && damageHits > 1 ? damageHits : 1;
        for (const target of enemyTargets) {
          for (let roll = 0; roll < rolls; roll += 1) {
            if (!this.effectLands(unit, target, effect.chance ?? 1)) continue;
            addStatus(target, {
              kind: effect.kind,
              sourceUnitId: unit.id,
              polarity: "debuff",
              turns: effect.turns,
              stacking: "replace",
              dispellable: true,
            });
            break;
          }
        }
      } else if (effect.kind === "atb") {
        const targets = effect.target === "single" || effect.target === "all_enemies"
          ? enemyTargets
          : allyTargets;
        for (const target of targets) {
          target.atb = Math.max(0, Math.min(ATB_THRESHOLD, target.atb + effect.amount));
        }
      } else if (effect.kind === "revive") {
        const target = this.resolveAllyTarget(unit, targetId, true);
        if (target && !target.alive) {
          target.alive = true;
          target.hp = Math.max(1, Math.round(target.stats.hp * effect.hpFraction));
          target.atb = 0;
          target.shieldHp = 0;
          target.statuses = [];
          syncLegacyStatuses(target);
          this.log.push(`${target.name} 부활`);
        }
      } else if (effect.kind === "cooldown") {
        const targets =
          effect.target === "single" || effect.target === "all_enemies"
            ? enemyTargets
            : allyTargets;
        for (const target of targets) {
          if (
            effect.direction === "increase" &&
            !this.effectLands(unit, target, this.effectChance(effect))
          ) {
            continue;
          }
          const cds = ensureSkillCd(target);
          target.skillCd = cds.map((cooldown) =>
            effect.direction === "increase"
              ? cooldown + effect.amount
              : Math.max(0, cooldown - effect.amount),
          );
        }
      } else if (effect.kind === "damage_share") {
        for (const target of allyTargets) {
          const partner =
            target.id === unit.id
              ? aliveSummons(this.units, unit.team)
                  .filter((ally) => ally.id !== target.id)
                  .sort(
                    (a, b) =>
                      b.hp / b.stats.hp - a.hp / a.stats.hp,
                  )[0]
              : unit;
          addStatus(target, {
            kind: "damage_share",
            sourceUnitId: unit.id,
            linkedUnitId: partner?.id === target.id ? undefined : partner?.id,
            polarity: "buff",
            turns: effect.turns,
            stacking: "replace",
            dispellable: true,
            amount: effect.fraction,
          });
        }
      } else if (effect.kind === "reflect") {
        for (const target of allyTargets) {
          addStatus(target, {
            kind: "reflect",
            sourceUnitId: unit.id,
            polarity: "buff",
            turns: effect.turns,
            stacking: "replace",
            dispellable: true,
            amount: effect.fraction,
          });
        }
      } else if (effect.kind === "provoke") {
        for (const target of enemyTargets) {
          if (!this.effectLands(unit, target, effect.chance ?? 1)) continue;
          addStatus(target, {
            kind: "provoke",
            sourceUnitId: unit.id,
            linkedUnitId: unit.id,
            polarity: "debuff",
            turns: effect.turns,
            stacking: "replace",
            dispellable: true,
          });
          this.log.push(`${target.name} 도발 ${effect.turns}턴`);
        }
      } else if (effect.kind === "immunity") {
        for (const target of allyTargets) {
          if (effect.kinds && effect.kinds.length > 0) {
            const blocked = effect.kinds as import("./types.js").StatusKind[];
            target.immuneStatusKinds = [
              ...new Set([...(target.immuneStatusKinds ?? []), ...blocked]),
            ];
          } else {
            addStatus(target, {
              kind: "immunity",
              sourceUnitId: unit.id,
              polarity: "buff",
              turns: effect.turns,
              stacking: "replace",
              dispellable: true,
            });
          }
          this.log.push(`${target.name} 면역 ${effect.turns}턴`);
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

  private effectChance(effect: object): number {
    return "chance" in effect && typeof effect.chance === "number"
      ? effect.chance
      : 1;
  }

  private advanceStatusesAfterTurn(unit: Unit): void {
    const expiredShield = advanceUnitStatuses(
      unit,
      this.turnStatusUnitId === unit.id ? this.turnStatusIds : undefined,
    );
    if (expiredShield > 0) {
      unit.shieldHp = Math.max(0, (unit.shieldHp ?? 0) - expiredShield);
    }
    if (
      unit.statusImmuneIsPassive &&
      (unit.statusImmuneTurns ?? 0) > 0
    ) {
      unit.statusImmuneTurns = Math.max(0, (unit.statusImmuneTurns ?? 0) - 1);
    }
    if (this.turnStatusUnitId === unit.id) {
      this.turnStatusUnitId = null;
      this.turnStatusIds = new Set();
    }
  }

  private beginStatusTurn(unit: Unit): void {
    if (this.turnStatusUnitId === unit.id) return;
    this.turnStatusUnitId = unit.id;
    this.turnStatusIds = new Set(
      ensureStatuses(unit).map((status) => status.id),
    );
  }

  /** SW order: activation roll, immunity, then clamped RES-ACC resistance. */
  private effectLands(
    source: Unit,
    target: Unit,
    activationChance = 1,
  ): boolean {
    const chance = Math.max(0, Math.min(1, activationChance));
    if (chance <= 0 || (chance < 1 && this.rng() >= chance)) {
      this.log.push(`${target.name} 효과 불발`);
      return false;
    }
    if (
      hasStatus(target, "immunity") ||
      ((target.statusImmuneTurns ?? 0) > 0 && !!target.statusImmuneIsPassive)
    ) {
      this.log.push(`${target.name} 상태이상 면역`);
      return false;
    }
    const accuracy =
      (source.stats.accuracy ?? 0) +
      (source.accuracyBuff ?? 0) -
      (source.accuracyDebuff ?? 0);
    const resist = target.stats.resistance ?? 0;
    const resistChance = Math.max(15, Math.min(85, resist - accuracy)) / 100;
    if (this.rng() < resistChance) {
      this.log.push(`${target.name} 저항`);
      return false;
    }
    return true;
  }

  private applyStatBuff(
    unit: Unit,
    axis: string,
    amount: number,
    turns: number,
    sourceUnitId = unit.id,
  ): void {
    const kinds = {
      atk: "atk_up",
      def: "def_up",
      spd: "spd_up",
      critRate: "crit_up",
      critDmg: "crit_dmg_up",
      accuracy: "accuracy_up",
    } as const;
    const kind = kinds[axis as keyof typeof kinds];
    if (kind) {
      addStatus(unit, {
        kind,
        sourceUnitId,
        polarity: "buff",
        turns,
        stacking: "replace",
        dispellable: true,
        amount: axis === "critRate" || axis === "critDmg" || axis === "accuracy"
          ? amount * 100
          : amount,
      });
    }
  }

  private applyStatDebuff(
    unit: Unit,
    axis: string,
    amount: number,
    turns: number,
    sourceUnitId = unit.id,
  ): void {
    const kinds = {
      atk: "atk_down",
      def: "def_down",
      spd: "spd_down",
      critRate: "crit_down",
      critDmg: "crit_dmg_down",
      accuracy: "accuracy_down",
    } as const;
    const kind = kinds[axis as keyof typeof kinds];
    if (kind) {
      addStatus(unit, {
        kind,
        sourceUnitId,
        polarity: "debuff",
        turns,
        stacking: "replace",
        dispellable: true,
        amount:
          axis === "critRate" || axis === "critDmg" || axis === "accuracy"
            ? amount * 100
            : Math.min(0.7, amount),
      });
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
    opts?: {
      fromCounter?: boolean;
      source?: "atk" | "maxHp" | "def" | "spd" | "targetMaxHp";
      sourceFactor?: number;
      ignoreDef?: number;
    },
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

    const boardBuff = this.boardBuffTotals(attacker.team);
    const critBonus = (attacker.critCharm ?? 0) + boardBuff.critRateBonus;
    if (critBonus > 0) attacker.critCharm = 0;
    const critDmgExtra =
      (attacker.critDmgBonus ?? 0) + boardBuff.critDmgBonus;
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
    const rawSourceValue =
      opts?.source === "maxHp"
        ? attacker.stats.hp
        : opts?.source === "def"
          ? attacker.stats.def *
            Math.max(0.3, (1 + (attacker.defBuffPct ?? 0)) * (1 - (attacker.defDebuffPct ?? 0)))
          : opts?.source === "spd"
            ? attacker.stats.spd *
              Math.max(0.3, (1 + (attacker.spdBuffPct ?? 0)) * (1 - (attacker.spdDebuffPct ?? 0)))
            : opts?.source === "targetMaxHp"
              ? target.stats.hp
              : attacker.stats.atk * Math.max(0.3, atkMul);
    const sourceValue = rawSourceValue * Math.max(0, opts?.sourceFactor ?? 1);
    const ignoreDef = Math.max(0, Math.min(1, opts?.ignoreDef ?? 0));
    const { damage, crit } = computeDamage({
      atk: sourceValue,
      skillCoeff: coeff,
      attackerElement: attacker.element,
      defenderElement: target.element,
      defenderDef:
        target.stats.def * Math.max(0.3, defMul) * (1 - ignoreDef),
      amplify: this.currentAmplify(),
      critRate:
        attacker.stats.critRate +
        critBonus +
        (attacker.critRateBuff ?? 0) -
        (attacker.critRateDebuff ?? 0),
      critDmg:
        attacker.stats.critDmg +
        critDmgExtra +
        (attacker.critDmgBuff ?? 0) -
        (attacker.critDmgDebuff ?? 0),
      rng: this.rng,
    });

    const captureMul = 1 + boardBuff.damageBonus;

    let remaining = Math.round(damage * incomingMul * captureMul);
    const isDungeonBoss =
      !!this.dungeonBoss && target.id === this.dungeonBoss.unitId;
    if (
      isDungeonBoss &&
      this.dungeonBoss?.kind === "necro" &&
      this.necroBarrierHits > 0
    ) {
      this.necroBarrierHits -= 1;
      remaining = 0;
      this.log.push(`영혼 방벽 (${this.necroBarrierHits})`);
    }
    for (const buff of this.boardTeamBuffs[target.team]) {
      const shield = buff.shieldByUnit?.[target.id] ?? 0;
      if (shield <= 0 || remaining <= 0 || !buff.shieldByUnit) continue;
      const absorbed = Math.min(shield, remaining);
      buff.shieldByUnit[target.id] = shield - absorbed;
      remaining -= absorbed;
    }
    if (target.shieldHp && target.shieldHp > 0) {
      const absorbed = Math.min(target.shieldHp, remaining);
      target.shieldHp -= absorbed;
      remaining -= absorbed;
      if (target.shieldHp <= 0) target.shieldHp = 0;
    }

    const share = statusesOf(target, "buff").find(
      (status) =>
        status.kind === "damage_share" &&
        status.linkedUnitId &&
        status.linkedUnitId !== target.id,
    );
    if (share && remaining > 0) {
      const partner = this.getUnit(share.linkedUnitId!);
      if (partner?.alive && partner.team === target.team) {
        const shared = Math.min(
          remaining,
          Math.round(remaining * Math.max(0, Math.min(0.9, share.amount ?? 0))),
        );
        remaining -= shared;
        this.dealDirectDamage(partner, shared);
        this.log.push(`${partner.name} 피해 분담 ${shared}`);
      }
    }

    const applied = this.dealDirectDamage(target, remaining);
    if (attacker.team === "ally" && target.team === "enemy" && applied > 0) {
      this.allyDamageDealt += applied;
    }

    const reflect = statusesOf(target, "buff").find(
      (status) => status.kind === "reflect",
    );
    if (
      applied > 0 &&
      reflect &&
      attacker.alive &&
      attacker.team !== target.team
    ) {
      const reflected = Math.round(applied * Math.max(0, reflect.amount ?? 0));
      if (reflected > 0) {
        this.dealDirectDamage(attacker, reflected);
        this.log.push(`${target.name} 반사 ${reflected}`);
      }
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
      if (
        this.effectLands(
          attacker,
          target,
          (attacker.stunOnHitChance ?? 0) / 100,
        )
      ) {
        addStatus(target, {
          kind: "stun",
          sourceUnitId: attacker.id,
          polarity: "debuff",
          turns: 1,
          stacking: "replace",
          dispellable: true,
        });
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

    if (
      isDungeonBoss &&
      this.dungeonBoss?.kind === "giant" &&
      target.alive &&
      attacker.team !== target.team &&
      !opts?.fromCounter
    ) {
      this.giantHitCounter += 1;
      if (this.giantHitCounter >= 7) {
        this.giantHitCounter = 0;
        const victims = this.dungeonBoss?.abyss
          ? this.units.filter(
              (unit) =>
                unit.alive &&
                unit.team === attacker.team &&
                unit.kind === "monster",
            )
          : attacker.alive
            ? [attacker]
            : [];
        this.log.push(`거인의 7타 반격`);
        for (const victim of victims) {
          this.applyHit(target, victim, 0.55 * SKILL_DMG_MUL, false, {
            fromCounter: true,
          });
        }
      }
    }

    return {
      attackerId: attacker.id,
      targetId: target.id,
      damage: Math.round(damage * captureMul),
      crit,
      usedSummonerSkill,
    };
  }

  private dealDirectDamage(target: Unit, amount: number): number {
    const before = target.hp;
    target.hp = Math.max(0, target.hp - Math.max(0, Math.round(amount)));
    const applied = before - target.hp;
    if (applied > 0 && hasStatus(target, "sleep")) {
      removeStatusKind(target, "sleep");
      this.log.push(`${target.name} 수면 해제`);
    }
    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      this.log.push(`${target.name} defeated`);
    }
    return applied;
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
    this.resetDungeonBossState();
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
