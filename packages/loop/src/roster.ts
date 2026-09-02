import {
  getMonster,
  isFusionOnlyFamily,
  MONSTERS,
  type MonsterDef,
} from "stonesummoner-data";

export interface OwnedMonster {
  uid: string;
  monsterId: string;
  level: number;
  /** Battle EXP toward the next level (uses grade table). */
  exp?: number;
  /** Equipped symbol instance ids by slot index 0..5 (slot 1..6). */
  symbolSlots: (string | null)[];
  /** Evolution stage added to natural stars (display grade up to 6★). */
  evolve: number;
  /** Awaken stage 0–1 (6★ only; changes appearance). */
  awaken?: number;
  /** Awaken dungeon XP banked toward awakening (6★ only). */
  awakenExp?: number;
  /** S1/S2/S3 skill levels (1..MAX_SKILL_LEVEL). */
  skillLevels: [number, number, number];
}

/** Highest monster level supported by the Summoners War grade table. */
export const MAX_MONSTER_LEVEL = 40;
/** @deprecated Use monsterExpToNext; monster EXP depends on grade and level. */
export const MONSTER_EXP_PER_LEVEL = 460;
export const MAX_EVOLVE = 5;
export const MAX_MONSTER_AWAKEN = 1;
export const MAX_SKILL_LEVEL = 3;
export const MONSTER_AWAKEN_EXP_GOAL = 100;
export const WEEKDAY_AWAKEN_EXP_DROP = 25;
/** ATK/HP multiplier when awaken >= 1 — closer to Summoners War awaken bumps. */
export const MONSTER_AWAKEN_STAT_PCT = 0.15;

/** Per-evolve step HP/ATK/DEF — kept modest so nat-star gaps survive to 6★. */
export const EVOLVE_STAT_PCT = 0.06;

/**
 * Per skill-level damage/heal/shield growth (SW skill-ups are typically +5%).
 * With MAX_SKILL_LEVEL=3 this is +5% / +10% from base at Lv2 / Lv3.
 */
export const SKILL_LEVEL_POWER_PCT = 0.05;

const MONSTER_EXP_TABLE: readonly (readonly number[])[] = [
  [460, 516, 579, 650, 728, 818, 918, 1029, 1155, 1296, 1455, 1631, 1831, 2054],
  [552, 619, 695, 779, 875, 981, 1102, 1235, 1386, 1555, 1745, 1958, 2197, 2465, 2765, 3103, 3481, 3906, 4423],
  [662, 743, 834, 936, 1049, 1178, 1321, 1483, 1663, 1866, 2094, 2350, 2636, 2957, 3319, 3723, 4178, 4687, 5307, 6009, 6802, 7703, 8720, 9962],
  [796, 892, 1002, 1124, 1261, 1415, 1587, 1781, 1998, 2243, 2515, 2823, 3167, 3553, 3987, 4473, 5019, 5631, 6376, 7219, 8172, 9254, 10476, 11969, 13673, 15619, 17844, 20386, 23495],
  [952, 1068, 1199, 1344, 1509, 1693, 1899, 2131, 2392, 2682, 3010, 3378, 3789, 4252, 4770, 5352, 6006, 6738, 7628, 8638, 9779, 11072, 12535, 14321, 16360, 18690, 21350, 24392, 28113, 32404, 37348, 43048, 49617, 57188],
  [1150, 1290, 1447, 1624, 1823, 2044, 2294, 2574, 2888, 3240, 3635, 4079, 4576, 5135, 5762, 6464, 7252, 8138, 9214, 10431, 11811, 13371, 15140, 17296, 19758, 22572, 25786, 29458, 33954, 39134, 45107, 51990, 59924, 69068, 76085, 83816, 92332, 101712, 112046],
] as const;

/** Current grade includes the existing evolution stage. */
export function monsterGrade(owned: OwnedMonster): number {
  const naturalStars = getMonster(owned.monsterId)?.naturalStars ?? 1;
  return Math.max(1, Math.min(6, naturalStars + (owned.evolve ?? 0)));
}

/** Summoners War grade cap: 1★→15 through 6★→40. */
export function monsterMaxLevel(owned: OwnedMonster): number {
  return 10 + monsterGrade(owned) * 5;
}

/** EXP required to advance this monster from `level` to `level + 1`. */
export function monsterExpToNext(owned: OwnedMonster, level = owned.level): number {
  const current = Math.max(1, Math.floor(level));
  return MONSTER_EXP_TABLE[monsterGrade(owned) - 1]?.[current - 1] ?? 0;
}

