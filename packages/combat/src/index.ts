export { Battle, makeUnit } from "./battle.js";
export type { BattleConfig, SkillResult } from "./battle.js";
export { computeDamage, clampAmplify, elementMultiplier } from "./damage.js";
export { gainsForBoardEvent, classifyCapture } from "./boardEvents.js";
export { pickAutoStone, pickDefaultTarget, teamStoneColor } from "./ai.js";
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
