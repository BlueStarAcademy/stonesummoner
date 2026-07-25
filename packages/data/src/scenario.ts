import type { SymbolSetId } from "./symbols.js";
import type { CombatBoardSize } from "./scenarioTypes.js";

export type ContentMode =
  | "scenario"
  | "depth"
  | "arena"
  | "weekday"
  | "trial"
  | "world_arena"
  | "guild_raid";

export interface StageDef {
  id: string;
  nameKo: string;
  map: number;
  stage: number;
  boardSize: CombatBoardSize;
  energyCost: number;
  enemyMonsterIds: string[];
  dropSetId: SymbolSetId;
  waves: number;
  mode: ContentMode;
  /** Override default drop chance (0–1). */
  dropChance?: number;
  /** Arena / trial glory points on win. */
  gloryReward?: number;
  /** Magic-circle trial: 진문석. */
  jinmunReward?: number;
}

/** 가렌숲 chapter 1 — boards grow 5→7→9. */
export const CHAPTER1_STAGES: StageDef[] = [
  {
    id: "garen_1_1",
    nameKo: "가렌숲 1-1",
    map: 1,
    stage: 1,
    boardSize: 5,
    energyCost: 3,
    enemyMonsterIds: ["gale_scout"],
    dropSetId: "hwalro",
    waves: 1,
    mode: "scenario",
  },
  {
    id: "garen_1_2",
    nameKo: "가렌숲 1-2",
    map: 1,
    stage: 2,
    boardSize: 5,
    energyCost: 3,
    enemyMonsterIds: ["gale_scout", "dew_healer"],
    dropSetId: "hwalro",
    waves: 2,
    mode: "scenario",
  },
  {
    id: "garen_1_3",
    nameKo: "가렌숲 1-3",
    map: 1,
    stage: 3,
    boardSize: 7,
    energyCost: 4,
    enemyMonsterIds: ["fire_fang", "shield_tortoise"],
    dropSetId: "hwalro",
    waves: 2,
    mode: "scenario",
  },
  {
    id: "garen_1_4",
    nameKo: "가렌숲 1-4",
    map: 1,
    stage: 4,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: ["ash_archer", "capture_hound", "gale_scout"],
    dropSetId: "hwalro",
    waves: 3,
    mode: "scenario",
  },
  {
    id: "garen_1_5",
    nameKo: "가렌숲 1-5 · 진문시련",
    map: 1,
    stage: 5,
    boardSize: 9,
    energyCost: 6,
    enemyMonsterIds: [
      "thunder_lancer",
      "capture_hound",
      "ash_archer",
      "shield_tortoise",
    ],
    dropSetId: "hwalro",
    waves: 3,
    mode: "scenario",
  },
];

/** 용맹의 탑 chapter 2 — Fatal-focused drops. */
export const CHAPTER2_STAGES: StageDef[] = [
  {
    id: "tower_2_1",
    nameKo: "용맹의 탑 2-1",
    map: 2,
    stage: 1,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: ["fire_fang", "ash_archer"],
    dropSetId: "yongmaeng",
    waves: 2,
    mode: "scenario",
  },
  {
    id: "tower_2_2",
    nameKo: "용맹의 탑 2-2",
    map: 2,
    stage: 2,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: ["thunder_lancer", "capture_hound", "gale_scout"],
    dropSetId: "yongmaeng",
    waves: 2,
    mode: "scenario",
  },
  {
    id: "tower_2_3",
    nameKo: "용맹의 탑 2-3",
    map: 2,
    stage: 3,
    boardSize: 9,
    energyCost: 6,
    enemyMonsterIds: [
      "mist_shaman",
      "abyss_priest",
      "shield_tortoise",
      "fire_fang",
    ],
    dropSetId: "chimtu",
    waves: 3,
    mode: "scenario",
  },
];

/** 상징 심층 (Kairos stub) — high drop rate, set-focused. */
export const DEPTH_STAGES: StageDef[] = [
  {
    id: "depth_hwalro",
    nameKo: "심층 · 활로",
    map: 90,
    stage: 1,
    boardSize: 9,
    energyCost: 7,
    enemyMonsterIds: ["shield_tortoise", "dew_healer", "gale_scout"],
    dropSetId: "hwalro",
    waves: 2,
    mode: "depth",
    dropChance: 0.92,
  },
  {
    id: "depth_yongmaeng",
    nameKo: "심층 · 용맹",
    map: 90,
    stage: 2,
    boardSize: 9,
    energyCost: 7,
    enemyMonsterIds: ["fire_fang", "ash_archer", "thunder_lancer"],
    dropSetId: "yongmaeng",
    waves: 2,
    mode: "depth",
    dropChance: 0.92,
  },
  {
    id: "depth_haengma",
    nameKo: "심층 · 행마",
    map: 90,
    stage: 3,
    boardSize: 9,
    energyCost: 8,
    enemyMonsterIds: ["gale_scout", "capture_hound", "mist_shaman"],
    dropSetId: "haengma",
    waves: 3,
    mode: "depth",
    dropChance: 0.92,
  },
  {
    id: "depth_gunhim",
    nameKo: "심층 · 군힘",
    map: 90,
    stage: 4,
    boardSize: 9,
    energyCost: 8,
    enemyMonsterIds: ["shield_tortoise", "abyss_priest", "seal_scholar"],
    dropSetId: "gunhim",
    waves: 3,
    mode: "depth",
    dropChance: 0.9,
  },
];

