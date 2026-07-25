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

/** Starter drop stub for map 1. */
export function createStarterHwalro(slot: 1 | 2 | 3 | 4 | 5 | 6): SymbolInstance {
  const mains: Record<number, { mainStat: string; mainValue: number }> = {
    1: { mainStat: "ATK+", mainValue: 22 },
    2: { mainStat: "HP+", mainValue: 360 },
    3: { mainStat: "DEF+", mainValue: 22 },
    4: { mainStat: "CRI Dmg%", mainValue: 11 },
    5: { mainStat: "HP+", mainValue: 360 },
    6: { mainStat: "SPD+", mainValue: 7 },
  };
  const m = mains[slot]!;
  return {
    id: `hwalro_${slot}_${Date.now()}`,
    setId: "hwalro",
    slot,
    stars: 6,
    enhance: 0,
    mainStat: m.mainStat,
    mainValue: m.mainValue,
  };
}
