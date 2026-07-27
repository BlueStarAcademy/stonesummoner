/** Spokland / SW rune main & substat tables. Source: docs/symbols.md */

export type SymbolStatId =
  | "ATK+"
  | "HP+"
  | "DEF+"
  | "SPD+"
  | "ATK%"
  | "HP%"
  | "DEF%"
  | "CRI Rate%"
  | "CRI Dmg%"
  | "ACC%"
  | "RES%";

export type SymbolStars = 1 | 2 | 3 | 4 | 5 | 6;

export type SymbolQuality = "normal" | "advanced" | "rare" | "epic" | "legend";

/** Innate substat count by quality. */
export const QUALITY_SUBSTAT_COUNT: Record<SymbolQuality, number> = {
  normal: 0,
  advanced: 1,
  rare: 2,
  epic: 3,
  legend: 4,
};

export interface StatGrowth {
  base: number;
  perLevel: number;
  max: number;
}

type StarTable = Record<SymbolStars, StatGrowth>;

const HP_FLAT: StarTable = {
  1: { base: 40, perLevel: 45, max: 804 },
  2: { base: 70, perLevel: 60, max: 1092 },
  3: { base: 100, perLevel: 75, max: 1380 },
  4: { base: 160, perLevel: 90, max: 1704 },
  5: { base: 270, perLevel: 105, max: 2088 },
  6: { base: 360, perLevel: 120, max: 2448 },
};

const ATK_DEF_FLAT: StarTable = {
  1: { base: 3, perLevel: 3, max: 54 },
  2: { base: 5, perLevel: 4, max: 74 },
  3: { base: 7, perLevel: 5, max: 93 },
  4: { base: 10, perLevel: 6, max: 112 },
  5: { base: 15, perLevel: 7, max: 135 },
  6: { base: 22, perLevel: 8, max: 160 },
};

const PCT_STAT: StarTable = {
  1: { base: 1, perLevel: 1, max: 18 },
  2: { base: 2, perLevel: 1, max: 20 },
  3: { base: 4, perLevel: 2, max: 38 },
  4: { base: 5, perLevel: 2.25, max: 43 },
  5: { base: 8, perLevel: 2.5, max: 51 },
  6: { base: 11, perLevel: 3, max: 63 },
};

const SPD: StarTable = {
  1: { base: 1, perLevel: 1, max: 18 },
  2: { base: 2, perLevel: 1, max: 19 },
  3: { base: 3, perLevel: 1.33, max: 25 },
  4: { base: 4, perLevel: 1.5, max: 30 },
  5: { base: 5, perLevel: 2, max: 39 },
  6: { base: 7, perLevel: 2, max: 42 },
};

const CRI_RATE: StarTable = {
  1: { base: 1, perLevel: 1, max: 18 },
  2: { base: 2, perLevel: 1, max: 20 },
  3: { base: 3, perLevel: 2, max: 37 },
  4: { base: 4, perLevel: 2.25, max: 41 },
  5: { base: 5, perLevel: 2.5, max: 47 },
  6: { base: 7, perLevel: 3, max: 58 },
};

const CRI_DMG: StarTable = {
  1: { base: 2, perLevel: 1, max: 20 },
  2: { base: 3, perLevel: 2, max: 37 },
  3: { base: 4, perLevel: 2.25, max: 43 },
  4: { base: 6, perLevel: 3, max: 58 },
  5: { base: 8, perLevel: 3.33, max: 65 },
  6: { base: 11, perLevel: 4, max: 80 },
};

const ACC_RES: StarTable = {
  1: { base: 1, perLevel: 1, max: 18 },
  2: { base: 2, perLevel: 1, max: 20 },
  3: { base: 4, perLevel: 2, max: 38 },
  4: { base: 6, perLevel: 2.25, max: 44 },
  5: { base: 9, perLevel: 2.5, max: 51 },
  6: { base: 12, perLevel: 3, max: 64 },
};

export const MAIN_STAT_TABLE: Record<SymbolStatId, StarTable> = {
  "HP+": HP_FLAT,
  "ATK+": ATK_DEF_FLAT,
  "DEF+": ATK_DEF_FLAT,
  "HP%": PCT_STAT,
  "ATK%": PCT_STAT,
  "DEF%": PCT_STAT,
  "SPD+": SPD,
  "CRI Rate%": CRI_RATE,
  "CRI Dmg%": CRI_DMG,
  "ACC%": ACC_RES,
  "RES%": ACC_RES,
};

/** Slot main-option pools (SW). */
export const SLOT_MAIN_POOL: Record<1 | 2 | 3 | 4 | 5 | 6, SymbolStatId[]> = {
  1: ["ATK+"],
  2: ["ATK+", "ATK%", "DEF+", "DEF%", "HP+", "HP%", "SPD+"],
  3: ["DEF+"],
  4: ["ATK+", "ATK%", "DEF+", "DEF%", "HP+", "HP%", "CRI Rate%", "CRI Dmg%"],
  5: ["HP+"],
  6: ["ATK+", "ATK%", "DEF+", "DEF%", "HP+", "HP%", "ACC%", "RES%"],
};

