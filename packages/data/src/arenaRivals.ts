/** Scripted offline arena rival decks (fixed enemy monster id lists). */

export type ArenaRivalSummonerElement =
  | "fire"
  | "water"
  | "wind"
  | "light"
  | "dark";

export interface ArenaRivalDeck {
  id: string;
  nameKo: string;
  enemyMonsterIds: string[];
  summonerElement: ArenaRivalSummonerElement;
}

export const ARENA_RIVAL_DECKS: ArenaRivalDeck[] = [
  {
    id: "rival_rookies",
    nameKo: "신입 라이벌",
    summonerElement: "wind",
    enemyMonsterIds: [
      "cinder_imp_fire",
      "dew_slime_water",
      "gale_bat_wind",
    ],
  },
  {
    id: "rival_guard",
    nameKo: "수호 라이벌",
    summonerElement: "water",
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
    summonerElement: "light",
    enemyMonsterIds: [
      "storm_spearmaster_light",
      "lotus_dancer_wind",
      "magic_archer_fire",
    ],
  },
  {
    id: "rival_abyss",
    nameKo: "심연 라이벌",
    summonerElement: "dark",
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
    summonerElement: "fire",
    enemyMonsterIds: [
      "dragon_knight_fire",
      "eternal_healer_water",
      "sky_warden_wind",
      "doom_oracle_dark",
    ],
  },
];

/** World arena rival decks (higher-tier monsters from warena roster). */
export const WORLD_ARENA_RIVAL_DECKS: ArenaRivalDeck[] = [
  {
    id: "warena_balanced",
    nameKo: "균형 라이벌",
    summonerElement: "light",
    enemyMonsterIds: [
      "storm_spearmaster_light",
      "lotus_dancer_wind",
      "magic_archer_fire",
      "abyss_priest_dark",
    ],
  },
  {
    id: "warena_burst",
    nameKo: "속공 라이벌",
    summonerElement: "fire",
    enemyMonsterIds: [
      "magic_archer_fire",
      "storm_spearmaster_light",
      "capture_hound_dark",
      "lotus_dancer_wind",
    ],
  },
  {
    id: "warena_control",
    nameKo: "통제 라이벌",
    summonerElement: "dark",
    enemyMonsterIds: [
      "abyss_priest_dark",
      "lotus_dancer_wind",
      "storm_spearmaster_light",
      "magic_archer_fire",
    ],
  },
  {
    id: "warena_hunt",
    nameKo: "사냥 라이벌",
    summonerElement: "wind",
    enemyMonsterIds: [
      "capture_hound_dark",
      "magic_archer_fire",
      "abyss_priest_dark",
      "storm_spearmaster_light",
    ],
  },
  {
    id: "warena_elite",
    nameKo: "정예 라이벌",
    summonerElement: "water",
    enemyMonsterIds: [
      "lotus_dancer_wind",
      "abyss_priest_dark",
      "capture_hound_dark",
      "storm_spearmaster_light",
    ],
  },
];

/** Offline arena rival display nicknames (content data). */
export const ARENA_RIVAL_NICKNAMES: readonly string[] = [
  "바람의검",
  "불꽃소환사",
  "심연의눈",
  "달빛수호자",
  "천둥발",
  "서리여왕",
  "황금방패",
  "그림자사냥",
  "성광기사",
  "맹독가시",
  "폭풍술사",
  "얼음심장",
  "태양의창",
  "암흑학살",
  "숲의수호",
  "용암파수",
  "별빛예언",
  "철벽전사",
  "뇌전지휘",
  "수정무녀",
  "불멸의검",
  "어둠의손",
  "청풍도적",
  "성역치유",
  "파멸의종",
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
      summonerElement: "dark",
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