/** Summoners War Power-Up Circle fodder XP at Lv1 / grade max (per display ★). */
const FODDER_FEED_EXP_AT_LV1: readonly number[] = [
  800,
  1760,
  3200,
  6724,
  16000,
  44001,
];
const FODDER_FEED_EXP_AT_MAX: readonly number[] = [
  1210,
  3086,
  6204,
  13851,
  43708,
  139356,
];

/**
 * EXP granted when sacrificing a monster as power-up material.
 * Uses display grade (natural + evolve) and level, matching SW feed table.
 */
export function monsterPowerUpExp(fodder: OwnedMonster): number {
  const grade = monsterGrade(fodder);
  const idx = Math.min(FODDER_FEED_EXP_AT_LV1.length - 1, grade - 1);
  const atLv1 = FODDER_FEED_EXP_AT_LV1[idx] ?? 800;
  const atMax = FODDER_FEED_EXP_AT_MAX[idx] ?? atLv1;
  const maxLv = monsterMaxLevel(fodder);
  const level = Math.max(1, Math.min(maxLv, Math.floor(fodder.level)));
  if (level >= maxLv) return atMax;
  if (level <= 1 || maxLv <= 1) return atLv1;
  const t = (level - 1) / (maxLv - 1);
  return Math.floor(atLv1 + (atMax - atLv1) * t);
}

export function addOwnedMonsterExp(
  owned: OwnedMonster,
  amount: number,
): { monster: OwnedMonster; levelsGained: number } {
  const gain = Math.max(0, Math.floor(amount));
  const maxLevel = monsterMaxLevel(owned);
  if (gain <= 0 || owned.level >= maxLevel) {
    return {
      monster: { ...owned, exp: owned.exp ?? 0 },
      levelsGained: 0,
    };
  }
  let exp = (owned.exp ?? 0) + gain;
  let level = owned.level;
  let levelsGained = 0;
  while (level < maxLevel) {
    const required = monsterExpToNext(owned, level);
    if (required <= 0 || exp < required) break;
    exp -= required;
    level += 1;
    levelsGained += 1;
  }
  if (level >= maxLevel) exp = 0;
  return {
    monster: { ...owned, level, exp },
    levelsGained,
  };
}

export const SUMMON_SCROLL_COST = 1;
/** Multi-summon pull count (10연). */
export const SUMMON_MULTI_COUNT = 10;
export const STARTER_SCROLLS = 5;
export const STARTER_SCROLLS_PREMIUM = 1;
export const STARTER_SCROLLS_MYSTIC = 0;
/** Mana to buy one normal summon scroll at the shop stub. */
export const SCROLL_BUY_MANA_COST = 450;
/**
 * Legacy gold price for premium scrolls (catalog now uses crystal).
 * Kept for older saves / docs; do not charge this in `runBuyScroll`.
 */
export const SCROLL_PREMIUM_BUY_MANA_COST = 1500;
/** Crystal to buy one premium summon scroll at the catalog shop. */
export const SCROLL_PREMIUM_BUY_CRYSTAL_COST = 75;
/** Crystal to buy one sacred/abyss summon scroll. */
export const SCROLL_MYSTIC_BUY_CRYSTAL_COST = 100;

export type ScrollKind = "normal" | "premium" | "mystic" | "legend";

export const SCROLL_KINDS: readonly ScrollKind[] = [
  "normal",
  "premium",
  "mystic",
  "legend",
] as const;

export const SCROLL_KIND_LABEL: Record<ScrollKind, string> = {
  normal: "일반 소환서",
  premium: "고급 소환서",
  mystic: "신성/심연 소환서",
  legend: "전설 소환서",
};

export const SCROLL_KIND_BLURB: Record<ScrollKind, string> = {
  normal: "불·물·바람 1~3성",
  premium: "불·물·바람 2~4성",
  mystic: "신성·심연 전용",
  legend: "4~5성",
};

/** Mana to raise level → level+1 */
export function enhanceManaCost(level: number): number {
  return 80 + level * 40;
}

/** Display star grade (natural + evolve), capped at 6. */
export function displayedMonsterStars(
  naturalStars: number,
  evolve = 0,
): number {
  return Math.max(1, Math.min(6, naturalStars + Math.max(0, evolve)));
}

/** Max evolve steps before reaching 6★. */
export function maxEvolveSteps(naturalStars: number): number {
  return Math.max(0, 6 - Math.max(1, naturalStars));
}

/** Same-grade fodder count required for the next evolve step. */
export function evolveFodderCount(currentGrade: number): number {
  return Math.max(1, Math.min(5, currentGrade));
}

/** Gold cost to evolve from `currentGrade` → grade+1. */
export function evolveManaCostForGrade(currentGrade: number): number {
  const g = Math.max(1, Math.min(5, currentGrade));
  return 1500 * g * g;
}

