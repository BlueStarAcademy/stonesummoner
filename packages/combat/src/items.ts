/** Phase 1 board tokens — 치명·실드·자석·행마·봉인·속성·미끼 */

export type BoardItemId =
  | "crit_charm"
  | "shield_core"
  | "capture_magnet"
  | "stride_sand"
  | "seal_nail"
  | "element_ward"
  | "bait_stone";

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
  { id: "bait_stone", nameKo: "미끼돌" },
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

/** AI lure point from 미끼돌 — opposite team prefers this play. */
export interface BaitLure {
  x: number;
  y: number;
  /** Team that is lured toward the point. */
  targetTeam: "ally" | "enemy";
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
  const weights: { id: BoardItemId; w: number }[] = [
    { id: "capture_magnet", w: 0.16 + Math.min(0.14, boardPhase * 0.05) },
    { id: "crit_charm", w: 0.18 },
    { id: "shield_core", w: 0.16 },
    { id: "stride_sand", w: 0.13 },
    { id: "seal_nail", w: 0.12 },
    { id: "element_ward", w: 0.12 },
    { id: "bait_stone", w: 0.13 },
  ];
  let acc = 0;
  for (const { id, w } of weights) {
    acc += w;
    if (roll < acc) return id;
  }
  return "bait_stone";
}

export function shouldSpawnItem(
  spawnBonus: number,
  rng: () => number,
): boolean {
  return rng() < ITEM_SPAWN_CHANCE * (1 + spawnBonus);
}
