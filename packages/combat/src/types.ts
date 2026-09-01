import type { SkillDef, StonePassiveId } from "stonesummoner-data";

export type Element = "fire" | "water" | "wind" | "light" | "dark";
export type TeamId = "ally" | "enemy";
export type UnitKind = "summoner" | "monster";

export type BoardTeamBuffSource = "capture" | "item";

/** Team-scoped effects created by captures and board items. */
export interface BoardTeamBuff {
  id: string;
  source: BoardTeamBuffSource;
  damageBonus?: number;
  critRateBonus?: number;
  critDmgBonus?: number;
  spdPct?: number;
  /** Separate from unit shields so it can expire with the board buff. */
  shieldByUnit?: Record<string, number>;
}

export interface UnitStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number;
  critDmg: number;
  /** Effect accuracy % (집중 등). */
  accuracy?: number;
  /** Effect resistance % (연결 등). */
  resistance?: number;
}

export type StatusPolarity = "buff" | "debuff";
export type StatusStacking = "replace" | "extend" | "stack";
export type StatusKind =
  | "atk_up"
  | "def_up"
  | "spd_up"
  | "crit_up"
  | "crit_dmg_up"
  | "accuracy_up"
  | "immunity"
  | "shield"
  | "hot"
  | "damage_reduction"
  | "damage_share"
  | "reflect"
  | "atk_down"
  | "def_down"
  | "spd_down"
  | "crit_down"
  | "crit_dmg_down"
  | "accuracy_down"
  | "dot"
  | "provoke"
  | "stun"
  | "freeze"
  | "sleep"
  | "heal_block"
  | "silence";

