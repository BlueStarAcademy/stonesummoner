import type { Element } from "./monsters/types.js";

export const ESSENCE_GRADES = ["low", "mid", "high"] as const;
export type EssenceGrade = (typeof ESSENCE_GRADES)[number];

export type EssenceAmounts = Record<EssenceGrade, number>;
export type ElementEssenceInventory = Partial<Record<Element, EssenceAmounts>>;

export interface EssenceDropEntry {
  grade: EssenceGrade;
  min: number;
  max: number;
  chance: number;
}

const AWAKEN_ESSENCE_DROPS: readonly (readonly EssenceDropEntry[])[] = [
  [{ grade: "low", min: 2, max: 3, chance: 1 }],
  [{ grade: "low", min: 3, max: 4, chance: 1 }],
  [
    { grade: "low", min: 4, max: 5, chance: 1 },
    { grade: "mid", min: 1, max: 1, chance: 0.1 },
  ],
  [
    { grade: "low", min: 4, max: 6, chance: 1 },
    { grade: "mid", min: 1, max: 1, chance: 0.3 },
  ],
  [
    { grade: "low", min: 5, max: 7, chance: 1 },
    { grade: "mid", min: 1, max: 2, chance: 0.45 },
  ],
  [
    { grade: "low", min: 5, max: 7, chance: 1 },
    { grade: "mid", min: 1, max: 2, chance: 0.7 },
  ],
  [
    { grade: "low", min: 4, max: 6, chance: 1 },
    { grade: "mid", min: 2, max: 3, chance: 1 },
    { grade: "high", min: 1, max: 1, chance: 0.06 },
  ],
  [
    { grade: "low", min: 3, max: 5, chance: 1 },
    { grade: "mid", min: 2, max: 4, chance: 1 },
    { grade: "high", min: 1, max: 1, chance: 0.12 },
  ],
  [
    { grade: "mid", min: 3, max: 4, chance: 1 },
    { grade: "high", min: 1, max: 1, chance: 0.22 },
  ],
  [
    { grade: "mid", min: 4, max: 5, chance: 1 },
    { grade: "high", min: 1, max: 2, chance: 0.35 },
  ],
];

export function awakenEssenceDropsForFloor(
  floor: number,
): readonly EssenceDropEntry[] {
  const index = Math.max(1, Math.min(10, Math.floor(floor))) - 1;
  return AWAKEN_ESSENCE_DROPS[index]!;
}

export function awakenExpForFloor(floor: number): number {
  const clamped = Math.max(1, Math.min(10, Math.floor(floor)));
  return Math.round(10 + ((clamped - 1) * 25) / 9);
}

