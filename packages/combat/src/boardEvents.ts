export type BoardEventKind =
  | "safe_place"
  | "capture_small"
  | "capture_large"
  | "item_magnet";

export interface BoardEventGains {
  /** Persistent battle Amplify (국면감). Capture uses a small tick only. */
  amplifyDelta: number;
  /**
   * @deprecated Capture no longer grants skill Amplify — use
   * `pendingCaptureDamageBonus` (N×10% on next monster hit) instead.
   * Kept for item_magnet / shape bonuses.
   */
  skillAmplifyBonus: number;
  /**
   * Flat mana for safe place / items. Capture mana is applied in Battle as
   * `manaMax × 0.10 × capturedCount` (not via this field).
   */
  mana: number;
  /** Damage multiplier bonus for the next monster attack: `0.10 × N`. */
  captureDamageBonus: number;
  /** Mana as fraction of manaMax from captures: `0.10 × N`. */
  captureManaFrac: number;
}

/** Per captured stone: +10% next-monster damage and +10%p mana gauge. */
export const CAPTURE_BONUS_PER_STONE = 0.1;

export function gainsForBoardEvent(
  kind: BoardEventKind,
  capturedCount: number,
  manaMul = 1,
): BoardEventGains {
  if (kind === "item_magnet") {
    return {
      amplifyDelta: 0.05,
      skillAmplifyBonus: 0.08,
      mana: 35 * manaMul,
      captureDamageBonus: 0,
      captureManaFrac: 0,
    };
  }
  const n = Math.max(0, capturedCount);
  if (kind === "capture_large" || kind === "capture_small" || n >= 1) {
    return {
      // Mild persistent Amp only — main payoff is N×10% damage + mana.
      amplifyDelta: n >= 3 ? 0.03 : 0.02,
      skillAmplifyBonus: 0,
      mana: 0,
      captureDamageBonus: CAPTURE_BONUS_PER_STONE * n,
      captureManaFrac: CAPTURE_BONUS_PER_STONE * n,
    };
  }
  return {
    amplifyDelta: 0.01,
    skillAmplifyBonus: 0,
    mana: 3 * manaMul,
    captureDamageBonus: 0,
    captureManaFrac: 0,
  };
}

export function classifyCapture(capturedCount: number): BoardEventKind {
  if (capturedCount >= 3) return "capture_large";
  if (capturedCount >= 1) return "capture_small";
  return "safe_place";
}
