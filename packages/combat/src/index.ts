export { Battle, makeUnit, pickAutoSkillIndex } from "./battle.js";
export type { BattleConfig, SkillResult } from "./battle.js";
export { computeDamage, clampAmplify, elementMultiplier } from "./damage.js";
export {
  amplifyCapFromPowerDelta,
  estimateCombatPower,
} from "./power.js";
export { gainsForBoardEvent, classifyCapture } from "./boardEvents.js";
export { detectShapeBonuses, starPoints } from "./shapes.js";
export type { ShapeBonus, ShapeBonusId } from "./shapes.js";
export {
  CIRCLE_EVENTS,
  CIRCLE_EVENT_INTERVAL,
  circleEventName,
  rollCircleEvent,
  shouldRollCircleEvent,
} from "./circleEvents.js";
export type { CircleEventId } from "./circleEvents.js";
export {
  CAPTURE_SHOP_THRESHOLD,
  captureShopOffers,
  pickCaptureShopChoice,
} from "./captureShop.js";
export type { CaptureShopChoice, CaptureShopOffer } from "./captureShop.js";
export {
  bossVictoryPoint,
  BRILLIANT_MISSION_GOAL,
  modulesForStage,
  pickCircleElement,
} from "./modules.js";
export type { BattleModules } from "./modules.js";
export {
  BOARD_ITEMS,
  itemDef,
  ITEM_SPAWN_CHANCE,
  weightedItemId,
} from "./items.js";
export type { BoardItemDef, BoardItemId, BoardToken } from "./items.js";
export {
  aliveSummons,
  pickAutoStone,
  pickDefaultTarget,
  rankStoneSuggestions,
  teamStoneColor,
} from "./ai.js";
export type { StoneEval, StoneSuggestion } from "./ai.js";
export type {
  BattlePhase,
  Element,
  FinishReason,
  SummonerState,
  TeamId,
  Unit,
  UnitKind,
  UnitStats,
} from "./types.js";
