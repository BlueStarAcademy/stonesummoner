import type { UnitStats } from "./types.js";

/** Rough combat power for ΔPower amplify caps. */
export function estimateCombatPower(
  units: { stats: UnitStats; alive?: boolean }[],
): number {
  let total = 0;
  for (const u of units) {
    if (u.alive === false) continue;
    const s = u.stats;
    total += s.hp + s.atk * 3.2 + s.def * 2 + s.spd * 4 + s.critRate * 2;
  }
  return Math.round(total);
}

/**
 * Amplify hard cap from ally−enemy power delta (before phase cap min).
 * Weak decks cannot wipe strong foes via board alone.
 */
export function amplifyCapFromPowerDelta(delta: number): number {
  if (delta < -250) return 1.1;
  if (delta < -100) return 1.18;
  return 1.25;
}
