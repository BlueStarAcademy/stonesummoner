import type { SymbolSetId } from "./symbols.js";
import type { CombatBoardSize } from "./scenarioTypes.js";

export type ContentMode =
  | "scenario"
  | "depth"
  | "arena"
  | "weekday"
  | "trial"
  | "world_arena"
  | "guild_raid"
  | "equip";

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
  /** Equip dungeon: chance to drop wearable gear (0–1). */
  gearDropChance?: number;
}

export const MAIN_QUEST_AREA_COUNT = 13;
export const STAGES_PER_AREA = 7;

type MainQuestAreaDef = {
  map: number;
  slug: string;
  areaKo: string;
  tone: string;
  dropSetId: SymbolSetId;
  x: number;
  y: number;
};

/** 13 scenario areas — each opens an N-1…N-7 sortie list.
 * Pins sit on atlas landmarks (calibrated in game-box cover space).
 */
const MAIN_QUEST_AREAS: MainQuestAreaDef[] = [
  { map: 1, slug: "garen", areaKo: "월영숲", tone: "forest", dropSetId: "hwalro", x: 47, y: 88 },
  { map: 2, slug: "tower", areaKo: "용맹의 탑", tone: "tower", dropSetId: "yongmaeng", x: 40, y: 77 },
  { map: 3, slug: "ruins", areaKo: "고대 유적", tone: "ruins", dropSetId: "haengma", x: 51, y: 69 },
  { map: 4, slug: "mist", areaKo: "안개 습지", tone: "cadence", dropSetId: "gunhim", x: 44, y: 65 },
  { map: 5, slug: "flame", areaKo: "화염 협곡", tone: "arena", dropSetId: "chimtu", x: 61, y: 58 },
  { map: 6, slug: "frost", areaKo: "서리 고원", tone: "cadence", dropSetId: "bogang", x: 38, y: 53 },
  { map: 7, slug: "thunder", areaKo: "천둥 산맥", tone: "tower", dropSetId: "mussang", x: 42, y: 48 },
  { map: 8, slug: "abyss", areaKo: "심연 해안", tone: "depth", dropSetId: "jipjung", x: 30, y: 45 },
  { map: 9, slug: "seal", areaKo: "봉인 성채", tone: "ruins", dropSetId: "haengma", x: 50, y: 44 },
  { map: 10, slug: "dune", areaKo: "황금 사막", tone: "equip", dropSetId: "yongmaeng", x: 60, y: 42 },
  { map: 11, slug: "star", areaKo: "별빛 정글", tone: "forest", dropSetId: "hwalro", x: 34, y: 41 },
  { map: 12, slug: "obsidian", areaKo: "흑요 지하", tone: "depth", dropSetId: "chimtu", x: 52, y: 37 },
  { map: 13, slug: "end", areaKo: "종언의 신전", tone: "warena", dropSetId: "mussang", x: 50, y: 33 },
];

const MQ_ENEMY_POOL = [
  "gale_scout",
  "dew_healer",
  "fire_fang",
  "shield_tortoise",
  "ash_archer",
  "capture_hound",
  "thunder_lancer",
  "mist_shaman",
  "abyss_priest",
  "seal_scholar",
] as const;

function mqBoardSize(map: number, stage: number): CombatBoardSize {
  if (map === 1 && stage <= 2) return 5;
  if (map <= 2 && stage <= 4) return 7;
  return 9;
}

function mqEnergy(map: number, stage: number): number {
  return Math.min(12, 2 + map + Math.floor(stage / 2));
}

function mqWaves(stage: number): number {
  if (stage <= 1) return 1;
  if (stage <= 3) return 2;
  return 3;
}

function mqEnemies(map: number, stage: number): string[] {
  const count = Math.min(4, 1 + Math.floor((stage - 1) / 2) + (map >= 8 ? 1 : 0));
  const start = (map * 3 + stage) % MQ_ENEMY_POOL.length;
  return Array.from({ length: count }, (_, i) => {
    return MQ_ENEMY_POOL[(start + i) % MQ_ENEMY_POOL.length]!;
  });
}

function buildAreaStages(area: MainQuestAreaDef): StageDef[] {
  return Array.from({ length: STAGES_PER_AREA }, (_, i) => {
    const stage = i + 1;
    const boss = stage === STAGES_PER_AREA;
    return {
      id: `${area.slug}_${area.map}_${stage}`,
      nameKo: boss
        ? `${area.areaKo} ${area.map}-${stage} · 시련`
        : `${area.areaKo} ${area.map}-${stage}`,
      map: area.map,
      stage,
      boardSize: mqBoardSize(area.map, stage),
      energyCost: mqEnergy(area.map, stage) + (boss ? 1 : 0),
      enemyMonsterIds: mqEnemies(area.map, stage),
      dropSetId: area.dropSetId,
      waves: mqWaves(stage),
      mode: "scenario" as const,
    };
  });
}

