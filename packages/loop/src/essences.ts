import {
  ESSENCE_GRADES,
  type Element,
  type ElementEssenceInventory,
  type EssenceAmounts,
  type EssenceGrade,
} from "stonesummoner-data";

export type EssenceConversionKind =
  | "low_to_mid"
  | "mid_to_high"
  | "high_to_mid"
  | "mid_to_low";

export interface EssenceConversionDef {
  from: EssenceGrade;
  fromAmount: number;
  to: EssenceGrade;
  toAmount: number;
  manaCost: number;
}

export const ESSENCE_CONVERSIONS: Record<
  EssenceConversionKind,
  EssenceConversionDef
> = {
  low_to_mid: {
    from: "low",
    fromAmount: 10,
    to: "mid",
    toAmount: 1,
    manaCost: 1_000,
  },
  mid_to_high: {
    from: "mid",
    fromAmount: 10,
    to: "high",
    toAmount: 1,
    manaCost: 5_000,
  },
  high_to_mid: {
    from: "high",
    fromAmount: 1,
    to: "mid",
    toAmount: 8,
    manaCost: 0,
  },
  mid_to_low: {
    from: "mid",
    fromAmount: 1,
    to: "low",
    toAmount: 8,
    manaCost: 0,
  },
};

export function emptyEssenceAmounts(): EssenceAmounts {
  return { low: 0, mid: 0, high: 0 };
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

export function normalizeAwakenMats(value: unknown): ElementEssenceInventory {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const out: ElementEssenceInventory = {};
  for (const element of ["fire", "water", "wind", "light", "dark"] as const) {
    const raw = source[element];
    if (typeof raw === "number") {
      out[element] = { low: safeCount(raw), mid: 0, high: 0 };
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const grades = raw as Record<string, unknown>;
    out[element] = {
      low: safeCount(grades.low),
      mid: safeCount(grades.mid),
      high: safeCount(grades.high),
    };
  }
  return out;
}

export function essenceAmountsFor(
  inventory: ElementEssenceInventory | undefined,
  element: Element,
): EssenceAmounts {
  const raw = inventory?.[element];
  return {
    low: safeCount(raw?.low),
    mid: safeCount(raw?.mid),
    high: safeCount(raw?.high),
  };
}

export function totalEssences(
  inventory: ElementEssenceInventory | undefined,
): number {
  return (["fire", "water", "wind", "light", "dark"] as const).reduce(
    (total, element) => {
      const amounts = essenceAmountsFor(inventory, element);
      return (
        total +
        ESSENCE_GRADES.reduce((sum, grade) => sum + amounts[grade], 0)
      );
    },
    0,
  );
}

export function canPayEssenceCost(
  have: EssenceAmounts,
  cost: EssenceAmounts,
): boolean {
  return ESSENCE_GRADES.every((grade) => have[grade] >= cost[grade]);
}

export function monsterAwakenEssenceCost(
  naturalStars: number,
): EssenceAmounts {
  if (naturalStars <= 2) return { low: 20, mid: 5, high: 0 };
  if (naturalStars === 3) return { low: 30, mid: 10, high: 1 };
  if (naturalStars === 4) return { low: 40, mid: 15, high: 3 };
  return { low: 50, mid: 20, high: 5 };
}

export function summonerAwakenEssenceCost(awaken: number): EssenceAmounts {
  const step = Math.max(0, Math.min(4, Math.floor(awaken)));
  return [
    { low: 8, mid: 0, high: 0 },
    { low: 12, mid: 2, high: 0 },
    { low: 16, mid: 5, high: 0 },
    { low: 20, mid: 8, high: 1 },
    { low: 24, mid: 12, high: 2 },
  ][step]!;
}

