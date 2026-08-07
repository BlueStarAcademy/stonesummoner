import { getMonster, MONSTERS, type MonsterDef } from "stonesummoner-data";

export interface OwnedMonster {
  uid: string;
  monsterId: string;
  level: number;
  /** Battle EXP toward next level (0 .. MONSTER_EXP_PER_LEVEL-1). */
  exp?: number;
  /** Equipped symbol instance ids by slot index 0..5 (slot 1..6). */
  symbolSlots: (string | null)[];
  /** Evolution stage 0–2 (강화진 진화 스텁). */
  evolve: number;
  /** Awaken stage 0–1 (각성; separate from evolve). */
  awaken?: number;
  /** S1/S2/S3 skill levels (1..MAX_SKILL_LEVEL). */
  skillLevels: [number, number, number];
}

export const MAX_MONSTER_LEVEL = 15;
export const MONSTER_EXP_PER_LEVEL = 100;
export const MAX_EVOLVE = 2;
export const MAX_MONSTER_AWAKEN = 1;
export const MAX_SKILL_LEVEL = 3;
/** ATK/HP multiplier when awaken >= 1. */
export const MONSTER_AWAKEN_STAT_PCT = 0.08;

export function addOwnedMonsterExp(
  owned: OwnedMonster,
  amount: number,
): { monster: OwnedMonster; levelsGained: number } {
  const gain = Math.max(0, Math.floor(amount));
  if (gain <= 0 || owned.level >= MAX_MONSTER_LEVEL) {
    return {
      monster: { ...owned, exp: owned.exp ?? 0 },
      levelsGained: 0,
    };
  }
  let exp = (owned.exp ?? 0) + gain;
  let level = owned.level;
  let levelsGained = 0;
  while (exp >= MONSTER_EXP_PER_LEVEL && level < MAX_MONSTER_LEVEL) {
    exp -= MONSTER_EXP_PER_LEVEL;
    level += 1;
    levelsGained += 1;
  }
  if (level >= MAX_MONSTER_LEVEL) exp = 0;
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
/** Mana to buy one premium summon scroll. */
export const SCROLL_PREMIUM_BUY_MANA_COST = 1500;
/** Crystal to buy one sacred/abyss summon scroll. */
export const SCROLL_MYSTIC_BUY_CRYSTAL_COST = 100;

export type ScrollKind = "normal" | "premium" | "mystic";

export const SCROLL_KINDS: readonly ScrollKind[] = [
  "normal",
  "premium",
  "mystic",
] as const;

export const SCROLL_KIND_LABEL: Record<ScrollKind, string> = {
  normal: "일반 소환서",
  premium: "고급 소환서",
  mystic: "신성/심연 소환서",
};

export const SCROLL_KIND_BLURB: Record<ScrollKind, string> = {
  normal: "불·물·바람 1~3성",
  premium: "불·물·바람 2~4성",
  mystic: "신성·심연 전용",
};

/** Mana to raise level → level+1 */
export function enhanceManaCost(level: number): number {
  return 80 + level * 40;
}

/** Minimum level required to evolve from current stage → stage+1 */
export function evolveMinLevel(evolve: number): number {
  return 10 + evolve * 5; // 10 → 15 → (cap)
}

export function evolveManaCost(evolve: number): number {
  return 400 + evolve * 350;
}

export function evolveCrystalCost(evolve: number): number {
  return evolve === 0 ? 0 : 5 + evolve * 5;
}

/** Minimum level to awaken (0 → 1). */
export function monsterAwakenMinLevel(naturalStars: number): number {
  return 10 + Math.max(1, naturalStars) * 2;
}

export function monsterAwakenManaCost(_awaken = 0): number {
  return 600;
}

export function monsterAwakenCrystalCost(_awaken = 0): number {
  return 5;
}

/** Evolve-material count required by element for awaken. */
export function monsterAwakenMatCost(_awaken = 0): number {
  return 10;
}

export function displayedMonsterStars(
  naturalStars: number,
  awaken = 0,
): number {
  return Math.max(1, naturalStars) + Math.max(0, Math.min(MAX_MONSTER_AWAKEN, awaken));
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
  return 1 + Math.max(0, evolve) * 0.12;
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

/** 일반: 속성(불·물·바람) 1~3성 */
const NORMAL_POOL = MONSTERS.filter(
  (m) =>
    m.naturalStars >= 1 &&
    m.naturalStars <= 3 &&
    ELEMENTAL.has(m.element),
);
/** 고급: 속성 2~3성 */
const PREMIUM_LOW_POOL = MONSTERS.filter(
  (m) =>
    m.naturalStars >= 2 &&
    m.naturalStars <= 3 &&
    ELEMENTAL.has(m.element),
);
/** 고급: 속성 4성 */
const PREMIUM_4_POOL = MONSTERS.filter(
  (m) => m.naturalStars === 4 && ELEMENTAL.has(m.element),
);
/** 신성/심연: 빛·어둠 */
const MYSTIC_POOL = MONSTERS.filter(
  (m) => m.element === "light" || m.element === "dark",
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
  const displayStars = displayedMonsterStars(baseStars, awaken);
  const stars =
    "★".repeat(displayStars) + (evo > 0 ? `+${evo}` : "");
  const slots = m.symbolSlots ?? emptySymbolSlots();
  const eqs = slots.filter(Boolean).length;
  const sk = normalizeSkillLevels(m.skillLevels);
  const skTag = `스킬${sk[0]}/${sk[1]}/${sk[2]}`;
  return `${name} Lv.${m.level} ${stars} ${skTag} 상징${eqs}/6`.trim();
}
