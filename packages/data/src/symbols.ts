/** Symbol sets — SW classic 16. Tables in docs/symbols.md + symbolTables.ts */

import {
  mainStatAtEnhance,
  pickSlotMainStat,
  pickWeighted,
  QUALITY_SUBSTAT_COUNT,
  rollSubstatValue,
  SLOT_MAIN_POOL,
  SUBSTAT_POOL,
  normalizeSymbolQuality,
  type SymbolQuality,
  type SymbolStars,
  type SymbolStatId,
} from "./symbolTables.js";

export type { SymbolQuality, SymbolStars, SymbolStatId };
export {
  QUALITY_SUBSTAT_COUNT,
  qualityToPlateId,
  mainStatAtEnhance,
  SLOT_MAIN_POOL,
  normalizeSymbolQuality,
} from "./symbolTables.js";

export type SymbolSetId =
  | "hwalro"
  | "yongmaeng"
  | "mussang"
  | "haengma"
  | "jipjung"
  | "gunhim"
  | "yeongyeol"
  | "bogang"
  | "hwangyeok"
  | "ssangnip"
  | "eungjing"
  | "tagae"
  | "pamyeol"
  | "myosu"
  | "gyeongno"
  | "chimtu";

export interface SymbolSetDef {
  id: SymbolSetId;
  nameKo: string;
  swName: string;
  pieces: 2 | 4;
  effectKo: string;
  /** Scenario map 1–13, or null if Cairos-only. */
  dropMap: number | null;
}

export const SYMBOL_SETS: SymbolSetDef[] = [
  { id: "hwalro", nameKo: "활로", swName: "Energy", pieces: 2, effectKo: "체력 +15%", dropMap: 1 },
  { id: "yongmaeng", nameKo: "용맹", swName: "Fatal", pieces: 4, effectKo: "공격력 +35%", dropMap: 2 },
  { id: "mussang", nameKo: "무쌍", swName: "Blade", pieces: 2, effectKo: "치명확률 +12%", dropMap: 3 },
  { id: "haengma", nameKo: "행마", swName: "Swift", pieces: 4, effectKo: "속도 +25%", dropMap: 4 },
  { id: "jipjung", nameKo: "집중", swName: "Focus", pieces: 2, effectKo: "효과적중 +20%", dropMap: 5 },
  { id: "gunhim", nameKo: "굳힘", swName: "Guard", pieces: 2, effectKo: "방어력 +15%", dropMap: 6 },
  { id: "yeongyeol", nameKo: "연결", swName: "Endure", pieces: 2, effectKo: "효과저항 +20%", dropMap: 7 },
  { id: "bogang", nameKo: "보강", swName: "Shield", pieces: 2, effectKo: "아군 실드 3턴(체력의 15%)", dropMap: 8 },
  { id: "hwangyeok", nameKo: "환격", swName: "Revenge", pieces: 2, effectKo: "반격확률 +15%", dropMap: 9 },
  { id: "ssangnip", nameKo: "쌍립", swName: "Will", pieces: 2, effectKo: "면역 1턴", dropMap: 10 },
  { id: "eungjing", nameKo: "응징", swName: "Nemesis", pieces: 2, effectKo: "피격 시 ATB +4%(HP 7% 손실마다)", dropMap: 11 },
  { id: "tagae", nameKo: "타개", swName: "Vampire", pieces: 4, effectKo: "흡혈 +35%(데미지)", dropMap: 12 },
  { id: "pamyeol", nameKo: "파멸", swName: "Destroy", pieces: 2, effectKo: "피해의 30%로 적 최대HP 감소(회당 최대 4%)", dropMap: 13 },
  { id: "myosu", nameKo: "묘수", swName: "Despair", pieces: 4, effectKo: "기절 확률 +25%", dropMap: null },
  { id: "gyeongno", nameKo: "격노", swName: "Violent", pieces: 4, effectKo: "추가턴 +22%", dropMap: null },
  { id: "chimtu", nameKo: "침투", swName: "Rage", pieces: 4, effectKo: "치명피해 +40%", dropMap: null },
];

const SET_IDS = new Set<string>(SYMBOL_SETS.map((s) => s.id));

export function isSymbolSetId(id: string): id is SymbolSetId {
  return SET_IDS.has(id);
}

export function getSymbolSet(id: SymbolSetId): SymbolSetDef | undefined {
  return SYMBOL_SETS.find((s) => s.id === id);
}

export function symbolSetForMap(map: number): SymbolSetDef | undefined {
  return SYMBOL_SETS.find((s) => s.dropMap === map);
}

