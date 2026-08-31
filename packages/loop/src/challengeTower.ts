import {
  CHALLENGE_TOWER_FLOORS,
  challengeTowerStageFloor,
} from "stonesummoner-data";
import type { PlayerSave } from "./loop.js";

/** Calendar month key (UTC), e.g. 2026-08. */
export function monthKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Reset tower progress when the calendar month rolls over (1st UTC). */
export function syncChallengeTowerMonth(
  save: PlayerSave,
  now = Date.now(),
): PlayerSave {
  const key = monthKey(now);
  if (save.challengeTowerMonthKey === key) return save;
  return {
    ...save,
    challengeTowerMonthKey: key,
    challengeTowerFloor: 0,
  };
}

export function challengeTowerFloor(save: PlayerSave): number {
  return Math.max(
    0,
    Math.min(
      CHALLENGE_TOWER_FLOORS,
      Math.floor(save.challengeTowerFloor ?? 0),
    ),
  );
}

/** Unlocks after clearing chapter 2 (Tower of Valor boss). */
export function isChallengeTowerContentUnlocked(save: PlayerSave): boolean {
  return save.clearedStages.includes("tower_2_7");
}

export function isChallengeTowerStageUnlocked(
  save: PlayerSave,
  stageId: string,
  now = Date.now(),
): boolean {
  if (!isChallengeTowerContentUnlocked(save)) return false;
  const synced = syncChallengeTowerMonth(save, now);
  const floor = challengeTowerStageFloor(stageId);
  if (floor == null) return false;
  return floor === challengeTowerFloor(synced) + 1;
}

export function isChallengeTowerStageCleared(
  save: PlayerSave,
  stageId: string,
  now = Date.now(),
): boolean {
  const synced = syncChallengeTowerMonth(save, now);
  const floor = challengeTowerStageFloor(stageId);
  if (floor == null) return false;
  return challengeTowerFloor(synced) >= floor;
}

export { CHALLENGE_TOWER_FLOORS } from "stonesummoner-data";
