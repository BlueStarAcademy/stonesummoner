/** Offline fusion recipes: sacrifice fodder → transform keeper into result. */

export interface FusionRecipeDef {
  id: string;
  nameKo: string;
  /** Multiset of required fodder monster ids (order does not matter). */
  fodderMonsterIds: string[];
  resultMonsterId: string;
  /** Optional mana cost (defaults applied in loop). */
  manaCost?: number;
}

export const FUSION_RECIPES: FusionRecipeDef[] = [
  {
    id: "recipe_seal_apprentice",
    nameKo: "봉인견습 합성",
    fodderMonsterIds: [
      "cinder_imp_fire",
      "dew_slime_water",
      "gale_bat_wind",
    ],
    resultMonsterId: "seal_apprentice_light",
    manaCost: 600,
  },
  {
    id: "recipe_magma_knight",
    nameKo: "용암기사 합성",
    fodderMonsterIds: ["wolf_fighter_fire", "steel_armor_water"],
    resultMonsterId: "magma_knight_fire",
    manaCost: 1200,
  },
  {
    id: "recipe_storm_spear",
    nameKo: "폭풍창술사 합성",
    fodderMonsterIds: [
      "magic_archer_fire",
      "lotus_dancer_wind",
      "capture_hound_dark",
    ],
    resultMonsterId: "storm_spearmaster_light",
    manaCost: 1800,
  },
];

export function getFusionRecipe(id: string): FusionRecipeDef | undefined {
  return FUSION_RECIPES.find((r) => r.id === id);
}
