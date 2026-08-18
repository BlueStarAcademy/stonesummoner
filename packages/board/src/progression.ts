import type { Board } from "./board.js";

/** Progressive combat board sizes. 7×7 is the largest magic circle. */
export const COMBAT_BOARD_SIZES = [5, 7] as const;
export type CombatBoardSize = (typeof COMBAT_BOARD_SIZES)[number];

export const EMPOWERED_RESET_THRESHOLD = 50;

export interface CirclePhaseState {
  size: CombatBoardSize;
  /** Successful stone summons (both sides). */
  stoneSummonCount: number;
  /** 0 = normal circle; 1+ = empowered after reset. */
  boardPhase: number;
  resetThreshold: number;
}

export function createCirclePhaseState(
  size: CombatBoardSize,
  resetThreshold = EMPOWERED_RESET_THRESHOLD,
): CirclePhaseState {
  return {
    size,
    stoneSummonCount: 0,
    boardPhase: 0,
    resetThreshold,
  };
}

/** Amplify hard cap for empowered circle phase (before ΔPower clamp). */
export function amplifyCapForPhase(boardPhase: number): number {
  if (boardPhase <= 0) return 1.25;
  if (boardPhase === 1) return 1.3;
  if (boardPhase === 2) return 1.35;
  return 1.4;
}

/** Mana bonus multiplier from board events on empowered phases. */
export function manaBonusMultiplierForPhase(boardPhase: number): number {
  if (boardPhase <= 0) return 1;
  return 1 + boardPhase * 0.1;
}

export function itemSpawnBonusForPhase(boardPhase: number): number {
  if (boardPhase <= 0) return 0;
  return 0.2 * boardPhase;
}

/**
 * Call after every successful stone summon.
 * When size is 7 and count hits threshold, signals a board wipe + phase up.
 */
export function registerStoneSummon(
  state: CirclePhaseState,
): { state: CirclePhaseState; shouldReset: boolean } {
  const next: CirclePhaseState = {
    ...state,
    stoneSummonCount: state.stoneSummonCount + 1,
  };

  if (
    next.size === 7 &&
    next.stoneSummonCount >= next.resetThreshold
  ) {
    return {
      shouldReset: true,
      state: {
        ...next,
        stoneSummonCount: 0,
        boardPhase: next.boardPhase + 1,
      },
    };
  }

  return { state: next, shouldReset: false };
}

/** Clear stones/ko on an existing board instance (same size). */
export function resetBoardInPlace(board: Board): void {
  board.clear();
}
