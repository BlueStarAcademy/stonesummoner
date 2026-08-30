import type { PlayerSave } from "stonesummoner-loop";

export type FeatureUnlockKind = "building" | "hub" | "summoner";

export type FeatureUnlockEvent = {
  id: string;
  kind: FeatureUnlockKind;
  iconSrc: string;
  titleKey: string;
  /** Overrides the {name} token in ui.featureUnlock.body. */
  nameKey?: string;
  confirmKey?: string;
};

const pending: FeatureUnlockEvent[] = [];
let active: FeatureUnlockEvent | null = null;

export function hasSeenFeatureUnlock(save: PlayerSave, id: string): boolean {
  return (save.seenFeatureUnlockIds ?? []).includes(id);
}

export function markFeatureUnlockSeen(
  save: PlayerSave,
  id: string,
): PlayerSave {
  const seen = save.seenFeatureUnlockIds ?? [];
  if (seen.includes(id)) return save;
  return { ...save, seenFeatureUnlockIds: [...seen, id] };
}

export function enqueueFeatureUnlock(
  save: PlayerSave,
  event: FeatureUnlockEvent,
): boolean {
  if (hasSeenFeatureUnlock(save, event.id)) return false;
  if (
    active?.id === event.id ||
    pending.some((e) => e.id === event.id)
  ) {
    return false;
  }
  pending.push(event);
  return true;
}

export function activeFeatureUnlock(): FeatureUnlockEvent | null {
  return active;
}

export function beginNextFeatureUnlock(): FeatureUnlockEvent | null {
  if (active) return active;
  active = pending.shift() ?? null;
  return active;
}

export function dismissActiveFeatureUnlock(): FeatureUnlockEvent | null {
  const done = active;
  active = null;
  return done;
}

export function pendingFeatureUnlockCount(): number {
  return pending.length + (active ? 1 : 0);
}

export function clearFeatureUnlockQueue(): void {
  pending.length = 0;
  active = null;
}

export function buildingUnlockEventId(id: string): string {
  return `building:${id}`;
}

export function hubUnlockEventId(id: string): string {
  return `hub:${id}`;
}

export function summonerUnlockEventId(el: string): string {
  return `summoner:${el}`;
}
