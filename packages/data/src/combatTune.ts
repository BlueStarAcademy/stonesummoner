/**
 * Combat tune vs Summoners War.
 *
 * Symbol tables already use SW rune flats (6★ HP+ +15 = 2448).
 * Monster bases were toy-scale (HP ~300, ATK ~120, DEF ~35), so HP/ATK
 * sat near 2 and DEF barely mitigated. Early SW PvE is about 6–10 S1 hits.
 *
 * SKILL_DMG_MUL lifts kit coefficients (~1.15 S1 → ~3.7, SW 370%).
 */
export const SKILL_DMG_MUL = 3.4;

/** Early scenario enemies were too spongy vs starter symbols. */
export function scenarioEnemyHpMul(stage: {
  mode: string;
  map: number;
}): number {
  if (stage.mode !== "scenario") return 1;
  if (stage.map <= 1) return 0.75;
  if (stage.map <= 2) return 0.88;
  if (stage.map <= 3) return 0.94;
  return 1;
}
