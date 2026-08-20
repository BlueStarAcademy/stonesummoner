/**
 * Battle magic-circle + magic-stone public URL helpers.
 * Circle ids reuse battle background ids.
 */

import type { Element, StageDef } from "stonesummoner-data";
import { battleBgIdForStage, type BattleBgId } from "./battleBg";

export type BattleStoneId = Element | "enemy";

const STONE_ELEMENTS = new Set<string>([
  "fire",
  "water",
  "wind",
  "light",
  "dark",
]);

export function battleCircleIdForStage(
  stage:
    | Pick<StageDef, "mode" | "map" | "cairosDungeon">
    | null
    | undefined,
): BattleBgId {
  return battleBgIdForStage(stage);
}

export function battleCircleSrc(id: BattleBgId = "map-01"): string {
  return `/art/battle/circle/${id}.webp`;
}

export function battleStoneSrc(id: BattleStoneId = "enemy"): string {
  const key = STONE_ELEMENTS.has(id) ? id : "enemy";
  return `/art/battle/stone/${key}.webp?v=9`;
}

export const BATTLE_BOARD_MARK_IDS = [
  "forbid",
  "bait",
  "victory",
  "star",
  "crit_charm",
  "shield_core",
  "capture_magnet",
  "stride_sand",
  "seal_nail",
  "element_ward",
  "bait_stone",
  "transform_dust",
] as const;

export type BattleBoardMarkId = (typeof BATTLE_BOARD_MARK_IDS)[number];

const BOARD_MARK_IDS = new Set<string>(BATTLE_BOARD_MARK_IDS);

export function battleBoardMarkSrc(id: string): string {
  const key = BOARD_MARK_IDS.has(id) ? id : "star";
  return `/art/battle/mark/${key}.webp?v=1`;
}

export function battleBoardMarkFallbackSrc(id: string): string {
  const key = BOARD_MARK_IDS.has(id) ? id : "star";
  return `/art/battle/mark/${key}.svg`;
}

export function normalizeBattleStoneId(
  element: string | null | undefined,
): BattleStoneId {
  if (element && STONE_ELEMENTS.has(element)) return element as Element;
  return "enemy";
}
