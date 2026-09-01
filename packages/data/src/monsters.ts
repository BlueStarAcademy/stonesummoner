/**
 * Monster catalog — Phase 2 expandable roster.
 * Implementation lives in `./monsters/` (curves, kits, roster packs).
 */
export {
  MONSTERS,
  ELEMENTS,
  FAMILIES,
  LEGACY_MONSTER_IDS,
  getMonster,
  getMonsterArtKey,
  getMonsterFamilyArtKey,
  MONSTER_ART_KEYS,
  listMonsterFamilies,
  resolveMonsterId,
  expandFamily,
  buildFamilySeeds,
  FAMILY_KIT_PROFILES,
  familyKitProfile,
} from "./monsters/index.js";
export type {
  BalanceArchetype,
  CombatTag,
  FamilyIdentity,
  MonsterDef,
  Element,
  MonsterRole,
  FamilySeed,
  ElementKit,
  Stats,
} from "./monsters/types.js";
export type {
  FamilyKitProfile,
  FamilySkillProfile,
  KitMechanic,
} from "./monsters/familyKitProfiles.js";
