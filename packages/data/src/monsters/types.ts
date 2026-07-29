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

export type MonsterRole =
  | "attacker"
  | "support"
  | "tank"
  | "debuffer"
  | "stonesage"
  | "capturer";

export interface MonsterDef {
  id: string;
  /** Shared display name across all 5 element variants (SW-style). */
  nameKo: string;
  familyId: string;
  artKey: string;
  element: Element;
  naturalStars: number;
  role: string;
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
  role?: string;
  baseStats?: Partial<Stats>;
  stonePassiveId?: StonePassiveId;
};

export type FamilySeed = {
  familyId: string;
  nameKo: string;
  artKey: string;
  naturalStars: number;
  role: MonsterRole;
  baseStats: Stats;
  stonePassiveId: StonePassiveId;
  kits: Record<Element, ElementKit>;
};

export type FamilyRosterEntry = {
  familyId: string;
  nameKo: string;
  naturalStars: number;
  role: MonsterRole;
  stonePassiveId: StonePassiveId;
};

export { basicStrike, dmg };
