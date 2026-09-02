import { familyKitProfile } from "./familyKitProfiles.js";
import type {
  BalanceArchetype,
  CombatTag,
  FamilyRosterEntry,
} from "./types.js";

/** Compact Phase 2 roster — 75 families. artKey per element = `{familyId}_{element}`. */
const LEGACY_FAMILY_ROSTER: readonly {
  familyId: string;
  nameKo: string;
  naturalStars: number;
  role: BalanceArchetype;
  stonePassiveId: FamilyRosterEntry["stonePassiveId"];
}[] = [
  // 1★
  { familyId: "stone_golem", nameKo: "돌골렘", naturalStars: 1, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "forest_sprite", nameKo: "숲요정", naturalStars: 1, role: "support", stonePassiveId: "shield_core_heal" },
  { familyId: "venom_stinger", nameKo: "독침벌", naturalStars: 1, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "cinder_imp", nameKo: "불씨임프", naturalStars: 1, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "dew_slime", nameKo: "이슬슬라임", naturalStars: 1, role: "support", stonePassiveId: "stone_ally_heal" },
  { familyId: "gale_bat", nameKo: "바람박쥐", naturalStars: 1, role: "debuffer", stonePassiveId: "stone_ally_atb" },
  { familyId: "sand_lizard", nameKo: "모래도마뱀", naturalStars: 1, role: "attacker", stonePassiveId: "crit_charm_plus" },
  { familyId: "moss_turtle", nameKo: "이끼거북", naturalStars: 1, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "crow_scout", nameKo: "까마귀정찰", naturalStars: 1, role: "capturer", stonePassiveId: "capture_mana" },
  { familyId: "bone_thrall", nameKo: "뼈하인", naturalStars: 1, role: "attacker", stonePassiveId: "stone_amp_proc" },
  // 2★
  { familyId: "mace_soldier", nameKo: "철퇴병", naturalStars: 2, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "heal_priest", nameKo: "치유사제", naturalStars: 2, role: "support", stonePassiveId: "shield_core_heal" },
  { familyId: "magic_archer", nameKo: "마법궁수", naturalStars: 2, role: "attacker", stonePassiveId: "crit_charm_plus" },
  { familyId: "shadow_thief", nameKo: "암영도적", naturalStars: 2, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "thunder_spear", nameKo: "번개창병", naturalStars: 2, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "frost_witch", nameKo: "서리무녀", naturalStars: 2, role: "debuffer", stonePassiveId: "suggest_plus" },
  { familyId: "stone_fist", nameKo: "석화장사", naturalStars: 2, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "herb_alchemist", nameKo: "약초술사", naturalStars: 2, role: "support", stonePassiveId: "stone_ally_heal" },
  { familyId: "capture_hound", nameKo: "포획사냥개", naturalStars: 2, role: "capturer", stonePassiveId: "capture_mana" },
  { familyId: "seal_apprentice", nameKo: "봉인견습", naturalStars: 2, role: "stonesage", stonePassiveId: "suggest_plus" },
  // 3★
  { familyId: "flame_warrior", nameKo: "화염무사", naturalStars: 3, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "abyss_pirate", nameKo: "심해해적", naturalStars: 3, role: "attacker", stonePassiveId: "stone_amp_proc" },
  { familyId: "gale_rider", nameKo: "질풍기수", naturalStars: 3, role: "attacker", stonePassiveId: "stone_ally_atb" },
  { familyId: "sanctuary_guard", nameKo: "성역수호", naturalStars: 3, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "abyss_hexer", nameKo: "심연주술사", naturalStars: 3, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "dew_healer", nameKo: "이슬치유사", naturalStars: 3, role: "support", stonePassiveId: "shield_core_heal" },
  { familyId: "seal_elder", nameKo: "석인장로", naturalStars: 3, role: "stonesage", stonePassiveId: "suggest_plus" },
  { familyId: "wolf_fighter", nameKo: "늑대전사", naturalStars: 3, role: "attacker", stonePassiveId: "crit_charm_plus" },
  { familyId: "lotus_dancer", nameKo: "연꽃무희", naturalStars: 3, role: "support", stonePassiveId: "stone_ally_heal" },
  { familyId: "scout_sniper", nameKo: "척후저격수", naturalStars: 3, role: "debuffer", stonePassiveId: "capture_crit" },
  { familyId: "steel_armor", nameKo: "강철기갑", naturalStars: 3, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "mana_captor", nameKo: "마나포획자", naturalStars: 3, role: "capturer", stonePassiveId: "capture_mana" },
  // 4★
  { familyId: "magma_knight", nameKo: "용암기사", naturalStars: 4, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "glacier_mage", nameKo: "빙하마법사", naturalStars: 4, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "storm_spearmaster", nameKo: "폭풍창술사", naturalStars: 4, role: "attacker", stonePassiveId: "stone_ally_atb" },
  { familyId: "angel_healer", nameKo: "천사치유사", naturalStars: 4, role: "support", stonePassiveId: "shield_core_heal" },
  { familyId: "demon_hexer", nameKo: "악마주술사", naturalStars: 4, role: "debuffer", stonePassiveId: "suggest_plus" },
  { familyId: "rune_scholar", nameKo: "룬학자", naturalStars: 4, role: "stonesage", stonePassiveId: "suggest_plus" },
  { familyId: "golden_guardian", nameKo: "황금수호자", naturalStars: 4, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "shadow_assassin", nameKo: "그림자암살자", naturalStars: 4, role: "attacker", stonePassiveId: "crit_charm_plus" },
  { familyId: "holy_judge", nameKo: "신성심판관", naturalStars: 4, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "abyss_priest", nameKo: "심연사제", naturalStars: 4, role: "debuffer", stonePassiveId: "stone_amp_proc" },
  { familyId: "wyrm_rider", nameKo: "비룡기수", naturalStars: 4, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "capture_lord", nameKo: "포획지배자", naturalStars: 4, role: "capturer", stonePassiveId: "capture_mana" },
  // 5★
  { familyId: "dragon_knight", nameKo: "고룡기사", naturalStars: 5, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "primordial_hierophant", nameKo: "태초제사장", naturalStars: 5, role: "stonesage", stonePassiveId: "suggest_plus" },
  { familyId: "doom_oracle", nameKo: "종말예언자", naturalStars: 5, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "sky_warden", nameKo: "천공수호룡", naturalStars: 5, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "eternal_healer", nameKo: "영원의치유사", naturalStars: 5, role: "support", stonePassiveId: "shield_core_heal" },
  { familyId: "absolute_captor", nameKo: "절대포획자", naturalStars: 5, role: "capturer", stonePassiveId: "capture_mana" },

  // Status-ailment showcase (25)
  // 1★
  { familyId: "ember_wisp", nameKo: "불씨위습", naturalStars: 1, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "toxin_mite", nameKo: "독진드기", naturalStars: 1, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "ward_totem", nameKo: "수호토템", naturalStars: 1, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "rime_dart", nameKo: "서리침", naturalStars: 1, role: "debuffer", stonePassiveId: "stone_ally_atb" },
  { familyId: "purify_finch", nameKo: "정화핀치", naturalStars: 1, role: "support", stonePassiveId: "shield_core_heal" },
  // 2★
  { familyId: "blaze_hound", nameKo: "작열사냥개", naturalStars: 2, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "plague_toad", nameKo: "역병두꺼비", naturalStars: 2, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "iron_ward", nameKo: "철벽수호", naturalStars: 2, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "mute_owl", nameKo: "침묵올빼미", naturalStars: 2, role: "debuffer", stonePassiveId: "suggest_plus" },
  { familyId: "cleanse_monk", nameKo: "정화승", naturalStars: 2, role: "support", stonePassiveId: "stone_ally_heal" },
  // 3★
  { familyId: "spark_raptor", nameKo: "불꽃랩터", naturalStars: 3, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "fang_hydra", nameKo: "독니히드라", naturalStars: 3, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "aegis_scarab", nameKo: "아이기스갑충", naturalStars: 3, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "slumber_moth", nameKo: "동면나방", naturalStars: 3, role: "debuffer", stonePassiveId: "stone_ally_atb" },
  { familyId: "sanctum_dove", nameKo: "성역비둘기", naturalStars: 3, role: "support", stonePassiveId: "shield_core_heal" },
  // 4★
  { familyId: "inferno_colossus", nameKo: "지옥거상", naturalStars: 4, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "venom_tyrant", nameKo: "맹독군주", naturalStars: 4, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "glacier_bastion", nameKo: "빙하요새", naturalStars: 4, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "hex_mute", nameKo: "봉인저주", naturalStars: 4, role: "debuffer", stonePassiveId: "suggest_plus" },
  { familyId: "purify_hierophant", nameKo: "정화대제사장", naturalStars: 4, role: "support", stonePassiveId: "shield_core_heal" },
  // 5★
  { familyId: "flame_slaughter", nameKo: "화염학살자", naturalStars: 5, role: "attacker", stonePassiveId: "capture_crit" },
  { familyId: "poison_overlord", nameKo: "독군주", naturalStars: 5, role: "debuffer", stonePassiveId: "capture_amp" },
  { familyId: "absolute_frost", nameKo: "절대빙결", naturalStars: 5, role: "tank", stonePassiveId: "high_amp_dr" },
  { familyId: "curse_catalyst", nameKo: "저주촉매", naturalStars: 5, role: "debuffer", stonePassiveId: "suggest_plus" },
  { familyId: "sanctuary_oracle", nameKo: "성역예언자", naturalStars: 5, role: "support", stonePassiveId: "shield_core_heal" },
] as const;

function inferredCombatTags(
  balanceArchetype: BalanceArchetype,
): readonly CombatTag[] {
  const focus: CombatTag =
    balanceArchetype === "attacker"
      ? "damage"
      : balanceArchetype === "support"
        ? "healer"
        : balanceArchetype === "tank"
          ? "protector"
          : balanceArchetype === "capturer"
            ? "turn_cycle"
            : "control";
  return [balanceArchetype, focus];
}

export const FAMILY_ROSTER: readonly FamilyRosterEntry[] =
  LEGACY_FAMILY_ROSTER.map(({ role: balanceArchetype, ...entry }) => ({
    ...entry,
    role: familyKitProfile(entry.familyId).role,
    balanceArchetype,
    familyIdentity: balanceArchetype,
    combatTags: inferredCombatTags(balanceArchetype),
  }));
