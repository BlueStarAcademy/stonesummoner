import type { Unit } from "stonesummoner-combat";
import type { MonsterDef } from "stonesummoner-data";

/** Painted stills share a square frame — scale per family so silhouettes differ. */
const FAMILY_STATURE: Readonly<Record<string, number>> = {
  dew_slime: 0.66,
  cinder_imp: 0.7,
  forest_sprite: 0.72,
  gale_bat: 0.74,
  venom_stinger: 0.76,
  herb_alchemist: 0.8,
  crow_scout: 0.84,
  bone_thrall: 0.86,
  capture_hound: 0.86,
  lotus_dancer: 0.88,
  seal_apprentice: 0.9,
  dew_healer: 0.9,
  heal_priest: 0.92,
  frost_witch: 0.94,
  shadow_thief: 0.94,
  sand_lizard: 0.9,
  angel_healer: 0.96,
  eternal_healer: 0.98,
  rune_scholar: 0.98,
  seal_elder: 1,
  magic_archer: 1,
  scout_sniper: 1,
  shadow_assassin: 1,
  abyss_hexer: 1,
  demon_hexer: 1.02,
  holy_judge: 1.04,
  abyss_priest: 1.02,
  wolf_fighter: 1.06,
  mace_soldier: 1.08,
  thunder_spear: 1.08,
  flame_warrior: 1.1,
  abyss_pirate: 1.08,
  gale_rider: 1.06,
  storm_spearmaster: 1.12,
  magma_knight: 1.14,
  dragon_knight: 1.16,
  primordial_hierophant: 1.1,
  doom_oracle: 1.04,
  capture_lord: 1.06,
  mana_captor: 1.02,
  absolute_captor: 1.08,
  stone_fist: 1.14,
  moss_turtle: 1.16,
  sanctuary_guard: 1.16,
  stone_golem: 1.22,
  steel_armor: 1.2,
  golden_guardian: 1.22,
  wyrm_rider: 1.26,
  sky_warden: 1.3,
};

const ROLE_STATURE: Readonly<Record<string, number>> = {
  tank: 1.14,
  attacker: 1.06,
  support: 0.9,
  debuffer: 0.96,
  capturer: 0.98,
  stonesage: 1,
};

export function battleUnitStature(
  unit: Unit,
  def?: Pick<MonsterDef, "familyId" | "role"> | null,
  opts?: { boss?: boolean },
): number {
  if (opts?.boss) return 1;
  if (unit.kind === "summoner") return 0.9;
  const family = def?.familyId ? FAMILY_STATURE[def.familyId] : undefined;
  if (family != null) return family;
  const role = def?.role ? ROLE_STATURE[def.role] : undefined;
  return role ?? 1;
}
