export { Battle, makeUnit, pickAutoSkillIndex } from "./battle.js";
export type {
  BattleConfig,
  SkillResult,
  StoneReport,
  StoneReportChip,
  StoneReportChipKind,
} from "./battle.js";
export { computeDamage, clampAmplify, elementMultiplier, defenseMitigation } from "./damage.js";
export {
  amplifyCapFromPowerDelta,
  estimateCombatPower,
} from "./power.js";
export {
  gainsForBoardEvent,
  classifyCapture,
  CAPTURE_BONUS_PER_STONE,
  CAPTURE_DAMAGE_PER_STONE,
  CAPTURE_MANA_FRAC_PER_STONE,
  SAFE_PLACE_MANA,
} from "./boardEvents.js";
export { composeSummonerUlt } from "./summonerUlt.js";
export type { ComposedSummonerUlt } from "./summonerUlt.js";
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
  DUAL_BOARD_SWITCH_INTERVAL,
  forbiddenZonePoints,
  modulesForStage,
  pickCircleElement,
} from "./modules.js";
export type { BattleModules } from "./modules.js";
export {
  BOARD_ITEMS,
  itemDef,
  ITEM_SPAWN_CHANCE,
  tokenBoardResource,
  weightedItemId,
} from "./items.js";
export type {
  BoardItemDef,
  BoardItemId,
  BoardToken,
  BaitLure,
  TempSeal,
} from "./items.js";
export {
  aliveSummons,
  pickAutoStone,
  pickDefaultTarget,
  rankStoneSuggestions,
  teamStoneColor,
} from "./ai.js";
export { pickExpertStone, scoreExpertStone } from "./stoneTactic.js";
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
export { listUnitStatuses } from "./statuses.js";
export type {
  UnitStatusIcon,
  UnitStatusId,
  UnitStatusPolarity,
} from "./statuses.js";
