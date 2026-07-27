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
  /** Remaining ATB ticks with 행마모래 SPD multiplier. */
  spdBoostTurns?: number;
  /** Stub: ignore next damaging hit (축 연결). */
  cutImmune?: number;
  /** Temporary ATK% from summoner ult leader aura (e.g. 0.05). */
  atkBuffPct?: number;
  /** Remaining ATB-ready ticks for atkBuffPct. */
  atkBuffTicks?: number;
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
  /** 속성의뢰: matching element stone plays consume charges for Amp. */
  elementWardElement?: Element;
  elementWardCharges?: number;
}

export type BattlePhase =
  | "idle"
  | "await_stone"
  | "await_capture_shop"
  | "await_skill"
  | "resolved"
  | "finished";

export type FinishReason = "ally_win" | "enemy_win" | null;
