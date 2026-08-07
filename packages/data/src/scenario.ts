import type { SymbolSetId } from "./symbols.js";
import type { SymbolQuality, SymbolStars } from "./symbolTables.js";
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

export type CairosDungeon = "giant" | "dragon" | "necro";

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
  dropChance?: number;
  gloryReward?: number;
  jinmunReward?: number;
  gearDropChance?: number;
  /** Cairos: weighted set pool (uniform pick among these). */
  dropSetPool?: SymbolSetId[];
  starWeights?: { value: SymbolStars; w: number }[];
  qualityWeights?: { value: SymbolQuality; w: number }[];
  cairosDungeon?: CairosDungeon;
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

/** SW scenario order: Energy → Destroy (maps 1–13). */
const MAIN_QUEST_AREAS: MainQuestAreaDef[] = [
  { map: 1, slug: "garen", areaKo: "월영숲", tone: "forest", dropSetId: "hwalro", x: 47, y: 88 },
  { map: 2, slug: "tower", areaKo: "용맹의 탑", tone: "tower", dropSetId: "yongmaeng", x: 40, y: 77 },
  { map: 3, slug: "ruins", areaKo: "고대 유적", tone: "ruins", dropSetId: "mussang", x: 51, y: 69 },
  { map: 4, slug: "mist", areaKo: "안개 습지", tone: "cadence", dropSetId: "haengma", x: 44, y: 65 },
  { map: 5, slug: "flame", areaKo: "화염 협곡", tone: "arena", dropSetId: "jipjung", x: 61, y: 58 },
  { map: 6, slug: "frost", areaKo: "서리 고원", tone: "cadence", dropSetId: "gunhim", x: 38, y: 53 },
  { map: 7, slug: "thunder", areaKo: "천둥 산맥", tone: "tower", dropSetId: "yeongyeol", x: 42, y: 48 },
  { map: 8, slug: "abyss", areaKo: "심연 해안", tone: "depth", dropSetId: "bogang", x: 30, y: 45 },
  { map: 9, slug: "seal", areaKo: "봉인 성채", tone: "ruins", dropSetId: "hwangyeok", x: 50, y: 44 },
  { map: 10, slug: "dune", areaKo: "황금 사막", tone: "equip", dropSetId: "ssangnip", x: 60, y: 42 },
  { map: 11, slug: "star", areaKo: "별빛 정글", tone: "forest", dropSetId: "eungjing", x: 34, y: 41 },
  { map: 12, slug: "obsidian", areaKo: "흑요 지하", tone: "depth", dropSetId: "tagae", x: 52, y: 37 },
  { map: 13, slug: "end", areaKo: "종언의 신전", tone: "warena", dropSetId: "pamyeol", x: 50, y: 33 },
];