/** Per-area stage lists (map 1…13). */
export const MAIN_QUEST_CHAPTERS: StageDef[][] = MAIN_QUEST_AREAS.map(buildAreaStages);

export function stagesForMap(map: number): StageDef[] {
  return MAIN_QUEST_CHAPTERS[map - 1] ?? [];
}

export const CHAPTER1_STAGES = MAIN_QUEST_CHAPTERS[0]!;
export const CHAPTER2_STAGES = MAIN_QUEST_CHAPTERS[1]!;
export const CHAPTER3_STAGES = MAIN_QUEST_CHAPTERS[2]!;

/** Ordered main-quest scenario chain (13 areas × 7). */
export const MAIN_QUEST_STAGES: StageDef[] = MAIN_QUEST_CHAPTERS.flat();

export type MainQuestPinId =
  | "mq1"
  | "mq2"
  | "mq3"
  | "mq4"
  | "mq5"
  | "mq6"
  | "mq7"
  | "mq8"
  | "mq9"
  | "mq10"
  | "mq11"
  | "mq12"
  | "mq13";

/**
 * World-map pins for main-quest areas (not individual sorties).
 * Clicking a pin opens the N-1…N-7 stage list sheet.
 */
export const MAIN_QUEST_PIN_LAYOUT: {
  id: MainQuestPinId;
  map: number;
  nameKo: string;
  areaKo: string;
  x: number;
  y: number;
  tone: string;
}[] = MAIN_QUEST_AREAS.map((area) => ({
  id: `mq${area.map}` as MainQuestPinId,
  map: area.map,
  nameKo: `스테이지 ${area.map}`,
  areaKo: area.areaKo,
  x: area.x,
  y: area.y,
  tone: area.tone,
}));

/**
 * Side-content hubs on dedicated atlas islands (off the MQ corridor).
 */
export const SIDE_CONTENT_PIN_LAYOUT: {
  id: "depth" | "arena" | "cadence" | "equip" | "warena" | "guild";
  x: number;
  y: number;
  landmarkKo: string;
}[] = [
  { id: "cadence", x: 12, y: 50, landmarkKo: "룬스톤 시련림" },
  { id: "depth", x: 85, y: 39, landmarkKo: "심층 공허 동굴" },
  { id: "warena", x: 87, y: 57, landmarkKo: "의식 투기 칼데라" },
  { id: "equip", x: 74, y: 47, landmarkKo: "황금 금고 유적" },
  { id: "arena", x: 86, y: 74, landmarkKo: "콜로세움" },
  { id: "guild", x: 87, y: 86, landmarkKo: "길드 요새" },
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

/** 주간 장비 금고 — 소환사 장비 드롭 스텁. */
export const EQUIP_STAGES: StageDef[] = [
  {
    id: "equip_vault_1",
    nameKo: "장비 금고 입문",
    map: 90,
    stage: 1,
    boardSize: 7,
    energyCost: 6,
    enemyMonsterIds: ["shield_tortoise", "seal_scholar"],
    dropSetId: "hwalro",
    waves: 2,
    mode: "equip",
    dropChance: 0.22,
    gearDropChance: 0.8,
  },
  {
    id: "equip_vault_boss",
    nameKo: "장비 금고 심층",
    map: 90,
    stage: 2,
    boardSize: 9,
    energyCost: 8,
    enemyMonsterIds: [
      "thunder_lancer",
      "mist_shaman",
      "shield_tortoise",
      "ash_archer",
    ],
    dropSetId: "yongmaeng",
    waves: 3,
    mode: "equip",
    dropChance: 0.3,
    gearDropChance: 1,
  },
];

export const ALL_STAGES: StageDef[] = [
  ...MAIN_QUEST_STAGES,
  ...DEPTH_STAGES,
  ...ARENA_STAGES,
  ...WEEKDAY_STAGES,
  ...TRIAL_STAGES,
  ...WORLD_ARENA_STAGES,
  ...GUILD_RAID_STAGES,
  ...EQUIP_STAGES,
];

export function getStage(id: string): StageDef | undefined {
  return ALL_STAGES.find((s) => s.id === id);
}

export function stagesByMode(mode: ContentMode): StageDef[] {
  return ALL_STAGES.filter((s) => s.mode === mode);
}
