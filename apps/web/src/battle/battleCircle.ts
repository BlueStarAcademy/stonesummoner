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
  return `/art/battle/stone/${key}.webp`;
}

export function normalizeBattleStoneId(
  element: string | null | undefined,
): BattleStoneId {
  if (element && STONE_ELEMENTS.has(element)) return element as Element;
  return "enemy";
}
