/** Scripted offline arena rival decks (fixed enemy monster id lists). */

export interface ArenaRivalDeck {
  id: string;
  nameKo: string;
  enemyMonsterIds: string[];
}

export const ARENA_RIVAL_DECKS: ArenaRivalDeck[] = [
  {
    id: "rival_rookies",
    nameKo: "신입 라이벌",
    enemyMonsterIds: [
      "cinder_imp_fire",
      "dew_slime_water",
      "gale_bat_wind",
    ],
  },
  {
    id: "rival_guard",
    nameKo: "수호 라이벌",
    enemyMonsterIds: [
      "steel_armor_water",
      "dew_healer_water",
      "scout_sniper_wind",
      "wolf_fighter_fire",
    ],
  },
  {
    id: "rival_storm",
    nameKo: "질풍 라이벌",
    enemyMonsterIds: [
      "storm_spearmaster_light",
      "lotus_dancer_wind",
      "magic_archer_fire",
    ],
  },
  {
    id: "rival_abyss",
    nameKo: "심연 라이벌",
    enemyMonsterIds: [
      "abyss_priest_dark",
      "capture_hound_dark",
      "seal_elder_light",
      "steel_armor_water",
    ],
  },
  {
    id: "rival_legend",
    nameKo: "전설 라이벌",
    enemyMonsterIds: [
      "dragon_knight_fire",
      "eternal_healer_water",
      "sky_warden_wind",
      "doom_oracle_dark",
    ],
  },
];

export function getArenaRivalDeck(id: string): ArenaRivalDeck | undefined {
  return ARENA_RIVAL_DECKS.find((d) => d.id === id);
}

/** Pick a rival by seeded index (stable per day + stage). */
export function pickArenaRival(
  seed: string,
  rng: () => number = Math.random,
): ArenaRivalDeck {
  if (ARENA_RIVAL_DECKS.length === 0) {
    return {
      id: "rival_empty",
      nameKo: "빈 덱",
      enemyMonsterIds: ["cinder_imp_fire"],
    };
  }
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const idx =
    ARENA_RIVAL_DECKS.length > 0
      ? (h + Math.floor(rng() * ARENA_RIVAL_DECKS.length)) %
        ARENA_RIVAL_DECKS.length
      : 0;
  return ARENA_RIVAL_DECKS[idx]!;
}
