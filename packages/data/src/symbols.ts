/** Phase 1–2 symbol sets (SW-mapped names). Full tables in docs/symbols.md */

export type SymbolSetId =
  | "hwalro"
  | "yongmaeng"
  | "haengma"
  | "gunhim"
  | "mussang"
  | "chimtu"
  | "bogang"
  | "jipjung";

export interface SymbolSetDef {
  id: SymbolSetId;
  nameKo: string;
  swName: string;
  pieces: 2 | 4;
  effectKo: string;
}

export const SYMBOL_SETS: SymbolSetDef[] = [
  { id: "hwalro", nameKo: "활로", swName: "Energy", pieces: 2, effectKo: "체력 +15%" },
  { id: "yongmaeng", nameKo: "용맹", swName: "Fatal", pieces: 4, effectKo: "공격력 +35%" },
  { id: "haengma", nameKo: "행마", swName: "Swift", pieces: 4, effectKo: "공격속도 +25%" },
  { id: "gunhim", nameKo: "군힘", swName: "Guard", pieces: 2, effectKo: "방어력 +15%" },
  { id: "mussang", nameKo: "무쌍", swName: "Blade", pieces: 2, effectKo: "치명타율 +12%" },
  { id: "chimtu", nameKo: "침투", swName: "Rage", pieces: 4, effectKo: "치피 +40%" },
  { id: "bogang", nameKo: "보강", swName: "Shield", pieces: 2, effectKo: "체력 +8%" },
  { id: "jipjung", nameKo: "집중", swName: "Focus", pieces: 2, effectKo: "명중(치명율) +8%" },
];

export interface SymbolInstance {
  id: string;
  setId: SymbolSetId;
  slot: 1 | 2 | 3 | 4 | 5 | 6;
  stars: 1 | 2 | 3 | 4 | 5 | 6;
  enhance: number;
  mainStat: string;
  mainValue: number;
  /** Grind / prefix — flat bonus, does not scale with enhance (SW 연마). */
  prefixStat?: string | null;
  prefixValue?: number;
}

const SLOT_MAINS: Record<number, { mainStat: string; mainValue: number }> = {
  1: { mainStat: "ATK+", mainValue: 22 },
  2: { mainStat: "HP+", mainValue: 360 },
  3: { mainStat: "DEF+", mainValue: 22 },
  4: { mainStat: "CRI Dmg%", mainValue: 11 },
  5: { mainStat: "HP+", mainValue: 360 },
  6: { mainStat: "SPD+", mainValue: 7 },
};

/** Flexible slots that can be re-imprinted (SW-like 4/5/6). */
export const IMPRINTABLE_SLOTS = [4, 5, 6] as const;

const SLOT_IMPRINT_POOL: Record<
  number,
  { mainStat: string; mainValue: number }[]
> = {
  4: [
    { mainStat: "CRI Dmg%", mainValue: 11 },
    { mainStat: "CRI Rate%", mainValue: 7 },
    { mainStat: "ATK+", mainValue: 22 },
    { mainStat: "HP+", mainValue: 360 },
    { mainStat: "DEF+", mainValue: 22 },
  ],
  5: [
    { mainStat: "HP+", mainValue: 360 },
    { mainStat: "ATK+", mainValue: 22 },
    { mainStat: "DEF+", mainValue: 22 },
    { mainStat: "CRI Rate%", mainValue: 7 },
    { mainStat: "CRI Dmg%", mainValue: 11 },
  ],
  6: [
    { mainStat: "SPD+", mainValue: 7 },
    { mainStat: "ATK+", mainValue: 22 },
    { mainStat: "HP+", mainValue: 360 },
    { mainStat: "DEF+", mainValue: 22 },
    { mainStat: "CRI Rate%", mainValue: 7 },
  ],
};

export const SYMBOL_IMPRINT_CRYSTAL_COST = 8;

/** Mana cost to grind (apply / re-roll prefix). */
export const SYMBOL_GRIND_MANA_COST = 150;

/** Flat prefix pool — values do not grow with enhance. */
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

/** All Phase 1 symbols can receive a grind prefix. */
export function canGrindSymbol(_s: SymbolInstance): boolean {
  return true;
}

/** Re-roll main option for imprintable slots. Avoids identical roll when possible. */
export function imprintSymbolMain(
  s: SymbolInstance,
  rng: () => number = Math.random,
): SymbolInstance | null {
  if (!canImprintSymbol(s)) return null;
  const pool = SLOT_IMPRINT_POOL[s.slot] ?? [];
  if (pool.length === 0) return null;
  const others = pool.filter(
    (p) => !(p.mainStat === s.mainStat && p.mainValue === s.mainValue),
  );
  const choices = others.length > 0 ? others : pool;
  const pick = choices[Math.floor(rng() * choices.length) % choices.length]!;
  return { ...s, mainStat: pick.mainStat, mainValue: pick.mainValue };
}

/** Apply or re-roll grind prefix. Avoids identical roll when possible. */
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

export function createSymbol(
  setId: SymbolSetId,
  slot: 1 | 2 | 3 | 4 | 5 | 6,
  id?: string,
): SymbolInstance {
  const m = SLOT_MAINS[slot]!;
  return {
    id: id ?? `${setId}_${slot}_${Date.now()}`,
    setId,
    slot,
    stars: 6,
    enhance: 0,
    mainStat: m.mainStat,
    mainValue: m.mainValue,
    prefixStat: null,
    prefixValue: 0,
  };
}

/** Starter drop stub for map 1. */
export function createStarterHwalro(slot: 1 | 2 | 3 | 4 | 5 | 6): SymbolInstance {
  return createSymbol("hwalro", slot, `hwalro_${slot}_${Date.now()}`);
}

/** Weighted drop; preferredSet biases ~70% toward that set (depth/scenario). */
export function rollSymbolDrop(
  rng: () => number = Math.random,
  idPrefix = "drop",
  preferredSet?: SymbolSetId,
): SymbolInstance {
  let setId: SymbolSetId;
  if (preferredSet && rng() < 0.7) {
    setId = preferredSet;
  } else {
    const r = rng();
    setId =
      r < 0.4
        ? "hwalro"
        : r < 0.55
          ? "yongmaeng"
          : r < 0.68
            ? "haengma"
            : r < 0.78
              ? "gunhim"
              : r < 0.86
                ? "mussang"
                : r < 0.93
                  ? "chimtu"
                  : r < 0.97
                    ? "bogang"
                    : "jipjung";
  }
  const slot = ([1, 2, 3, 4, 5, 6] as const)[Math.floor(rng() * 6)]!;
  return createSymbol(setId, slot, `${idPrefix}_${setId}_${slot}`);
}
