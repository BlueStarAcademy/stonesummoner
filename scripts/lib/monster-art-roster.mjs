/**
 * Shared monster art roster for install / check / bake scripts.
 * artKey = catalog id `{familyId}_{element}`.
 */
export const ELEMENTS = ["fire", "water", "wind", "light", "dark"];

export const FAMILY_IDS = [
  "stone_golem", "forest_sprite", "venom_stinger", "cinder_imp", "dew_slime",
  "gale_bat", "sand_lizard", "moss_turtle", "crow_scout", "bone_thrall",
  "mace_soldier", "heal_priest", "magic_archer", "shadow_thief", "thunder_spear",
  "frost_witch", "stone_fist", "herb_alchemist", "capture_hound", "seal_apprentice",
  "flame_warrior", "abyss_pirate", "gale_rider", "sanctuary_guard", "abyss_hexer",
  "dew_healer", "seal_elder", "wolf_fighter", "lotus_dancer", "scout_sniper",
  "steel_armor", "mana_captor", "magma_knight", "glacier_mage", "storm_spearmaster",
  "angel_healer", "demon_hexer", "rune_scholar", "golden_guardian", "shadow_assassin",
  "holy_judge", "abyss_priest", "wyrm_rider", "capture_lord", "dragon_knight",
  "primordial_hierophant", "doom_oracle", "sky_warden", "eternal_healer", "absolute_captor",
  // Status-ailment showcase (25)
  "ember_wisp", "toxin_mite", "ward_totem", "rime_dart", "purify_finch",
  "blaze_hound", "plague_toad", "iron_ward", "mute_owl", "cleanse_monk",
  "spark_raptor", "fang_hydra", "aegis_scarab", "slumber_moth", "sanctum_dove",
  "inferno_colossus", "venom_tyrant", "glacier_bastion", "hex_mute", "purify_hierophant",
  "flame_slaughter", "poison_overlord", "absolute_frost", "curse_catalyst", "sanctuary_oracle",
];

/** All 375 monster art keys (family × element). */
export const MONSTER_ART_KEYS = FAMILY_IDS.flatMap((familyId) =>
  ELEMENTS.map((el) => `${familyId}_${el}`),
);

/** Pilot families for hand-painted QA pass. */
export const PILOT_FAMILIES = [
  "wolf_fighter",
  "moss_turtle",
  "heal_priest",
  "glacier_mage",
  "dragon_knight",
];

export function artKeysForFamilies(familyIds) {
  return familyIds.flatMap((familyId) =>
    ELEMENTS.map((el) => `${familyId}_${el}`),
  );
}

export function familyIdFromArtKey(artKey) {
  const idx = artKey.lastIndexOf("_");
  if (idx <= 0) return artKey;
  const maybeEl = artKey.slice(idx + 1);
  if (ELEMENTS.includes(maybeEl)) return artKey.slice(0, idx);
  return artKey;
}
