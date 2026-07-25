export { Battle, makeUnit } from "./battle.js";
export type { BattleConfig, SkillResult } from "./battle.js";
export { computeDamage, clampAmplify, elementMultiplier } from "./damage.js";
export {
  amplifyCapFromPowerDelta,
  estimateCombatPower,
} from "./power.js";
export { gainsForBoardEvent, classifyCapture } from "./boardEvents.js";
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