/** @deprecated Use max level gate — kept for legacy callers. */
export function evolveMinLevel(_evolve: number): number {
  return 1;
}

/** @deprecated Use evolveManaCostForGrade. */
export function evolveManaCost(evolve: number): number {
  return evolveManaCostForGrade(1 + evolve);
}

/** @deprecated Crystal no longer used for monster evolve. */
export function evolveCrystalCost(_evolve: number): number {
  return 0;
}

/** Awaken requires max level at 6★. */
export function monsterAwakenMinLevel(_naturalStars: number): number {
  return MAX_MONSTER_LEVEL;
}

export function monsterAwakenManaCost(naturalStars = 1): number {
  return 12000 + Math.max(1, naturalStars) * 3500;
}

export function monsterAwakenCrystalCost(_awaken = 0): number {
  return 15;
}

/** Elemental essence required for awaken. */
export function monsterAwakenMatCost(_awaken = 0): number {
  return 15;
}

export function defaultSkillLevels(): [number, number, number] {
  return [1, 1, 1];
}

export function normalizeSkillLevels(
  levels?: number[] | null,
): [number, number, number] {
  const base = defaultSkillLevels();
  if (!levels?.length) return base;
  return [
    Math.min(MAX_SKILL_LEVEL, Math.max(1, levels[0] ?? 1)),
    Math.min(MAX_SKILL_LEVEL, Math.max(1, levels[1] ?? 1)),
    Math.min(MAX_SKILL_LEVEL, Math.max(1, levels[2] ?? 1)),
  ];
}

/** Indices of skills that can still level up (0..2). */
/** Same monster name/family regardless of element (Summoners War duplicate rules). */
export function ownedMonsterFamilyId(
  owned: OwnedMonster | { monsterId: string },
): string {
  const def = getMonster(owned.monsterId);
  return def?.familyId ?? owned.monsterId;
}

export function ownedMonstersSameFamily(
  a: OwnedMonster | { monsterId: string },
  b: OwnedMonster | { monsterId: string },
): boolean {
  return ownedMonsterFamilyId(a) === ownedMonsterFamilyId(b);
}

export function skillUpgradableIndices(
  levels?: number[] | null,
): number[] {
  const lv = normalizeSkillLevels(levels);
  const out: number[] = [];
  for (let i = 0; i < 3; i++) {
    if ((lv[i] ?? 1) < MAX_SKILL_LEVEL) out.push(i);
  }
  return out;
}

/** Pick a random skill index to level, or null if all maxed. */
export function pickRandomSkillUpIndex(
  levels?: number[] | null,
  rng: () => number = Math.random,
): number | null {
  const pool = skillUpgradableIndices(levels);
  if (!pool.length) return null;
  const roll = Math.floor(rng() * pool.length);
  return pool[Math.min(pool.length - 1, Math.max(0, roll))] ?? null;
}

/** Monster level gate to raise skill from current level → level+1 */
export function skillUpMinMonsterLevel(skillLevel: number): number {
  return 3 + skillLevel * 2; // Lv1→2 needs mon Lv5; Lv2→3 needs Lv7
}

export function skillUpManaCost(skillIndex: number, skillLevel: number): number {
  return 150 + skillLevel * 120 + skillIndex * 40;
}

/** Shared skill-up material cost (weekday dungeon drop). */
export const SKILL_UP_MAT_COST = 3;

export function levelStatMult(level: number): number {
  return 1 + (level - 1) * 0.04;
}

export function evolveStatMult(evolve: number): number {
  return 1 + Math.max(0, evolve) * EVOLVE_STAT_PCT;
}

export function awakenStatMult(awaken: number): number {
  return 1 + (Math.max(0, awaken) > 0 ? MONSTER_AWAKEN_STAT_PCT : 0);
}

export function scaledMonsterStats(
  def: MonsterDef,
  level: number,
  evolve = 0,
  awaken = 0,
): MonsterDef["baseStats"] {
  const m = levelStatMult(level) * evolveStatMult(evolve);
  const a = awakenStatMult(awaken);
  return {
    hp: Math.round(def.baseStats.hp * m * a),
    atk: Math.round(def.baseStats.atk * m * a),
    def: Math.round(def.baseStats.def * m),
    spd: def.baseStats.spd + Math.floor((level - 1) / 5) + evolve,
    critRate: def.baseStats.critRate + evolve * 2,
    critDmg: def.baseStats.critDmg + evolve * 5,
    accuracy: def.baseStats.accuracy,
    resistance: def.baseStats.resistance,
  };
}

