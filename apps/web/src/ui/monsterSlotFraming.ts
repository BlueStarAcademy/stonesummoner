import { getMonsterFamilyArtKey } from "stonesummoner-data";

/** Inventory portraits that sit low on the sheet — slot CSS nudges these up slightly. */
export const LOW_FRAMED_SLOT_FAMILIES = new Set(["dew_slime"]);

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
