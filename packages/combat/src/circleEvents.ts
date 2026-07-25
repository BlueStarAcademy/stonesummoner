/** Module C — circle events (trial / mid-late content stub). */

export type CircleEventId =
  | "meteor"
  | "fog"
  | "bag_full"
  | "attr_tune"
  | "ko_bonus"
  | "tide";

export interface CircleEventDef {
  id: CircleEventId;
  nameKo: string;
}

export const CIRCLE_EVENTS: CircleEventDef[] = [
  { id: "meteor", nameKo: "운석낙하" },
  { id: "fog", nameKo: "안개" },
  { id: "bag_full", nameKo: "배낭만땅" },
  { id: "attr_tune", nameKo: "속성조율" },
  { id: "ko_bonus", nameKo: "패왕전" },
  { id: "tide", nameKo: "조수" },
];

/** Trigger roughly every N successful stone summons. */
export const CIRCLE_EVENT_INTERVAL = 8;

export function shouldRollCircleEvent(stoneSummonCount: number): boolean {
  return (
    stoneSummonCount > 0 && stoneSummonCount % CIRCLE_EVENT_INTERVAL === 0
  );
}

export function rollCircleEvent(
  rng: () => number = Math.random,
): CircleEventId {
  const i = Math.floor(rng() * CIRCLE_EVENTS.length) % CIRCLE_EVENTS.length;
  return CIRCLE_EVENTS[i]!.id;
}

export function circleEventName(id: CircleEventId): string {
  return CIRCLE_EVENTS.find((e) => e.id === id)?.nameKo ?? id;
}
