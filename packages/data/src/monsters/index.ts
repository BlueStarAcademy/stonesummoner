import { STONE_PASSIVE_LABEL } from "../stonePassives.js";
import { baseStatsFor } from "./curves.js";
import { kitsForRole } from "./kitFactory.js";
import { FAMILY_ROSTER } from "./roster.js";
import {
  ELEMENTS,
  type FamilySeed,
  type MonsterDef,
  type Stats,
} from "./types.js";

function mon(partial: Omit<MonsterDef, "stonePassive">): MonsterDef {
  return {
    ...partial,
    stonePassive: STONE_PASSIVE_LABEL[partial.stonePassiveId],
  };
}

function mergeStats(base: Stats, patch?: Partial<Stats>): Stats {
  if (!patch) return { ...base };
  return {
    hp: base.hp + (patch.hp ?? 0),
    atk: base.atk + (patch.atk ?? 0),
    def: base.def + (patch.def ?? 0),
    spd: base.spd + (patch.spd ?? 0),
    critRate: base.critRate + (patch.critRate ?? 0),
    critDmg: base.critDmg + (patch.critDmg ?? 0),
    accuracy: base.accuracy + (patch.accuracy ?? 0),
    resistance: base.resistance + (patch.resistance ?? 0),
  };
}

export function expandFamily(seed: FamilySeed): MonsterDef[] {
  return ELEMENTS.map((element) => {
    const kit = seed.kits[element];
    return mon({
      id: `${seed.familyId}_${element}`,
      familyId: seed.familyId,
      nameKo: seed.nameKo,
      artKey: seed.artKey,
      element,
      naturalStars: seed.naturalStars,
      role: kit.role ?? seed.role,
      baseStats: mergeStats(seed.baseStats, kit.baseStats),
      skillCoeff: kit.skillCoeff,
      skills: kit.skills,
      stonePassiveId: kit.stonePassiveId ?? seed.stonePassiveId,
    });
  });
}

export function buildFamilySeeds(): FamilySeed[] {
  return FAMILY_ROSTER.map((entry) => ({
    familyId: entry.familyId,
    nameKo: entry.nameKo,
    artKey: entry.familyId,
    naturalStars: entry.naturalStars,
    role: entry.role,
    baseStats: baseStatsFor(entry.naturalStars, entry.role),
    stonePassiveId: entry.stonePassiveId,
    kits: kitsForRole(entry.role, entry.naturalStars),
  }));
}

/**
 * Phase 1 → Phase 2 id migration.
 * Old family / art keys resolve to a similar-role replacement.
 */
export const LEGACY_MONSTER_IDS: Readonly<Record<string, string>> = {
  // Art keys
  fire_fang: "wolf_fighter_fire",
  dew_healer: "dew_healer_water",
  gale_scout: "scout_sniper_wind",
  shield_tortoise: "steel_armor_water",
  ash_archer: "magic_archer_fire",
  mist_shaman: "lotus_dancer_wind",
  seal_scholar: "seal_elder_light",
  capture_hound: "capture_hound_dark",
  thunder_lancer: "thunder_spear_light",
  abyss_priest: "abyss_priest_dark",
  // Old family ids
  seokrang_fire: "wolf_fighter_fire",
  seokrang_water: "wolf_fighter_water",
  seokrang_wind: "wolf_fighter_wind",
  seokrang_light: "wolf_fighter_light",
  seokrang_dark: "wolf_fighter_dark",
  yeonhwa_fire: "dew_healer_fire",
  yeonhwa_water: "dew_healer_water",
  yeonhwa_wind: "dew_healer_wind",
  yeonhwa_light: "dew_healer_light",
  yeonhwa_dark: "dew_healer_dark",
  cheokhu_fire: "scout_sniper_fire",
  cheokhu_water: "scout_sniper_water",
  cheokhu_wind: "scout_sniper_wind",
  cheokhu_light: "scout_sniper_light",
  cheokhu_dark: "scout_sniper_dark",
  cheolgap_fire: "steel_armor_fire",
  cheolgap_water: "steel_armor_water",
  cheolgap_wind: "steel_armor_wind",
  cheolgap_light: "steel_armor_light",
  cheolgap_dark: "steel_armor_dark",
  myeongsa_fire: "magic_archer_fire",
  myeongsa_water: "magic_archer_water",
  myeongsa_wind: "magic_archer_wind",
  myeongsa_light: "magic_archer_light",
  myeongsa_dark: "magic_archer_dark",
  yeongmae_fire: "lotus_dancer_fire",
  yeongmae_water: "lotus_dancer_water",
  yeongmae_wind: "lotus_dancer_wind",
  yeongmae_light: "lotus_dancer_light",
  yeongmae_dark: "lotus_dancer_dark",
  jinmunsa_fire: "seal_elder_fire",
  jinmunsa_water: "seal_elder_water",
  jinmunsa_wind: "seal_elder_wind",
  jinmunsa_light: "seal_elder_light",
  jinmunsa_dark: "seal_elder_dark",
  pohwagyeon_fire: "capture_hound_fire",
  pohwagyeon_water: "capture_hound_water",
  pohwagyeon_wind: "capture_hound_wind",
  pohwagyeon_light: "capture_hound_light",
  pohwagyeon_dark: "capture_hound_dark",
  changsu_fire: "storm_spearmaster_fire",
  changsu_water: "storm_spearmaster_water",
  changsu_wind: "storm_spearmaster_wind",
  changsu_light: "storm_spearmaster_light",
  changsu_dark: "storm_spearmaster_dark",
  jegwan_fire: "abyss_priest_fire",
  jegwan_water: "abyss_priest_water",
  jegwan_wind: "abyss_priest_wind",
  jegwan_light: "abyss_priest_light",
  jegwan_dark: "abyss_priest_dark",
};

export function resolveMonsterId(id: string): string {
  return LEGACY_MONSTER_IDS[id] ?? id;
}

export const FAMILIES: FamilySeed[] = buildFamilySeeds();

export const MONSTERS: MonsterDef[] = FAMILIES.flatMap(expandFamily);

export function getMonster(id: string): MonsterDef | undefined {
  const resolved = resolveMonsterId(id);
  return MONSTERS.find((m) => m.id === resolved);
}

export function getMonsterArtKey(id: string | undefined | null): string | null {
  if (!id) return null;
  const def = getMonster(id);
  if (def) return def.artKey;
  return LEGACY_MONSTER_IDS[id] ? getMonster(id)?.artKey ?? id : id;
}

export function listMonsterFamilies(): {
  familyId: string;
  nameKo: string;
  naturalStars: number;
  artKey: string;
}[] {
  const seen = new Set<string>();
  const out: {
    familyId: string;
    nameKo: string;
    naturalStars: number;
    artKey: string;
  }[] = [];
  for (const m of MONSTERS) {
    if (seen.has(m.familyId)) continue;
    seen.add(m.familyId);
    out.push({
      familyId: m.familyId,
      nameKo: m.nameKo,
      naturalStars: m.naturalStars,
      artKey: m.artKey,
    });
  }
  return out;
}

export {
  ELEMENTS,
  type Element,
  type MonsterDef,
  type MonsterRole,
  type FamilySeed,
};
