/** Combination recipes: consume listed fodder → grant a new result monster (SW Fusion Hexagram). */

export interface FusionRecipeDef {
  id: string;
  nameKo: string;
  /** Multiset of required fodder monster ids (order does not matter). */
  fodderMonsterIds: string[];
  resultMonsterId: string;
  /** Optional mana cost (defaults applied in loop). */
  manaCost?: number;
  /** Summoner level required to attempt this recipe. */
  unlockSummonerLevel?: number;
  /** Result (and its family) is withheld from scroll summons. */
  fusionOnly?: boolean;
}

export const FUSION_RECIPES: FusionRecipeDef[] = [
  {
    id: "recipe_mace_soldier",
    nameKo: "철퇴병 조합",
    fodderMonsterIds: [
      "stone_golem_fire",
      "forest_sprite_water",
      "venom_stinger_wind",
    ],
    resultMonsterId: "mace_soldier_fire",
    manaCost: 400,
    unlockSummonerLevel: 1,
  },
  {
    id: "recipe_magma_knight",
    nameKo: "용암기사 조합",
    fodderMonsterIds: [
      "wolf_fighter_fire",
      "steel_armor_water",
      "flame_warrior_fire",
    ],
    resultMonsterId: "magma_knight_fire",
    manaCost: 1200,
    unlockSummonerLevel: 8,
    fusionOnly: true,
  },
  {
    id: "recipe_storm_spear",
    nameKo: "폭풍창술사 조합",
    fodderMonsterIds: [
      "magic_archer_fire",
      "lotus_dancer_wind",
      "capture_hound_dark",
    ],
    resultMonsterId: "storm_spearmaster_light",
    manaCost: 1800,
    unlockSummonerLevel: 10,
    fusionOnly: true,
  },
  {
    id: "recipe_dragon_knight",
    nameKo: "고룡기사 조합",
    fodderMonsterIds: [
      "magma_knight_fire",
      "storm_spearmaster_light",
      "golden_guardian_wind",
    ],
    resultMonsterId: "dragon_knight_fire",
    manaCost: 4000,
    unlockSummonerLevel: 17,
    fusionOnly: true,
  },
];

export const FUSION_ONLY_FAMILY_IDS: readonly string[] = [
  ...new Set(
    FUSION_RECIPES.filter((r) => r.fusionOnly).map((r) => {
      const id = r.resultMonsterId;
      const cut = id.lastIndexOf("_");
      return cut > 0 ? id.slice(0, cut) : id;
    }),
  ),
];

const FUSION_ONLY_FAMILY_SET = new Set(FUSION_ONLY_FAMILY_IDS);

export function isFusionOnlyFamily(familyId: string): boolean {
  return FUSION_ONLY_FAMILY_SET.has(familyId);
}

export function getFusionRecipe(id: string): FusionRecipeDef | undefined {
  return FUSION_RECIPES.find((r) => r.id === id);
}

export type FusionFodderCount = {
  monsterId: string;
  need: number;
  have: number;
};

export type FusionFodderPlan = {
  ok: boolean;
  fodderUids: string[];
  counts: FusionFodderCount[];
};

/** Pick distinct roster uids matching the recipe multiset. */
export function planFusionRecipe(
  roster: readonly { uid: string; monsterId: string }[],
  recipe: FusionRecipeDef,
): FusionFodderPlan {
  const needCounts = new Map<string, number>();
  for (const id of recipe.fodderMonsterIds) {
    needCounts.set(id, (needCounts.get(id) ?? 0) + 1);
  }
  const available = new Map<string, string[]>();
  for (const m of roster) {
    const list = available.get(m.monsterId) ?? [];
    list.push(m.uid);
    available.set(m.monsterId, list);
  }
  const fodderUids: string[] = [];
  let ok = true;
  const counts: FusionFodderCount[] = [];
  for (const [id, need] of needCounts) {
    const pool = [...(available.get(id) ?? [])];
    const have = pool.length;
    counts.push({ monsterId: id, need, have });
    if (have < need) ok = false;
    else {
      for (let n = 0; n < need; n++) fodderUids.push(pool.shift()!);
    }
  }
  return { ok, fodderUids, counts };
}
