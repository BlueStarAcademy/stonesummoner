/**
 * Combat tune vs Summoners War.
 *
 * Symbol tables already use SW rune flats (6★ HP+ +15 = 2448).
 * Monster bases were toy-scale (HP ~300, ATK ~120, DEF ~35), so HP/ATK
 * sat near 2 and DEF barely mitigated. Early SW PvE is about 6–10 S1 hits.
 *
 * SKILL_DMG_MUL lifts kit coefficients (~1.15 S1 → ~3.7, SW 370%).
 */
export const SKILL_DMG_MUL = 3.2;
