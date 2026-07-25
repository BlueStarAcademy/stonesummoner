export { Board } from "./board.js";
export {
  amplifyCapForPhase,
  COMBAT_BOARD_SIZES,
  createCirclePhaseState,
  EMPOWERED_RESET_THRESHOLD,
  itemSpawnBonusForPhase,
  manaBonusMultiplierForPhase,
  registerStoneSummon,
  resetBoardInPlace,
} from "./progression.js";
export type { CombatBoardSize, CirclePhaseState } from "./progression.js";
export type {
  Cell,
  PlayError,
  PlayOutcome,
  PlayResult,
  Point,
  StoneColor,
} from "./types.js";
