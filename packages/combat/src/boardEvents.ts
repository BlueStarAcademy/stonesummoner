export type BoardEventKind =
  | "safe_place"
  | "capture_small"
  | "capture_large"
  | "item_magnet";

export interface BoardEventGains {
  /** Persistent battle Amplify (국면감). Capture uses a small tick only. */
  amplifyDelta: number;
  /**
   * Temporary team damage bonus used by item_magnet.
   */
  skillAmplifyBonus: number;
  /**
   * Flat mana for safe place / items. Capture mana is applied in Battle as
   * `manaMax × CAPTURE_MANA_FRAC_PER_STONE × capturedCount` (not via this field).
   */
  mana: number;
  /** Team damage bonus until immediately before its next stone placement. */
  captureDamageBonus: number;
  /** Mana as fraction of manaMax from captures: `CAPTURE_MANA_FRAC_PER_STONE × N`. */
  captureManaFrac: number;
}

/** Per captured stone: +18% team damage for the current board cycle. */
export const CAPTURE_DAMAGE_PER_STONE = 0.18;
/** Per captured stone: +20%p summoner mana gauge. */
export const CAPTURE_MANA_FRAC_PER_STONE = 0.2;
/** @deprecated Use CAPTURE_DAMAGE_PER_STONE. */
export const CAPTURE_BONUS_PER_STONE = CAPTURE_DAMAGE_PER_STONE;
/** Flat mana on a normal (non-capture) stone. */
export const SAFE_PLACE_MANA = 10;

export function gainsForBoardEvent(
  kind: BoardEventKind,
  capturedCount: number,
  manaMul = 1,
): BoardEventGains {
  if (kind === "item_magnet") {
    return {
      amplifyDelta: 0,
      skillAmplifyBonus: 0.14,
      mana: 35 * manaMul,
      captureDamageBonus: 0,
      captureManaFrac: 0,
    };
  }
  const n = Math.max(0, capturedCount);
  if (kind === "capture_large" || kind === "capture_small" || n >= 1) {
    return {
      amplifyDelta: 0,
      skillAmplifyBonus: 0,
      mana: 0,
      captureDamageBonus: CAPTURE_DAMAGE_PER_STONE * n,
      captureManaFrac: CAPTURE_MANA_FRAC_PER_STONE * n,
    };
  }
  return {
    amplifyDelta: 0,
    skillAmplifyBonus: 0,
    mana: SAFE_PLACE_MANA * manaMul,
    captureDamageBonus: 0,
    captureManaFrac: 0,
  };
}

export function classifyCapture(capturedCount: number): BoardEventKind {
  if (capturedCount >= 3) return "capture_large";
  if (capturedCount >= 1) return "capture_small";
  return "safe_place";
}

