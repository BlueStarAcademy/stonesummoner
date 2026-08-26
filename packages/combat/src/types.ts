import type { SkillDef, StonePassiveId } from "stonesummoner-data";

export type Element = "fire" | "water" | "wind" | "light" | "dark";
export type TeamId = "ally" | "enemy";
export type UnitKind = "summoner" | "monster";

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
  /** Next skill: flat critRate bonus (consumed on hit). */
  critCharm?: number;
  /** Next skill: flat critDmg bonus (consumed on hit). */
  critDmgBonus?: number;
  /** Absorb incoming damage before HP. */
  shieldHp?: number;
  /** Remaining turns before set-shield expires (보강). */
  shieldTurns?: number;
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
  /** DoT: fraction of source ATK dealt each ATB-ready tick. */
  dotAtkCoeff?: number;
  dotTicks?: number;
  dotSourceAtk?: number;
  /** Provoke: must target this unit id when set. */
  provokeTargetId?: string;
  provokeTicks?: number;
  /** Damage taken multiplier (e.g. 0.92 = -8%). */
  damageTakenMul?: number;
  /** 보강: fraction of max HP contributed to ally shield pool at battle start. */
  startShieldPct?: number;
  /** 환격: % chance to counter after taking a hit. */
  counterChance?: number;
  /** 쌍립: remaining turns of status immunity. */
  statusImmuneTurns?: number;
  /** 타개: % of damage dealt healed. */
  lifestealPct?: number;
  /** 묘수(Despair): % chance to stun on hit. */
  stunOnHitChance?: number;
  /** Remaining turns skipped (기절). */
  stunnedTurns?: number;
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
