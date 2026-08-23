/** Phase 1 board tokens — full Module A set (+ HP orbs / bombs). */

export type BoardItemId =
  | "crit_charm"
  | "shield_core"
  | "capture_magnet"
  | "stride_sand"
  | "seal_nail"
  | "element_ward"
  | "bait_stone"
  | "transform_dust"
  | "heal_orb"
  | "hp_bomb";

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
  { id: "transform_dust", nameKo: "변환가루" },
  { id: "heal_orb", nameKo: "회복구" },
  { id: "hp_bomb", nameKo: "마력폭탄" },
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

/** Board-token pickup chip: crystal-coded items vs gold-coded items. */
export function tokenBoardResource(id: BoardItemId): "gold" | "crystal" {
  if (
    id === "shield_core" ||
    id === "capture_magnet" ||
    id === "element_ward" ||
    id === "transform_dust" ||
    id === "heal_orb"
  ) {
    return "crystal";
  }
  return "gold";
}

/** Base chance to spawn a token after a stone summon (before phase bonus). */
export const ITEM_SPAWN_CHANCE = 0.32;

/** Prefer magnet more often on higher empowered phases. Transform dust is rare. */
export function weightedItemId(
  boardPhase: number,
  rng: () => number,
): BoardItemId {
  const roll = rng();
  const weights: { id: BoardItemId; w: number }[] = [
    { id: "capture_magnet", w: 0.12 + Math.min(0.1, boardPhase * 0.04) },
    { id: "crit_charm", w: 0.13 },
    { id: "shield_core", w: 0.11 },
    { id: "stride_sand", w: 0.09 },
    { id: "seal_nail", w: 0.08 },
    { id: "element_ward", w: 0.08 },
    { id: "bait_stone", w: 0.09 },
    { id: "heal_orb", w: 0.12 },
    { id: "hp_bomb", w: 0.11 },
    { id: "transform_dust", w: 0.05 },
  ];
  let acc = 0;
  for (const { id, w } of weights) {
    acc += w;
    if (roll < acc) return id;
  }
  return "transform_dust";
}

export function shouldSpawnItem(
  spawnBonus: number,
  rng: () => number,
): boolean {
  return rng() < ITEM_SPAWN_CHANCE * (1 + spawnBonus);
}
