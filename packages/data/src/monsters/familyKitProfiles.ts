import type { MonsterRole } from "./types.js";

export type KitMechanic =
  | "heal"
  | "buff"
  | "debuff"
  | "dot"
  | "burn"
  | "poison"
  | "multi_hit"
  | "strip"
  | "cleanse"
  | "cc"
  | "hot"
  | "heal_block"
  | "silence"
  | "atb_gain"
  | "atb_drain"
  | "revive"
  | "cooldown_down"
  | "cooldown_up"
  | "damage_share"
  | "reflect"
  | "provoke"
  | "shield"
  | "mana"
  | "immunity";

export type PassiveImmunityKind =
  | "burn"
  | "poison"
  | "stun"
  | "freeze"
  | "sleep"
  | "silence"
  | "heal_block"
  | "dot";

export interface FamilySkillProfile {
  mechanic: KitMechanic;
  cooldown: number;
  damage: boolean;
}

export interface FamilyKitProfile {
  familyId: string;
  role: MonsterRole;
  s1: KitMechanic;
  s2: FamilySkillProfile;
  s3: FamilySkillProfile;
  /** Battle-start status immunities (not stone passives). */
  passiveImmunity?: readonly PassiveImmunityKind[];
}

const skill = (
  mechanic: KitMechanic,
  cooldown: number,
  damage = false,
): FamilySkillProfile => ({ mechanic, cooldown, damage });

const profile = (
  familyId: string,
  role: MonsterRole,
  s1: KitMechanic,
  s2: FamilySkillProfile,
  s3: FamilySkillProfile,
  passiveImmunity?: readonly PassiveImmunityKind[],
): FamilyKitProfile => ({
  familyId,
  role,
  s1,
  s2,
  s3,
  ...(passiveImmunity ? { passiveImmunity } : {}),
});

/**
 * Family-owned mechanical identity. Elemental composition and star-grade
 * utility upgrades are applied by kitFactory without increasing damage budgets.
 */
