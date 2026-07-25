/** Module D — capture shop choices after large captures. */

export type CaptureShopChoice = "mana" | "amplify" | "cleanse";

export interface CaptureShopOffer {
  choice: CaptureShopChoice;
  labelKo: string;
  mana?: number;
  amplifyDelta?: number;
}

export const CAPTURE_SHOP_THRESHOLD = 3;

export function captureShopOffers(): CaptureShopOffer[] {
  return [
    { choice: "mana", labelKo: "마나 충전", mana: 40 },
    { choice: "amplify", labelKo: "Amplify 강화", amplifyDelta: 0.08 },
    { choice: "cleanse", labelKo: "청소(실드)", mana: 10 },
  ];
}

export function pickCaptureShopChoice(
  rng: () => number = Math.random,
): CaptureShopChoice {
  const offers = captureShopOffers();
  return offers[Math.floor(rng() * offers.length) % offers.length]!.choice;
}
