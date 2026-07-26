import { getMonster, MONSTERS, type MonsterDef } from "stonesummoner-data";

export interface OwnedMonster {
  uid: string;
  monsterId: string;
  level: number;
  /** Equipped symbol instance ids by slot index 0..5 (slot 1..6). */
  symbolSlots: (string | null)[];
  /** Evolution stage 0–2 (강화진 진화 스텁). */
  evolve: number;
  /** S1/S2/S3 skill levels (1..MAX_SKILL_LEVEL). */
  skillLevels: [number, number, number];
}

export const MAX_MONSTER_LEVEL = 15;
export const MAX_EVOLVE = 2;
export const MAX_SKILL_LEVEL = 3;
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
  normal: "불·물·바람 3성",
  premium: "불·물·바람 3~4성",
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

/** Monster level gate to raise skill from current level → level+1 */
export function skillUpMinMonsterLevel(skillLevel: number): number {
  return 3 + skillLevel * 2; // Lv1→2 needs mon Lv5; Lv2→3 needs Lv7
}

export function skillUpManaCost(skillIndex: number, skillLevel: number): number {
  return 150 + skillLevel * 120 + skillIndex * 40;
}

export function levelStatMult(level: number): number {
  return 1 + (level - 1) * 0.04;
}

export function evolveStatMult(evolve: number): number {
  return 1 + Math.max(0, evolve) * 0.12;
}

export function scaledMonsterStats(
  def: MonsterDef,
  level: number,
  evolve = 0,
): MonsterDef["baseStats"] {
  const m = levelStatMult(level) * evolveStatMult(evolve);
  return {
    hp: Math.round(def.baseStats.hp * m),
    atk: Math.round(def.baseStats.atk * m),
    def: Math.round(def.baseStats.def * m),
    spd: def.baseStats.spd + Math.floor((level - 1) / 5) + evolve,
    critRate: def.baseStats.critRate + evolve * 2,
    critDmg: def.baseStats.critDmg + evolve * 5,
  };
}

const STARTER_IDS = [
  "fire_fang",
  "dew_healer",
  "gale_scout",
  "seal_scholar",
] as const;

const ELEMENTAL = new Set(["fire", "water", "wind"]);

/** 일반: 속성(불·물·바람) 3성 */
const NORMAL_POOL = MONSTERS.filter(
  (m) => m.naturalStars === 3 && ELEMENTAL.has(m.element),
);
/** 고급: 속성 3성 */
const PREMIUM_3_POOL = NORMAL_POOL;
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
    symbolSlots: emptySymbolSlots(),
    evolve: 0,
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
  if (pool.length === 0) return MONSTERS[0]!;
  const idx = Math.floor(rng() * pool.length) % pool.length;
  return pool[idx]!;
}

export function pickSummonMonster(
  rng: () => number = Math.random,
  kind: ScrollKind = "normal",
): MonsterDef {
  if (kind === "mystic") return pickFrom(MYSTIC_POOL, rng);
  if (kind === "premium") {
    const useFour = rng() < 0.45 && PREMIUM_4_POOL.length > 0;
    return pickFrom(useFour ? PREMIUM_4_POOL : PREMIUM_3_POOL, rng);
  }
  return pickFrom(NORMAL_POOL, rng);
}

export function describeOwned(m: OwnedMonster): string {
  const def = getMonster(m.monsterId);
  const name = def?.nameKo ?? m.monsterId;
  const baseStars = def?.naturalStars ?? 0;
  const evo = m.evolve ?? 0;
  const stars = "★".repeat(baseStars) + (evo > 0 ? `+${evo}` : "");
  const slots = m.symbolSlots ?? emptySymbolSlots();
  const eqs = slots.filter(Boolean).length;
  const sk = normalizeSkillLevels(m.skillLevels);
  const skTag = `스킬${sk[0]}/${sk[1]}/${sk[2]}`;
  return `${name} Lv.${m.level} ${stars} ${skTag} 상징${eqs}/6`.trim();
}
