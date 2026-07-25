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
export const STARTER_SCROLLS = 5;
/** Mana to buy one summon scroll at the shop stub. */
export const SCROLL_BUY_MANA_COST = 450;

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

/** 3★ pool for Phase 1 summons */
const SUMMON_POOL = MONSTERS.filter((m) => m.naturalStars <= 4);

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
  };
}

export function pickSummonMonster(rng: () => number): MonsterDef {
  const idx = Math.floor(rng() * SUMMON_POOL.length) % SUMMON_POOL.length;
  return SUMMON_POOL[idx]!;
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
