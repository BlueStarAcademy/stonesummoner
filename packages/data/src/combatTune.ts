/**
 * Combat tune vs Summoners War.
 *
 * Symbol tables already use SW rune flats (6★ HP+ +15 = 2448).
 * Monster skill kits store SW-percentage coeffs directly (3.7 = 370% ATK).
 *
 * SKILL_DMG_MUL remains for systems that still author "toy" fractions
 * (summoner magic damage skills, counter/reflect stubs) and lifts them
 * onto the same ~SW percentage band.
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