const MQ_ENEMY_POOL = [
  "scout_sniper_wind",
  "dew_healer_water",
  "wolf_fighter_fire",
  "steel_armor_water",
  "magic_archer_fire",
  "capture_hound_dark",
  "storm_spearmaster_light",
  "lotus_dancer_wind",
  "abyss_priest_dark",
  "seal_elder_light",
  "cinder_imp_fire",
  "flame_warrior_fire",
  "glacier_mage_water",
  "dragon_knight_fire",
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

export const MAIN_QUEST_CHAPTERS: StageDef[][] = MAIN_QUEST_AREAS.map(buildAreaStages);

export function stagesForMap(map: number): StageDef[] {
  return MAIN_QUEST_CHAPTERS[map - 1] ?? [];
}

export const CHAPTER1_STAGES = MAIN_QUEST_CHAPTERS[0]!;
export const CHAPTER2_STAGES = MAIN_QUEST_CHAPTERS[1]!;
export const CHAPTER3_STAGES = MAIN_QUEST_CHAPTERS[2]!;

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

export const SIDE_CONTENT_PIN_LAYOUT: {
  id: "depth" | "arena" | "cadence" | "equip" | "warena" | "guild";
  x: number;
  y: number;
  landmarkKo: string;
}[] = [
  { id: "cadence", x: 12, y: 50, landmarkKo: "룬스톤 시련림" },
  { id: "depth", x: 85, y: 39, landmarkKo: "카이로스 심층" },
  { id: "warena", x: 87, y: 57, landmarkKo: "의식 투기 칼데라" },
  { id: "equip", x: 74, y: 47, landmarkKo: "황금 금고 유적" },
  { id: "arena", x: 86, y: 74, landmarkKo: "콜로세움" },
  { id: "guild", x: 87, y: 86, landmarkKo: "길드 요새" },
];

const CAIROS_GIANT_POOL: SymbolSetId[] = [
  "hwalro",
  "yongmaeng",
  "mussang",
  "haengma",
  "jipjung",
  "myosu",
];
const CAIROS_DRAGON_POOL: SymbolSetId[] = [
  "gunhim",
  "yeongyeol",
  "bogang",
  "hwangyeok",
  "gyeongno",
];
const CAIROS_NECRO_POOL: SymbolSetId[] = [
  "chimtu",
  "ssangnip",
  "eungjing",
  "tagae",
  "pamyeol",
];

function cairosWeights(floor: number): {
  starWeights: { value: SymbolStars; w: number }[];
  qualityWeights: { value: SymbolQuality; w: number }[];
} {
  if (floor <= 3) {
    return {
      starWeights: [
        { value: 2, w: 15 },
        { value: 3, w: 55 },
        { value: 4, w: 25 },
        { value: 5, w: 5 },
      ],
      qualityWeights: [
        { value: "normal", w: 30 },
        { value: "advanced", w: 40 },
        { value: "rare", w: 25 },
        { value: "epic", w: 5 },
      ],
    };
  }
  if (floor <= 6) {
    return {
      starWeights: [
        { value: 3, w: 15 },
        { value: 4, w: 50 },
        { value: 5, w: 30 },
        { value: 6, w: 5 },
      ],
      qualityWeights: [
        { value: "advanced", w: 20 },
        { value: "rare", w: 45 },
        { value: "epic", w: 30 },
        { value: "legend", w: 5 },
      ],
    };
  }
  if (floor <= 9) {
    return {
      starWeights: [
        { value: 4, w: 15 },
        { value: 5, w: 60 },
        { value: 6, w: 25 },
      ],
      qualityWeights: [
        { value: "rare", w: 25 },
        { value: "epic", w: 55 },
        { value: "legend", w: 20 },
      ],
    };
  }
  return {
    starWeights: [
      { value: 5, w: 45 },
      { value: 6, w: 55 },
    ],
    qualityWeights: [
      { value: "epic", w: 55 },
      { value: "legend", w: 45 },
    ],
  };
}

function buildCairosDungeon(
  dungeon: CairosDungeon,
  nameKo: string,
  map: number,
  pool: SymbolSetId[],
  primaryDrop: SymbolSetId,
): StageDef[] {
  return Array.from({ length: 10 }, (_, i) => {
    const floor = i + 1;
    const w = cairosWeights(floor);
    return {
      id: `${dungeon}_b${floor}`,
      nameKo: `${nameKo} B${floor}`,
      map,
      stage: floor,
      boardSize: 9 as CombatBoardSize,
      energyCost: 5 + Math.floor(floor / 2),
      enemyMonsterIds: mqEnemies(map % 10, floor),
      dropSetId: primaryDrop,
      dropSetPool: pool,
      starWeights: w.starWeights,
      qualityWeights: w.qualityWeights,
      waves: floor >= 8 ? 3 : 2,
      mode: "depth" as const,
      dropChance: 0.85 + floor * 0.01,
      cairosDungeon: dungeon,
    };
  });
}

export const CAIROS_GIANT_STAGES = buildCairosDungeon(
  "giant",
  "거인의 탑",
  91,
  CAIROS_GIANT_POOL,
  "myosu",
);
export const CAIROS_DRAGON_STAGES = buildCairosDungeon(
  "dragon",
  "용의 둥지",
  92,
  CAIROS_DRAGON_POOL,
  "gyeongno",
);
export const CAIROS_NECRO_STAGES = buildCairosDungeon(
  "necro",
  "네크로폴리스",
  93,
  CAIROS_NECRO_POOL,
  "chimtu",
);

/** All Cairos floors (replaces per-set depth stub). */
export const DEPTH_STAGES: StageDef[] = [
  ...CAIROS_GIANT_STAGES,
  ...CAIROS_DRAGON_STAGES,
  ...CAIROS_NECRO_STAGES,
];

export function cairosStagesFor(dungeon: CairosDungeon): StageDef[] {
  if (dungeon === "giant") return CAIROS_GIANT_STAGES;
  if (dungeon === "dragon") return CAIROS_DRAGON_STAGES;
  return CAIROS_NECRO_STAGES;
}

export const ARENA_STAGES: StageDef[] = [
  {
    id: "arena_rookie",
    nameKo: "아레나 · 신입",
    map: 80,
    stage: 1,
    boardSize: 7,
    energyCost: 0,
    enemyMonsterIds: ["scout_sniper_wind", "dew_healer_water", "wolf_fighter_fire"],
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
      "storm_spearmaster_light",
      "magic_archer_fire",
      "capture_hound_dark",
      "steel_armor_water",
    ],
    dropSetId: "mussang",
    waves: 1,
    mode: "arena",
    dropChance: 0.2,
    gloryReward: 45,
  },
  {
    id: "arena_challenger",
    nameKo: "아레나 · 도전자",
    map: 80,
    stage: 3,
    boardSize: 9,
    energyCost: 0,
    enemyMonsterIds: [
      "abyss_priest_dark",
      "lotus_dancer_wind",
      "storm_spearmaster_light",
      "seal_elder_light",
    ],
    dropSetId: "chimtu",
    waves: 1,
    mode: "arena",
    dropChance: 0.22,
    gloryReward: 60,
  },
  {
    id: "arena_legend",
    nameKo: "아레나 · 전설",
    map: 80,
    stage: 4,
    boardSize: 9,
    energyCost: 0,
    enemyMonsterIds: [
      "dragon_knight_fire",
      "eternal_healer_water",
      "sky_warden_wind",
      "doom_oracle_dark",
    ],
    dropSetId: "yongmaeng",
    waves: 1,
    mode: "arena",
    dropChance: 0.25,
    gloryReward: 80,
  },
];

