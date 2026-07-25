export type BoardEventKind = "safe_place" | "capture_small" | "capture_large" | "item_magnet";

export interface BoardEventGains {
  amplifyDelta: number;
  /** Applied to this skill only (then decay). */
  skillAmplifyBonus: number;
  mana: number;
}

export function gainsForBoardEvent(
  kind: BoardEventKind,
  capturedCount: number,
  manaMul = 1,
): BoardEventGains {
  if (kind === "item_magnet") {
    return { amplifyDelta: 0.05, skillAmplifyBonus: 0.08, mana: 35 * manaMul };
  }
  if (kind === "capture_large" || capturedCount >= 3) {
    return {
      amplifyDelta: 0.08,
      skillAmplifyBonus: 0.15,
      mana: 22 * manaMul,
    };
  }
  if (kind === "capture_small" || capturedCount >= 1) {
    return {
      amplifyDelta: 0.04,
      skillAmplifyBonus: 0.08,
      mana: 10 * manaMul,
    };
  }
  return { amplifyDelta: 0.01, skillAmplifyBonus: 0, mana: 3 * manaMul };
}

export function classifyCapture(capturedCount: number): BoardEventKind {
  if (capturedCount >= 3) return "capture_large";
  if (capturedCount >= 1) return "capture_small";
  return "safe_place";
}