export interface SymbolSubstat {
  stat: SymbolStatId;
  value: number;
}

export interface SymbolInstance {
  id: string;
  setId: SymbolSetId;
  slot: 1 | 2 | 3 | 4 | 5 | 6;
  stars: SymbolStars;
  quality: SymbolQuality;
  enhance: number;
  mainStat: SymbolStatId | string;
  mainValue: number;
  substats: SymbolSubstat[];
  /** Grind / prefix — flat bonus, does not scale with enhance (SW 연마). */
  prefixStat?: string | null;
  prefixValue?: number;
}

/** Normalize legacy saves missing quality/substats. */
export function normalizeSymbol(raw: SymbolInstance): SymbolInstance {
  const setId = isSymbolSetId(raw.setId) ? raw.setId : "hwalro";
  const stars = ([1, 2, 3, 4, 5, 6].includes(raw.stars) ? raw.stars : 6) as SymbolStars;
  const quality = normalizeSymbolQuality(raw.quality);
  const substats = Array.isArray(raw.substats) ? raw.substats : [];
  const mainStat = (raw.mainStat || "ATK+") as SymbolStatId;
  const enhance = Math.max(0, Math.min(15, raw.enhance ?? 0));
  const mainValue =
    typeof raw.mainValue === "number" && raw.mainValue > 0
      ? raw.mainValue
      : mainStatAtEnhance(mainStat, stars, enhance);
  return {
    ...raw,
    setId,
    stars,
    quality,
    enhance,
    mainStat,
    mainValue,
    substats,
  };
}

export const IMPRINTABLE_SLOTS = [2, 4, 6] as const;

export const SYMBOL_IMPRINT_CRYSTAL_COST = 8;
export const SYMBOL_GRIND_MANA_COST = 150;
/** Grindstone inventory cost per grind (prefix or substat enhance). */
export const SYMBOL_GRIND_STONE_COST = 1;

const GRIND_PREFIX_POOL: { prefixStat: string; prefixValue: number }[] = [
  { prefixStat: "ATK+", prefixValue: 10 },
  { prefixStat: "HP+", prefixValue: 100 },
  { prefixStat: "DEF+", prefixValue: 10 },
  { prefixStat: "SPD+", prefixValue: 2 },
  { prefixStat: "CRI Rate%", prefixValue: 2 },
  { prefixStat: "CRI Dmg%", prefixValue: 3 },
];

export function canImprintSymbol(s: SymbolInstance): boolean {
  return (IMPRINTABLE_SLOTS as readonly number[]).includes(s.slot);
}

export function canGrindSymbol(_s: SymbolInstance): boolean {
  return true;
}

export function imprintSymbolMain(
  s: SymbolInstance,
  rng: () => number = Math.random,
): SymbolInstance | null {
  if (!canImprintSymbol(s)) return null;
  const slot = s.slot as 2 | 4 | 6;
  const pool = SLOT_MAIN_POOL[slot];
  const others = pool.filter((p) => p !== s.mainStat);
  const choices = others.length > 0 ? others : pool;
  const pick = choices[Math.floor(rng() * choices.length) % choices.length]!;
  return {
    ...s,
    mainStat: pick,
    mainValue: mainStatAtEnhance(pick, s.stars, s.enhance),
  };
}

export function grindSymbolPrefix(
  s: SymbolInstance,
  rng: () => number = Math.random,
): SymbolInstance | null {
  if (!canGrindSymbol(s)) return null;
  const others = GRIND_PREFIX_POOL.filter(
    (p) =>
      !(p.prefixStat === s.prefixStat && p.prefixValue === s.prefixValue),
  );
  const choices = others.length > 0 ? others : GRIND_PREFIX_POOL;
  const pick = choices[Math.floor(rng() * choices.length) % choices.length]!;
  return {
    ...s,
    prefixStat: pick.prefixStat,
    prefixValue: pick.prefixValue,
  };
}

function rollSubstats(
  mainStat: string,
  stars: SymbolStars,
  quality: SymbolQuality,
  rng: () => number,
): SymbolSubstat[] {
  const n = QUALITY_SUBSTAT_COUNT[quality];
  const used = new Set<string>([mainStat]);
  const out: SymbolSubstat[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 40) {
    const pool = SUBSTAT_POOL.filter((s) => !used.has(s));
    if (pool.length === 0) break;
    const stat = pool[Math.floor(rng() * pool.length) % pool.length]!;
    used.add(stat);
    out.push({ stat, value: rollSubstatValue(stat, stars, rng) });
  }
  return out;
}

