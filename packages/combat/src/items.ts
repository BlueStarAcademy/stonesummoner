/** Phase 1 board tokens — 치명·실드·자석·행마·봉인 */

export type BoardItemId =
  | "crit_charm"
  | "shield_core"
  | "capture_magnet"
  | "stride_sand"
  | "seal_nail";

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
  const magnetWeight = 0.2 + Math.min(0.18, boardPhase * 0.06);
  const critWeight = 0.24;
  const shieldWeight = 0.22;
  const sandWeight = 0.18;
  if (roll < magnetWeight) return "capture_magnet";
  if (roll < magnetWeight + critWeight) return "crit_charm";
  if (roll < magnetWeight + critWeight + shieldWeight) return "shield_core";
  if (roll < magnetWeight + critWeight + shieldWeight + sandWeight) {
    return "stride_sand";
  }
  return "seal_nail";
}

export function shouldSpawnItem(
  spawnBonus: number,
  rng: () => number,
): boolean {
  return rng() < ITEM_SPAWN_CHANCE * (1 + spawnBonus);
}