/** Substat roll pool (any slot; cannot duplicate main). */
export const SUBSTAT_POOL: SymbolStatId[] = [
  "ATK+",
  "HP+",
  "DEF+",
  "SPD+",
  "ATK%",
  "HP%",
  "DEF%",
  "CRI Rate%",
  "CRI Dmg%",
  "ACC%",
  "RES%",
];

/** Approximate innate substat roll ranges by stars (SW-ish mid values). */
const SUB_ROLL: Record<SymbolStars, Partial<Record<SymbolStatId, [number, number]>>> = {
  1: {
    "ATK+": [1, 4],
    "HP+": [15, 60],
    "DEF+": [1, 4],
    "SPD+": [1, 2],
    "ATK%": [1, 2],
    "HP%": [1, 2],
    "DEF%": [1, 2],
    "CRI Rate%": [1, 2],
    "CRI Dmg%": [1, 2],
    "ACC%": [1, 2],
    "RES%": [1, 2],
  },
  2: {
    "ATK+": [2, 5],
    "HP+": [30, 80],
    "DEF+": [2, 5],
    "SPD+": [1, 2],
    "ATK%": [1, 3],
    "HP%": [1, 3],
    "DEF%": [1, 3],
    "CRI Rate%": [1, 3],
    "CRI Dmg%": [1, 3],
    "ACC%": [1, 3],
    "RES%": [1, 3],
  },
  3: {
    "ATK+": [3, 7],
    "HP+": [40, 100],
    "DEF+": [3, 7],
    "SPD+": [1, 3],
    "ATK%": [2, 4],
    "HP%": [2, 4],
    "DEF%": [2, 4],
    "CRI Rate%": [2, 4],
    "CRI Dmg%": [2, 4],
    "ACC%": [2, 4],
    "RES%": [2, 4],
  },
  4: {
    "ATK+": [4, 10],
    "HP+": [50, 135],
    "DEF+": [4, 10],
    "SPD+": [1, 4],
    "ATK%": [2, 5],
    "HP%": [2, 5],
    "DEF%": [2, 5],
    "CRI Rate%": [2, 5],
    "CRI Dmg%": [2, 5],
    "ACC%": [2, 5],
    "RES%": [2, 5],
  },
  5: {
    "ATK+": [5, 12],
    "HP+": [75, 175],
    "DEF+": [5, 12],
    "SPD+": [2, 4],
    "ATK%": [3, 6],
    "HP%": [3, 6],
    "DEF%": [3, 6],
    "CRI Rate%": [3, 6],
    "CRI Dmg%": [3, 6],
    "ACC%": [3, 6],
    "RES%": [3, 6],
  },
  6: {
    "ATK+": [7, 15],
    "HP+": [100, 220],
    "DEF+": [7, 15],
    "SPD+": [2, 5],
    "ATK%": [4, 7],
    "HP%": [4, 7],
    "DEF%": [4, 7],
    "CRI Rate%": [4, 7],
    "CRI Dmg%": [4, 7],
    "ACC%": [4, 7],
    "RES%": [4, 7],
  },
};

export function mainStatAtEnhance(
  stat: SymbolStatId,
  stars: SymbolStars,
  enhance: number,
): number {
  const g = MAIN_STAT_TABLE[stat][stars];
  const raw = g.base + enhance * g.perLevel;
  const capped = Math.min(raw, g.max);
  return Number.isInteger(g.perLevel) ? Math.round(capped) : Math.round(capped * 100) / 100;
}

export function pickSlotMainStat(
  slot: 1 | 2 | 3 | 4 | 5 | 6,
  rng: () => number,
): SymbolStatId {
  const pool = SLOT_MAIN_POOL[slot];
  return pool[Math.floor(rng() * pool.length) % pool.length]!;
}

export function rollSubstatValue(
  stat: SymbolStatId,
  stars: SymbolStars,
  rng: () => number,
): number {
  const range = SUB_ROLL[stars][stat] ?? [1, 3];
  const [lo, hi] = range;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function pickWeighted<T>(
  weights: { value: T; w: number }[],
  rng: () => number,
): T {
  const total = weights.reduce((s, x) => s + x.w, 0);
  let r = rng() * total;
  for (const item of weights) {
    r -= item.w;
    if (r <= 0) return item.value;
  }
  return weights[weights.length - 1]!.value;
}

/** UI plate id from quality (plate asset filenames). */
export function qualityToPlateId(q: SymbolQuality): string {
  switch (q) {
    case "normal":
      return "normal";
    case "advanced":
      return "magic";
    case "rare":
      return "rare";
    case "epic":
      return "epic";
    case "legend":
      return "legendary";
  }
}

/** Normalize legacy quality ids (magic→advanced, hero→epic). */
export function normalizeSymbolQuality(raw: string | undefined | null): SymbolQuality {
  switch (raw) {
    case "normal":
    case "advanced":
    case "rare":
    case "epic":
    case "legend":
      return raw;
    case "magic":
      return "advanced";
    case "hero":
      return "epic";
    default:
      return "legend";
  }
}