export const FAMILY_KIT_PROFILES: Readonly<Record<string, FamilyKitProfile>> = {
  stone_golem: profile("stone_golem", "defense", "provoke", skill("debuff", 2, true), skill("damage_share", 5)),
  forest_sprite: profile("forest_sprite", "support", "heal", skill("hot", 2), skill("revive", 6)),
  venom_stinger: profile("venom_stinger", "hp", "dot", skill("heal_block", 3, true), skill("dot", 5)),
  cinder_imp: profile("cinder_imp", "attacker", "debuff", skill("dot", 2, true), skill("cc", 4, true)),
  dew_slime: profile("dew_slime", "hp", "hot", skill("heal", 2), skill("cleanse", 4)),
  gale_bat: profile("gale_bat", "speed", "atb_gain", skill("atb_drain", 2, true), skill("silence", 4)),
  sand_lizard: profile("sand_lizard", "attacker", "debuff", skill("strip", 3, true), skill("dot", 4, true)),
  moss_turtle: profile("moss_turtle", "defense", "provoke", skill("shield", 3), skill("reflect", 5)),
  crow_scout: profile("crow_scout", "speed", "atb_gain", skill("strip", 2, true), skill("cooldown_up", 5)),
  bone_thrall: profile("bone_thrall", "attacker", "dot", skill("heal_block", 3, true), skill("atb_drain", 4, true)),

  mace_soldier: profile("mace_soldier", "defense", "debuff", skill("provoke", 2, true), skill("reflect", 4)),
  heal_priest: profile("heal_priest", "support", "heal", skill("cleanse", 2), skill("hot", 4)),
  magic_archer: profile("magic_archer", "attacker", "debuff", skill("silence", 3, true), skill("strip", 4, true)),
  shadow_thief: profile("shadow_thief", "hp", "atb_drain", skill("cooldown_up", 3, true), skill("silence", 5)),
  thunder_spear: profile("thunder_spear", "attacker", "atb_gain", skill("cc", 2, true), skill("atb_drain", 4, true)),
  frost_witch: profile("frost_witch", "hp", "cc", skill("debuff", 3, true), skill("heal_block", 5)),
  stone_fist: profile("stone_fist", "defense", "provoke", skill("atb_drain", 2, true), skill("shield", 4)),
  herb_alchemist: profile("herb_alchemist", "support", "heal", skill("hot", 3), skill("cleanse", 5)),
  capture_hound: profile("capture_hound", "speed", "atb_gain", skill("provoke", 2, true), skill("mana", 4)),
  seal_apprentice: profile("seal_apprentice", "hp", "silence", skill("mana", 3, true), skill("cooldown_up", 5)),

  flame_warrior: profile("flame_warrior", "attacker", "dot", skill("heal_block", 2, true), skill("reflect", 4, true)),
  abyss_pirate: profile("abyss_pirate", "attacker", "strip", skill("atb_drain", 3, true), skill("cooldown_up", 5, true)),
  gale_rider: profile("gale_rider", "speed", "atb_gain", skill("buff", 2, true), skill("atb_gain", 4)),
  sanctuary_guard: profile("sanctuary_guard", "defense", "provoke", skill("damage_share", 3), skill("cleanse", 5)),
  abyss_hexer: profile("abyss_hexer", "hp", "debuff", skill("silence", 2, true), skill("dot", 4)),
  dew_healer: profile("dew_healer", "support", "heal", skill("hot", 3), skill("cooldown_down", 5)),
  seal_elder: profile("seal_elder", "hp", "silence", skill("cooldown_up", 3, true), skill("mana", 4)),
  wolf_fighter: profile("wolf_fighter", "attacker", "debuff", skill("provoke", 2, true), skill("heal_block", 4, true)),
  lotus_dancer: profile("lotus_dancer", "support", "heal", skill("atb_gain", 3), skill("cleanse", 4)),
  scout_sniper: profile("scout_sniper", "speed", "debuff", skill("strip", 2, true), skill("silence", 5)),
  steel_armor: profile("steel_armor", "defense", "provoke", skill("reflect", 3), skill("damage_share", 5)),
  mana_captor: profile("mana_captor", "speed", "atb_gain", skill("mana", 2, true), skill("cooldown_up", 4)),

  magma_knight: profile("magma_knight", "attacker", "dot", skill("debuff", 2, true), skill("provoke", 4, true)),
  glacier_mage: profile("glacier_mage", "hp", "cc", skill("atb_drain", 3, true), skill("silence", 5)),
  storm_spearmaster: profile("storm_spearmaster", "speed", "atb_gain", skill("cc", 2, true), skill("cooldown_down", 4)),
  angel_healer: profile("angel_healer", "support", "heal", skill("shield", 3), skill("revive", 6)),
  demon_hexer: profile("demon_hexer", "hp", "heal_block", skill("strip", 4, true), skill("cooldown_up", 5)),
  rune_scholar: profile("rune_scholar", "support", "silence", skill("cooldown_down", 3), skill("mana", 4)),
  golden_guardian: profile("golden_guardian", "defense", "provoke", skill("shield", 2), skill("reflect", 5)),
  shadow_assassin: profile("shadow_assassin", "attacker", "debuff", skill("silence", 2, true), skill("strip", 4, true)),
  holy_judge: profile("holy_judge", "defense", "provoke", skill("heal_block", 3, true), skill("cleanse", 5)),
  abyss_priest: profile("abyss_priest", "support", "heal", skill("damage_share", 3), skill("hot", 5)),
  wyrm_rider: profile("wyrm_rider", "speed", "atb_gain", skill("dot", 2, true), skill("atb_drain", 4)),
  capture_lord: profile("capture_lord", "speed", "atb_gain", skill("cooldown_up", 3, true), skill("mana", 5)),

  dragon_knight: profile("dragon_knight", "defense", "provoke", skill("reflect", 2, true), skill("damage_share", 5)),
  primordial_hierophant: profile("primordial_hierophant", "support", "heal", skill("cooldown_down", 3), skill("revive", 6)),
  doom_oracle: profile("doom_oracle", "hp", "silence", skill("heal_block", 2, true), skill("cooldown_up", 5)),
  sky_warden: profile("sky_warden", "defense", "provoke", skill("shield", 3), skill("atb_drain", 5)),
  eternal_healer: profile("eternal_healer", "support", "heal", skill("hot", 2), skill("revive", 5)),
  absolute_captor: profile("absolute_captor", "speed", "atb_gain", skill("strip", 3, true), skill("silence", 6)),

  // --- Status-ailment showcase families (25) ---
  // 1★
  ember_wisp: profile("ember_wisp", "attacker", "burn", skill("burn", 2, true), skill("multi_hit", 4, true)),
  toxin_mite: profile("toxin_mite", "hp", "poison", skill("poison", 2, true), skill("multi_hit", 4, true)),
  ward_totem: profile("ward_totem", "defense", "provoke", skill("immunity", 3), skill("shield", 5), ["burn"]),
  rime_dart: profile("rime_dart", "speed", "cc", skill("cc", 3, true), skill("atb_drain", 5, true)),
  purify_finch: profile("purify_finch", "support", "cleanse", skill("hot", 2), skill("cleanse", 4)),
  // 2★
  blaze_hound: profile("blaze_hound", "attacker", "burn", skill("burn", 3, true), skill("heal_block", 5, true)),
  plague_toad: profile("plague_toad", "hp", "poison", skill("poison", 3, true), skill("debuff", 5, true)),
  iron_ward: profile("iron_ward", "defense", "provoke", skill("immunity", 3), skill("damage_share", 5), ["poison"]),
  mute_owl: profile("mute_owl", "speed", "silence", skill("silence", 3, true), skill("atb_drain", 5, true)),
  cleanse_monk: profile("cleanse_monk", "support", "heal", skill("cleanse", 3), skill("hot", 5)),
  // 3★
  spark_raptor: profile("spark_raptor", "attacker", "burn", skill("burn", 3, true), skill("multi_hit", 5, true)),
  fang_hydra: profile("fang_hydra", "hp", "poison", skill("poison", 3, true), skill("multi_hit", 5, true)),
  aegis_scarab: profile("aegis_scarab", "defense", "immunity", skill("shield", 3), skill("immunity", 5), ["burn", "poison"]),
  slumber_moth: profile("slumber_moth", "speed", "cc", skill("cc", 3, true), skill("silence", 5, true)),
  sanctum_dove: profile("sanctum_dove", "support", "cleanse", skill("cleanse", 3), skill("heal", 5)),
  // 4★
  inferno_colossus: profile("inferno_colossus", "attacker", "burn", skill("burn", 3, true), skill("burn", 5, true)),
  venom_tyrant: profile("venom_tyrant", "hp", "poison", skill("poison", 3, true), skill("poison", 5, true)),
  glacier_bastion: profile("glacier_bastion", "defense", "cc", skill("cc", 3, true), skill("provoke", 5, true)),
  hex_mute: profile("hex_mute", "speed", "silence", skill("heal_block", 3, true), skill("silence", 5, true)),
  purify_hierophant: profile("purify_hierophant", "support", "cleanse", skill("cleanse", 3), skill("immunity", 5)),
  // 5★
  flame_slaughter: profile("flame_slaughter", "attacker", "burn", skill("burn", 3, true), skill("multi_hit", 6, true)),
  poison_overlord: profile("poison_overlord", "hp", "poison", skill("poison", 3, true), skill("multi_hit", 6, true)),
  absolute_frost: profile("absolute_frost", "defense", "cc", skill("cc", 3, true), skill("immunity", 6), ["freeze"]),
  curse_catalyst: profile("curse_catalyst", "speed", "silence", skill("poison", 3, true), skill("silence", 6, true)),
  sanctuary_oracle: profile("sanctuary_oracle", "support", "cleanse", skill("immunity", 3), skill("cleanse", 6), ["stun", "silence"]),
};


export function familyKitProfile(familyId: string): FamilyKitProfile {
  const found = FAMILY_KIT_PROFILES[familyId];
  if (!found) throw new Error(`missing family kit profile: ${familyId}`);
  return found;
}