export function createSymbol(
  setId: SymbolSetId,
  slot: 1 | 2 | 3 | 4 | 5 | 6,
  id?: string,
  opts?: {
    stars?: SymbolStars;
    quality?: SymbolQuality;
    mainStat?: SymbolStatId;
    rng?: () => number;
  },
): SymbolInstance {
  const rng = opts?.rng ?? Math.random;
  const stars = opts?.stars ?? 6;
  const quality = opts?.quality ?? "legend";
  const mainStat = opts?.mainStat ?? pickSlotMainStat(slot, rng);
  const enhance = 0;
  return {
    id: id ?? `${setId}_${slot}_${Date.now()}`,
    setId,
    slot,
    stars,
    quality,
    enhance,
    mainStat,
    mainValue: mainStatAtEnhance(mainStat, stars, enhance),
    substats: rollSubstats(mainStat, stars, quality, rng),
    prefixStat: null,
    prefixValue: 0,
  };
}

export function createStarterHwalro(slot: 1 | 2 | 3 | 4 | 5 | 6): SymbolInstance {
  return createSymbol("hwalro", slot, `hwalro_${slot}_${Date.now()}`, {
    stars: 6,
    quality: "rare",
    mainStat: slot === 1 ? "ATK+" : slot === 3 ? "DEF+" : slot === 5 ? "HP+" : undefined,
  });
}

export interface RollSymbolDropOpts {
  preferredSet?: SymbolSetId;
  preferredSlot?: 1 | 2 | 3 | 4 | 5 | 6;
  setPool?: SymbolSetId[];
  starWeights?: { value: SymbolStars; w: number }[];
  qualityWeights?: { value: SymbolQuality; w: number }[];
}

const DEFAULT_STAR_WEIGHTS: { value: SymbolStars; w: number }[] = [
  { value: 3, w: 20 },
  { value: 4, w: 35 },
  { value: 5, w: 30 },
  { value: 6, w: 15 },
];

const DEFAULT_QUALITY_WEIGHTS: { value: SymbolQuality; w: number }[] = [
  { value: "normal", w: 10 },
  { value: "advanced", w: 25 },
  { value: "rare", w: 35 },
  { value: "epic", w: 22 },
  { value: "legend", w: 8 },
];

/** Weighted drop; preferredSet biases ~70% when set, else pool/uniform. */
export function rollSymbolDrop(
  rng: () => number = Math.random,
  idPrefix = "drop",
  preferredSetOrOpts?: SymbolSetId | RollSymbolDropOpts,
  preferredSlot?: 1 | 2 | 3 | 4 | 5 | 6,
): SymbolInstance {
  const opts: RollSymbolDropOpts =
    typeof preferredSetOrOpts === "string" || preferredSetOrOpts === undefined
      ? { preferredSet: preferredSetOrOpts, preferredSlot }
      : preferredSetOrOpts;

  const pool = opts.setPool?.length
    ? opts.setPool
    : SYMBOL_SETS.map((s) => s.id);

  let setId: SymbolSetId;
  if (opts.preferredSet && rng() < 0.7) {
    setId = opts.preferredSet;
  } else if (opts.preferredSet && pool.includes(opts.preferredSet) && rng() < 0.85) {
    setId = opts.preferredSet;
  } else {
    setId = pool[Math.floor(rng() * pool.length) % pool.length]!;
  }

  const slot =
    opts.preferredSlot ??
    ([1, 2, 3, 4, 5, 6] as const)[Math.floor(rng() * 6)]!;
  const stars = pickWeighted(opts.starWeights ?? DEFAULT_STAR_WEIGHTS, rng);
  const quality = pickWeighted(opts.qualityWeights ?? DEFAULT_QUALITY_WEIGHTS, rng);

  return createSymbol(setId, slot, `${idPrefix}_${setId}_${slot}`, {
    stars,
    quality,
    rng,
  });
}

/** Recalculate main value after enhance bump. */
export function refreshMainValue(s: SymbolInstance): SymbolInstance {
  const stat = s.mainStat as SymbolStatId;
  if (!(stat in MAIN_STAT_CHECK)) return s;
  return {
    ...s,
    mainValue: mainStatAtEnhance(stat, s.stars, s.enhance),
  };
}

const MAIN_STAT_CHECK: Record<string, true> = {
  "ATK+": true,
  "HP+": true,
  "DEF+": true,
  "SPD+": true,
  "ATK%": true,
  "HP%": true,
  "DEF%": true,
  "CRI Rate%": true,
  "CRI Dmg%": true,
  "ACC%": true,
  "RES%": true,
};