/** Turn-based, unit-scoped combat state. Board and equipment passives stay separate. */
export interface StatusInstance {
  /** Stable per-application identity; stacked DoTs have distinct ids. */
  id: string;
  kind: StatusKind;
  sourceUnitId: string;
  polarity: StatusPolarity;
  turns: number;
  stacking: StatusStacking;
  dispellable: boolean;
  stacks: number;
  amount?: number;
  /** Snapshot used by DoT/HoT and other source-scaled effects. */
  value?: number;
  /** Provoke or damage-share partner. */
  linkedUnitId?: string;
  /** Permanent equipment-derived effects never enter this collection. */
  hidden?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  team: TeamId;
  kind: UnitKind;
  /** Catalog id for monster portraits (monsters only). */
  monsterId?: string;
  element: Element;
  stats: UnitStats;
  hp: number;
  atb: number;
  /** Fallback coeff when skills missing. */
  skillCoeff: number;
  /** S1 / S2 / S3 definitions (monsters). Summoners may omit. */
  skills?: SkillDef[];
  /** Remaining cooldown per skill index. */
  skillCd?: number[];
  stonePassive?: StonePassiveId;
  alive: boolean;
  /** Authoritative runtime statuses. Legacy fields below are mirrored during migration. */
  statuses?: StatusInstance[];
  /** Next skill: flat critRate bonus (consumed on hit). */
  critCharm?: number;
  /** Next skill: flat critDmg bonus (consumed on hit). */
  critDmgBonus?: number;
  /** Absorb incoming damage before HP. */
  shieldHp?: number;
  /** Remaining turns before set-shield expires (보강). */
  shieldTurns?: number;
  /** False while shieldHp comes only from an equipment passive. */
  shieldStatusVisible?: boolean;
  /** Remaining ATB ticks with 행마모래 SPD multiplier. */
  spdBoostTurns?: number;
  /** Stub: ignore next damaging hit (축 연결). */
  cutImmune?: number;
  /** Temporary ATK% from summoner ult leader aura (e.g. 0.05). */
  atkBuffPct?: number;
  /** Remaining ATB-ready ticks for atkBuffPct. */
  atkBuffTicks?: number;
  /** Temporary DEF% buff. */
  defBuffPct?: number;
  defBuffTicks?: number;
  /** Temporary SPD% buff (applied on ATB). */
  spdBuffPct?: number;
  spdBuffTicks?: number;
  /** Temporary critRate flat bonus. */
  critRateBuff?: number;
  critRateBuffTicks?: number;
  /** Temporary critDmg flat bonus. */
  critDmgBuff?: number;
  critDmgBuffTicks?: number;
  /** Temporary accuracy flat bonus. */
  accuracyBuff?: number;
  accuracyBuffTicks?: number;
  /** Incoming ATK% reduction from debuffs. */
  atkDebuffPct?: number;
  atkDebuffTicks?: number;
  defDebuffPct?: number;
  defDebuffTicks?: number;
  spdDebuffPct?: number;
  spdDebuffTicks?: number;
  critRateDebuff?: number;
  critRateDebuffTicks?: number;
  critDmgDebuff?: number;
  critDmgDebuffTicks?: number;
  accuracyDebuff?: number;
  accuracyDebuffTicks?: number;
  /** DoT: fraction of source ATK dealt each ATB-ready tick. */
  dotAtkCoeff?: number;
  dotTicks?: number;
  dotSourceAtk?: number;
  /** Provoke: must target this unit id when set. */
  provokeTargetId?: string;
  provokeTicks?: number;
  /** Damage taken multiplier (e.g. 0.92 = -8%). */
  damageTakenMul?: number;
  /** 보강: fraction of this wearer's max HP granted as a start shield. */
  startShieldPct?: number;
  /** 환격: % chance to counter after taking a hit. */
  counterChance?: number;
  /** 쌍립: remaining turns of status immunity. */
  statusImmuneTurns?: number;
  /** Equipment-provided immunity is not rendered as a unit status icon. */
  statusImmuneIsPassive?: boolean;
  /** 타개: % of damage dealt healed. */
  lifestealPct?: number;
  /** 묘수(Despair): % chance to stun on hit. */
  stunOnHitChance?: number;
  /** Remaining turns skipped (기절). */
  stunnedTurns?: number;
  /** Distinct control states; stunnedTurns remains the aggregate compatibility view. */
  frozenTurns?: number;
  sleepingTurns?: number;
  healBlockTurns?: number;
  silenceTurns?: number;
  hotTurns?: number;
  hotAmount?: number;
  damageReductionTurns?: number;
  damageShareTurns?: number;
  damageSharePct?: number;
  damageShareTargetId?: string;
  reflectTurns?: number;
  reflectPct?: number;
  /** 격노(Violent): % chance for extra turn after skill. */
  violentChance?: number;
  /** 응징(Nemesis): ATB % per 7% HP lost when hit. */
  nemesisAtbPer7?: number;
  /** 파멸(Destroy): completed set count. */
  destroySets?: number;
  /** Cumulative destroy max-HP reduction (fraction of original). */
  destroyTakenFrac?: number;
  /** Original max HP for destroy calc. */
  originalMaxHp?: number;
}

export interface SummonerState {
  unitId: string;
  mana: number;
  manaMax: number;
  manaRegenPerTick: number;
  boardSense: number;
  /** Multiplies 진문개방 / composed ult skill coeff (from weapon + tree). */
  skillPowerBonus?: number;
  /** Mana cost multipliers for summoner skills (default 1). */
  declareCostMul?: number;
  dualCostMul?: number;
  cleanCostMul?: number;
  /** Extra Amplify on 증폭선언. */
  declarePowerBonus?: number;
  /** Extra Amplify per stone on 진문청소. */
  cleanAmpBonus?: number;
  /** Unlocked skill-tree node ids — shapes the full-mana signature ult. */
  skillTreeUnlocked?: string[];
  /** Phase 2 magic skills available this battle. */
  magicSkills?: Array<{
    id: string;
    nameKo: string;
    manaCostFrac: number;
    kind: string;
    power: number;
    turns?: number;
    descKo?: string;
    vfxId?: string;
    vfxFamily?: "melee" | "bolt" | "nova" | "support";
    orbBolt?: boolean;
  }>;
  /** Active summoner element for leader / kit. */
  summonerElement?: Element;
  /** 속성의뢰: matching element stone plays consume charges for Amp. */
  elementWardElement?: Element;
  elementWardCharges?: number;
}

export type BattlePhase =
  | "idle"
  | "await_stone"
  | "await_capture_shop"
  | "await_skill"
  | "await_wave"
  | "resolved"
  | "finished";

export type FinishReason = "ally_win" | "enemy_win" | null;
