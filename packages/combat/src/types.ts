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
  element: Element;
  stats: UnitStats;
  hp: number;
  atb: number;
  /** Skill coefficient for basic attack. */
  skillCoeff: number;
  alive: boolean;
  /** Next skill: flat critRate bonus (consumed on hit). */
  critCharm?: number;
  /** Absorb incoming damage before HP. */
  shieldHp?: number;
}

export interface SummonerState {
  unitId: string;
  mana: number;
  manaMax: number;
  manaRegenPerTick: number;
  boardSense: number;
}

export type BattlePhase =
  | "idle"
  | "await_stone"
  | "await_skill"
  | "resolved"
  | "finished";

export type FinishReason = "ally_win" | "enemy_win" | null;
