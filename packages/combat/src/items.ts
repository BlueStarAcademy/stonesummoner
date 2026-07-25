/** Phase 1 board tokens — 치명부적 · 실드핵 · 사석자석 */

export type BoardItemId = "crit_charm" | "shield_core" | "capture_magnet";

export interface BoardItemDef {
  id: BoardItemId;
  nameKo: string;
}

export const BOARD_ITEMS: BoardItemDef[] = [
  { id: "crit_charm", nameKo: "치명부적" },
  { id: "shield_core", nameKo: "실드핵" },
  { id: "capture_magnet", nameKo: "사석자석" },
];

export interface BoardToken {
  id: BoardItemId;
  x: number;
  y: number;
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
  const magnetWeight = 0.28 + Math.min(0.25, boardPhase * 0.08);
  if (roll < magnetWeight) return "capture_magnet";
  if (roll < magnetWeight + 0.36) return "crit_charm";
  return "shield_core";
}

export function shouldSpawnItem(
  spawnBonus: number,
  rng: () => number,
): boolean {
  return rng() < ITEM_SPAWN_CHANCE * (1 + spawnBonus);
}
