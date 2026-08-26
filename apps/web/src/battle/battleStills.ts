/**
 * Catalog artKeys with dedicated battle still paths.
 * All 250 monsters use `{familyId}_{element}` keys.
 */
import { MONSTER_ART_KEYS } from "stonesummoner-data";

export const BATTLE_STILL_ART_KEYS: readonly string[] = MONSTER_ART_KEYS;

export const BATTLE_STILL_ART_KEY_SET = new Set<string>(BATTLE_STILL_ART_KEYS);

/** @deprecated use BATTLE_STILL_ART_KEYS */
export const BATTLE_STILL_FAMILIES = BATTLE_STILL_ART_KEYS;

/** @deprecated use BATTLE_STILL_ART_KEY_SET */
export const BATTLE_STILL_FAMILY_SET = BATTLE_STILL_ART_KEY_SET;
