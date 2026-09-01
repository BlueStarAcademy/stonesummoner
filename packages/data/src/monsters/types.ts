import { basicStrike, dmg, type SkillDef } from "../skills.js";
import type { StonePassiveId } from "../stonePassives.js";

export type Element = "fire" | "water" | "wind" | "light" | "dark";

export const ELEMENTS: readonly Element[] = [
  "fire",
  "water",
  "wind",
  "light",
  "dark",
] as const;

/** Player-facing role. Keep this list in sync with role filters in clients. */
export type MonsterRole = "attacker" | "hp" | "defense" | "speed" | "support";

/** Internal legacy archetype used only to preserve established stat/skill budgets. */
export type BalanceArchetype =
  | "attacker"
  | "support"
  | "tank"
  | "debuffer"
  | "stonesage"
  | "capturer";

export type FamilyIdentity = BalanceArchetype;
export type CombatTag =
  | FamilyIdentity
  | "damage"
  | "healer"
  | "control"
  | "protector"
  | "turn_cycle";

export interface MonsterDef {
  id: string;
  /** Shared display name across all 5 element variants (SW-style). */
  nameKo: string;
  familyId: string;
  artKey: string;
  element: Element;
  naturalStars: number;
  role: MonsterRole;
  /** Stat-curve identity retained across display-role reclassification. */
  balanceArchetype: BalanceArchetype;
  /** Legacy fantasy/mechanical identity, independent from display role. */
  familyIdentity: FamilyIdentity;
  combatTags: readonly CombatTag[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    critRate: number;
    critDmg: number;
    accuracy: number;
    resistance: number;
  };
  /** @deprecated Prefer skills[0]; kept for fallback. */
  skillCoeff: number;
  skills: [SkillDef, SkillDef, SkillDef];
  stonePassiveId: StonePassiveId;
  stonePassive: string;
}

export type Stats = MonsterDef["baseStats"];

export type ElementKit = {
  skillCoeff: number;
  skills: [SkillDef, SkillDef, SkillDef];
  role?: MonsterRole;
  baseStats?: Partial<Stats>;
  stonePassiveId?: StonePassiveId;
};

export type FamilySeed = {
  familyId: string;
  nameKo: string;
  artKey: string;
  naturalStars: number;
  role: MonsterRole;
  balanceArchetype: BalanceArchetype;
  familyIdentity: FamilyIdentity;
  combatTags: readonly CombatTag[];
  baseStats: Stats;
  stonePassiveId: StonePassiveId;
  kits: Record<Element, ElementKit>;
};

export type FamilyRosterEntry = {
  familyId: string;
  nameKo: string;
  naturalStars: number;
  role: MonsterRole;
  balanceArchetype: BalanceArchetype;
  familyIdentity: FamilyIdentity;
  combatTags: readonly CombatTag[];
  stonePassiveId: StonePassiveId;
};

export { basicStrike, dmg };