export const WEEKDAY_STAGES: StageDef[] = [
  {
    id: "weekday_evolve",
    nameKo: "요일 · 진화재료",
    map: 70,
    stage: 1,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: ["wolf_fighter_fire", "steel_armor_water"],
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
    enemyMonsterIds: ["lotus_dancer_wind", "seal_elder_light"],
    dropSetId: "jipjung",
    waves: 2,
    mode: "weekday",
    dropChance: 0.35,
  },
];

/** JS getDay(): 0=Sun … 6=Sat. Evolve Mon/Wed/Fri(+Sun); skill Tue/Thu/Sat(+Sun). */
export function isWeekdayStageOpenToday(
  stageId: string,
  now = Date.now(),
): boolean {
  const d = new Date(now).getDay();
  if (stageId === "weekday_evolve") {
    return d === 0 || d === 1 || d === 3 || d === 5;
  }
  if (stageId === "weekday_skill") {
    return d === 0 || d === 2 || d === 4 || d === 6;
  }
  return true;
}

export const WEEKDAY_EVOLVE_MAT_DROP = 5;
export const WEEKDAY_SKILL_MAT_DROP = 5;
export const TRIAL_STAGES: StageDef[] = [
  {
    id: "trial_b1",
    nameKo: "마법진 시련 · B1",
    map: 60,
    stage: 1,
    boardSize: 7,
    energyCost: 5,
    enemyMonsterIds: [
      "scout_sniper_wind",
      "dew_healer_water",
      "wolf_fighter_fire",
    ],
    dropSetId: "haengma",
    waves: 2,
    mode: "trial",
    dropChance: 0.18,
    jinmunReward: 2,
    gloryReward: 6,
  },
  {
    id: "trial_b2",
    nameKo: "마법진 시련 · B2",
    map: 60,
    stage: 2,
    boardSize: 9,
    energyCost: 6,
    enemyMonsterIds: [
      "steel_armor_water",
      "lotus_dancer_wind",
      "magic_archer_fire",
      "seal_elder_light",
    ],
    dropSetId: "haengma",
    waves: 2,
    mode: "trial",
    dropChance: 0.2,
    jinmunReward: 3,
    gloryReward: 10,
  },
  {
    id: "trial_b3",
    nameKo: "마법진 시련 · B3",
    map: 60,
    stage: 3,
    boardSize: 9,
    energyCost: 8,
    enemyMonsterIds: [
      "abyss_priest_dark",
      "lotus_dancer_wind",
      "storm_spearmaster_light",
      "capture_hound_dark",
    ],
    dropSetId: "chimtu",
    waves: 3,
    mode: "trial",
    dropChance: 0.25,
    jinmunReward: 5,
    gloryReward: 15,
  },
];

export const WORLD_ARENA_STAGES: StageDef[] = [
  {
    id: "warena_qual",
    nameKo: "월드아레나 · 예선",
    map: 85,
    stage: 1,
    boardSize: 9,
    energyCost: 0,
    enemyMonsterIds: [
      "storm_spearmaster_light",
      "lotus_dancer_wind",
      "magic_archer_fire",
      "abyss_priest_dark",
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
      "abyss_priest_dark",
      "lotus_dancer_wind",
      "storm_spearmaster_light",
      "capture_hound_dark",
    ],
    dropSetId: "chimtu",
    waves: 1,
    mode: "world_arena",
    dropChance: 0.3,
    gloryReward: 120,
  },
];

export const GUILD_RAID_STAGES: StageDef[] = [
  {
    id: "guild_raid_boss",
    nameKo: "길드 레이드 · 거대 진문",
    map: 95,
    stage: 1,
    boardSize: 13,
    energyCost: 10,
    enemyMonsterIds: [
      "abyss_priest_dark",
      "lotus_dancer_wind",
      "storm_spearmaster_light",
      "steel_armor_water",
    ],
    dropSetId: "bogang",
    waves: 3,
    mode: "guild_raid",
    dropChance: 0.55,
    jinmunReward: 8,
    gloryReward: 30,
  },
];

export const EQUIP_STAGES: StageDef[] = [
  {
    id: "equip_vault_1",
    nameKo: "장비 금고 입문",
    map: 90,
    stage: 1,
    boardSize: 7,
    energyCost: 6,
    enemyMonsterIds: ["steel_armor_water", "seal_elder_light"],
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
      "storm_spearmaster_light",
      "lotus_dancer_wind",
      "steel_armor_water",
      "magic_archer_fire",
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
