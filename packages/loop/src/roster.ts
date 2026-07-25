import { getMonster, MONSTERS, type MonsterDef } from "stonesummoner-data";

export interface OwnedMonster {
  uid: string;
  monsterId: string;
  level: number;
}

export const MAX_MONSTER_LEVEL = 15;
export const SUMMON_SCROLL_COST = 1;
export const STARTER_SCROLLS = 5;

/** Mana to raise level → level+1 */
export function enhanceManaCost(level: number): number {
  return 80 + level * 40;
}

export function levelStatMult(level: number): number {
  return 1 + (level - 1) * 0.04;
}

export function scaledMonsterStats(
  def: MonsterDef,
  level: number,
): MonsterDef["baseStats"] {
  const m = levelStatMult(level);
  return {
    hp: Math.round(def.baseStats.hp * m),
    atk: Math.round(def.baseStats.atk * m),
    def: Math.round(def.baseStats.def * m),
    spd: def.baseStats.spd + Math.floor((level - 1) / 5),
    critRate: def.baseStats.critRate,
    critDmg: def.baseStats.critDmg,
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
  const stars = def ? "★".repeat(def.naturalStars) : "";
  return `${name} Lv.${m.level} ${stars}`.trim();
}
