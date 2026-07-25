/** Phase 1 board tokens — 치명·실드·자석·행마·봉인·속성의뢰 */

export type BoardItemId =
  | "crit_charm"
  | "shield_core"
  | "capture_magnet"
  | "stride_sand"
  | "seal_nail"
  | "element_ward";

export interface BoardItemDef {
  id: BoardItemId;
  nameKo: string;
}

export const BOARD_ITEMS: BoardItemDef[] = [
  { id: "crit_charm", nameKo: "치명부적" },
  { id: "shield_core", nameKo: "실드핵" },
  { id: "capture_magnet", nameKo: "사석자석" },
  { id: "stride_sand", nameKo: "행마모래" },
  { id: "seal_nail", nameKo: "봉인못" },
  { id: "element_ward", nameKo: "속성의뢰" },
];

export interface BoardToken {
  id: BoardItemId;
  x: number;
  y: number;
}

/** Temporary forbidden point from 봉인못. */
export interface TempSeal {
  x: number;
  y: number;
  /** Stone plays remaining until seal lifts (ticks at end of each play). */
  remaining: number;
}

export function itemDef(id: BoardItemId): BoardItemDef {
  return BOARD_ITEMS.find((i) => i.id === id)!;
}

/** Base chance to spawn a token after a stone summon (before phase bonus). */
export const ITEM_SPAWN_CHANCE = 0.28;

/** Prefer magnet more often on higher empowered phases. */
export function weightedItemId(
  boardPhase: number,
  rng: () => number,
): BoardItemId {
  const roll = rng();
  const magnetWeight = 0.18 + Math.min(0.16, boardPhase * 0.05);
  const critWeight = 0.2;
  const shieldWeight = 0.18;
  const sandWeight = 0.15;
  const sealWeight = 0.14;
  let acc = magnetWeight;
  if (roll < acc) return "capture_magnet";
  acc += critWeight;
  if (roll < acc) return "crit_charm";
  acc += shieldWeight;
  if (roll < acc) return "shield_core";
  acc += sandWeight;
  if (roll < acc) return "stride_sand";
  acc += sealWeight;
  if (roll < acc) return "seal_nail";
  return "element_ward";
}

export function shouldSpawnItem(
  spawnBonus: number,
  rng: () => number,
): boolean {
  return rng() < ITEM_SPAWN_CHANCE * (1 + spawnBonus);
}
