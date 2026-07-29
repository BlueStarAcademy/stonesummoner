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
  listMonsterFamilies,
  resolveMonsterId,
  expandFamily,
  buildFamilySeeds,
} from "./monsters/index.js";
export type {
  MonsterDef,
  Element,
  MonsterRole,
  FamilySeed,
  ElementKit,
  Stats,
} from "./monsters/types.js";
