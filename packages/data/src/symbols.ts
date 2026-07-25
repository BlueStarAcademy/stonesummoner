/** Phase 1 symbol sets (SW-mapped names). Full tables in docs/symbols.md */

export type SymbolSetId = "hwalro" | "yongmaeng" | "haengma";

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
];

export interface SymbolInstance {
  id: string;
  setId: SymbolSetId;
  slot: 1 | 2 | 3 | 4 | 5 | 6;
  stars: 1 | 2 | 3 | 4 | 5 | 6;
  enhance: number;
  mainStat: string;
  mainValue: number;
}

const SLOT_MAINS: Record<number, { mainStat: string; mainValue: number }> = {
  1: { mainStat: "ATK+", mainValue: 22 },
  2: { mainStat: "HP+", mainValue: 360 },
  3: { mainStat: "DEF+", mainValue: 22 },
  4: { mainStat: "CRI Dmg%", mainValue: 11 },
  5: { mainStat: "HP+", mainValue: 360 },
  6: { mainStat: "SPD+", mainValue: 7 },
};

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
  };
}

/** Starter drop stub for map 1. */
export function createStarterHwalro(slot: 1 | 2 | 3 | 4 | 5 | 6): SymbolInstance {
  return createSymbol("hwalro", slot, `hwalro_${slot}_${Date.now()}`);
}

/** Weighted Phase 1 drop: 활로 55% · 용맹 25% · 행마 20%. */
export function rollSymbolDrop(
  rng: () => number = Math.random,
  idPrefix = "drop",
): SymbolInstance {
  const r = rng();
  const setId: SymbolSetId =
    r < 0.55 ? "hwalro" : r < 0.8 ? "yongmaeng" : "haengma";
  const slot = ([1, 2, 3, 4, 5, 6] as const)[Math.floor(rng() * 6)]!;
  return createSymbol(setId, slot, `${idPrefix}_${setId}_${slot}`);
}