const STARTER_IDS = [
  "cinder_imp_fire",
  "dew_slime_water",
  "gale_bat_wind",
  "seal_apprentice_light",
] as const;

const ELEMENTAL = new Set(["fire", "water", "wind"]);

function weightedPick(pool: MonsterDef[], rng: () => number): MonsterDef {
  if (pool.length === 0) return MONSTERS[0]!;
  const weights = pool.map((m) => {
    const s = m.naturalStars;
    if (s <= 1) return 5;
    if (s === 2) return 3;
    if (s === 3) return 2;
    if (s === 4) return 1;
    return 0.4;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function inScrollPool(m: MonsterDef): boolean {
  return !isFusionOnlyFamily(m.familyId);
}

/** 일반: 속성(불·물·바람) 1~3성 */
const NORMAL_POOL = MONSTERS.filter(
  (m) =>
    inScrollPool(m) &&
    m.naturalStars >= 1 &&
    m.naturalStars <= 3 &&
    ELEMENTAL.has(m.element),
);
/** 고급: 속성 2~3성 */
const PREMIUM_LOW_POOL = MONSTERS.filter(
  (m) =>
    inScrollPool(m) &&
    m.naturalStars >= 2 &&
    m.naturalStars <= 3 &&
    ELEMENTAL.has(m.element),
);
/** 고급: 속성 4성 */
const PREMIUM_4_POOL = MONSTERS.filter(
  (m) =>
    inScrollPool(m) && m.naturalStars === 4 && ELEMENTAL.has(m.element),
);
/** 신성/심연: 빛·어둠 */
const MYSTIC_POOL = MONSTERS.filter(
  (m) =>
    inScrollPool(m) && (m.element === "light" || m.element === "dark"),
);
/** 전설: 4~5성 (모든 속성) */
const LEGEND_POOL = MONSTERS.filter(
  (m) => inScrollPool(m) && m.naturalStars >= 4 && m.naturalStars <= 5,
);

let uidSeq = 0;
export function nextUid(prefix = "m"): string {
  uidSeq += 1;
  return `${prefix}_${uidSeq}_${Date.now().toString(36)}`;
}

export function emptySymbolSlots(): (string | null)[] {
  return [null, null, null, null, null, null];
}

export function createStarterRoster(): {
  roster: OwnedMonster[];
  party: string[];
  scrolls: number;
  scrollsPremium: number;
  scrollsMystic: number;
} {
  uidSeq = 0;
  const roster: OwnedMonster[] = STARTER_IDS.map((id, i) => ({
    uid: `starter_${i}`,
    monsterId: id,
    level: 1,
    exp: 0,
    symbolSlots: emptySymbolSlots(),
    evolve: 0,
    awaken: 0,
    awakenExp: 0,
    skillLevels: defaultSkillLevels(),
  }));
  return {
    roster,
    party: roster.map((m) => m.uid),
    scrolls: STARTER_SCROLLS,
    scrollsPremium: STARTER_SCROLLS_PREMIUM,
    scrollsMystic: STARTER_SCROLLS_MYSTIC,
  };
}

function pickFrom(pool: MonsterDef[], rng: () => number): MonsterDef {
  return weightedPick(pool, rng);
}

export function pickSummonMonster(
  rng: () => number = Math.random,
  kind: ScrollKind = "normal",
): MonsterDef {
  if (kind === "mystic") return pickFrom(MYSTIC_POOL, rng);
  if (kind === "legend") return pickFrom(LEGEND_POOL, rng);
  if (kind === "premium") {
    const useFour = rng() < 0.45 && PREMIUM_4_POOL.length > 0;
    return pickFrom(useFour ? PREMIUM_4_POOL : PREMIUM_LOW_POOL, rng);
  }
  return pickFrom(NORMAL_POOL, rng);
}

export function describeOwned(m: OwnedMonster): string {
  const def = getMonster(m.monsterId);
  const name = def?.nameKo ?? m.monsterId;
  const baseStars = def?.naturalStars ?? 0;
  const evo = m.evolve ?? 0;
  const awaken = m.awaken ?? 0;
  const displayStars = displayedMonsterStars(baseStars, m.evolve ?? 0);
  const stars =
    "★".repeat(displayStars) + (evo > 0 ? `+${evo}` : "");
  const slots = m.symbolSlots ?? emptySymbolSlots();
  const eqs = slots.filter(Boolean).length;
  const sk = normalizeSkillLevels(m.skillLevels);
  const skTag = `스킬${sk[0]}/${sk[1]}/${sk[2]}`;
  return `${name} Lv.${m.level} ${stars} ${skTag} 상징${eqs}/6`.trim();
}