/** 아레나 stub — glory points, no energy (daily-ish stub uses energy 0). */
export const ARENA_STAGES: StageDef[] = [
  {
    id: "arena_rookie",
    nameKo: "아레나 · 신입",
    map: 80,
    stage: 1,
    boardSize: 7,
    energyCost: 0,
    enemyMonsterIds: ["gale_scout", "dew_healer", "fire_fang"],
    dropSetId: "hwalro",
    waves: 1,
    mode: "arena",
    dropChance: 0.15,
    gloryReward: 25,
  },
  {
    id: "arena_veteran",
    nameKo: "아레나 · 숙련",
    map: 80,
    stage: 2,
    boardSize: 9,
    energyCost: 0,
    enemyMonsterIds: [
      "thunder_lancer",
      "ash_archer",
      "capture_hound",
      "shield_tortoise",
    ],
    dropSetId: "mussang",
    waves: 1,
    mode: "arena",
    dropChance: 0.2,
    gloryReward: 45,
  },
];

/** 요일 던전 stub — materials via crystal/scroll bias. */
export const WEEKDAY_STAGES: StageDef[] = [
  {
    id: "weekday_evolve",
    nameKo: "요일 · 진화재료",
    map: 70,
    stage: 1,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: ["fire_fang", "shield_tortoise"],
    dropSetId: "gunhim",
    waves: 2,
    mode: "weekday",
    dropChance: 0.35,
  },
  {
    id: "weekday_skill",
    nameKo: "요일 · 스킬재료",
    map: 70,
    stage: 2,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: ["mist_shaman", "seal_scholar"],
    dropSetId: "jipjung",
    waves: 2,
    mode: "weekday",
    dropChance: 0.35,
  },
];

/** 마법진 시련 — 진문석, low symbol drop. */
export const TRIAL_STAGES: StageDef[] = [
  {
    id: "trial_jinmun",
    nameKo: "마법진 시련",
    map: 60,
    stage: 1,
    boardSize: 9,
    energyCost: 6,
    enemyMonsterIds: [
      "abyss_priest",
      "mist_shaman",
      "thunder_lancer",
      "capture_hound",
    ],
    dropSetId: "haengma",
    waves: 2,
    mode: "trial",
    dropChance: 0.2,
    jinmunReward: 3,
    gloryReward: 10,
  },
];

/** 월드아레나 stub — higher glory, ban-pick feel via tougher foe. */
export const WORLD_ARENA_STAGES: StageDef[] = [
  {
    id: "warena_qual",
    nameKo: "월드아레나 · 예선",
    map: 85,
    stage: 1,
    boardSize: 9,
    energyCost: 0,
    enemyMonsterIds: [
      "thunder_lancer",
      "mist_shaman",
      "ash_archer",
      "abyss_priest",
    ],
    dropSetId: "mussang",
    waves: 1,
    mode: "world_arena",
    dropChance: 0.25,
    gloryReward: 80,
  },
  {
    id: "warena_final",
    nameKo: "월드아레나 · 결승",
    map: 85,
    stage: 2,
    boardSize: 9,
    energyCost: 0,
    enemyMonsterIds: [
      "abyss_priest",
      "mist_shaman",
      "thunder_lancer",
      "capture_hound",
    ],
    dropSetId: "chimtu",
    waves: 1,
    mode: "world_arena",
    dropChance: 0.3,
    gloryReward: 120,
  },
];

/** 길드 레이드 stub — 13×13 boss board. */
export const GUILD_RAID_STAGES: StageDef[] = [
  {
    id: "guild_raid_boss",
    nameKo: "길드 레이드 · 거대 진문",
    map: 95,
    stage: 1,
    boardSize: 13,
    energyCost: 10,
    enemyMonsterIds: [
      "abyss_priest",
      "mist_shaman",
      "thunder_lancer",
      "shield_tortoise",
    ],
    dropSetId: "bogang",
    waves: 3,
    mode: "guild_raid",
    dropChance: 0.55,
    jinmunReward: 8,
    gloryReward: 30,
  },
];

export const ALL_STAGES: StageDef[] = [
  ...CHAPTER1_STAGES,
  ...CHAPTER2_STAGES,
  ...DEPTH_STAGES,
  ...ARENA_STAGES,
  ...WEEKDAY_STAGES,
  ...TRIAL_STAGES,
  ...WORLD_ARENA_STAGES,
  ...GUILD_RAID_STAGES,
];

export function getStage(id: string): StageDef | undefined {
  return ALL_STAGES.find((s) => s.id === id);
}

export function stagesByMode(mode: ContentMode): StageDef[] {
  return ALL_STAGES.filter((s) => s.mode === mode);
}
