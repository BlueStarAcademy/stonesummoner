import { getMonsterFamilyArtKey } from "stonesummoner-data";

/** Inventory portraits that need a tighter fit — slot CSS scales these down slightly. */
export const COMPACT_SLOT_FAMILIES = new Set(["dew_slime"]);

/** @deprecated Use COMPACT_SLOT_FAMILIES */
export const LOW_FRAMED_SLOT_FAMILIES = COMPACT_SLOT_FAMILIES;

export function monsterSlotFamilyId(
  monsterId: string | undefined | null,
): string {
  if (!monsterId) return "";
  return getMonsterFamilyArtKey(monsterId) ?? "";
}

/** ` data-art-family="…"` for slot hosts; empty when unknown. */
export function monsterSlotFamilyAttr(
  monsterId: string | undefined | null,
): string {
  const family = monsterSlotFamilyId(monsterId);
  return family ? ` data-art-family="${family}"` : "";
}
