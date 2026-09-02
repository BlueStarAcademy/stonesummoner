import type { SymbolSetId } from "./symbols.js";
import type { SymbolQuality, SymbolStars } from "./symbolTables.js";
import type { CombatBoardSize } from "./scenarioTypes.js";
import type { Element } from "./monsters/types.js";
import {
  awakenEssenceDropsForFloor,
  awakenExpForFloor,
  type EssenceDropEntry,
} from "./essences.js";
import type { GearStars } from "./gear.js";
import {
  STAGES_LANDMARK_LAYOUT,
  type StagesLandmarkId,
} from "./stagesMap.js";

export type ContentMode =
  | "scenario"
  | "depth"
  | "arena"
  | "weekday"
  | "trial"
  | "challenge_tower"
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
  /** Gear drop ★ weights — separate from the symbol `starWeights`. */
  gearStarWeights?: { value: GearStars; w: number }[];
  /** Floor the ★ of a gear drop (deep vault floors). */
  gearMinStars?: GearStars;
  /** Cairos: weighted set pool (uniform pick among these). */
  dropSetPool?: SymbolSetId[];
  starWeights?: { value: SymbolStars; w: number }[];
  qualityWeights?: { value: SymbolQuality; w: number }[];
  cairosDungeon?: CairosDungeon;
  /** Optional per-wave enemy rosters. The first entry is wave 1. */
  enemyWaves?: string[][];
  /** Boss metadata. The matching monster is promoted only while present. */
  bossMonsterId?: string;
  bossNameKo?: string;
  bossArtId?: string;
  bossHpMultiplier?: number;
  awakenElement?: Element;
  awakenEssenceDrops?: readonly EssenceDropEntry[];
  awakenExpReward?: number;
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

/**
 * SW scenario order: Energy → Destroy (maps 1–13).
 * Pin % coords match STAGES_MQ_LANDMARK_LAYOUT on the expansive atlas —
 * winding south→north path with left/right travel for panning.
 */
const MAIN_QUEST_AREAS: MainQuestAreaDef[] = [
  { map: 1, slug: "garen", areaKo: "월영숲", tone: "forest", dropSetId: "hwalro", x: 27.6, y: 95.2 },
  { map: 2, slug: "tower", areaKo: "용맹의 탑", tone: "tower", dropSetId: "yongmaeng", x: 35.8, y: 81.2 },
  { map: 3, slug: "ruins", areaKo: "고대 유적", tone: "ruins", dropSetId: "mussang", x: 52.3, y: 73.7 },
  { map: 4, slug: "mist", areaKo: "안개 습지", tone: "cadence", dropSetId: "haengma", x: 42.9, y: 64.5 },
  { map: 5, slug: "flame", areaKo: "화염 협곡", tone: "arena", dropSetId: "jipjung", x: 60.4, y: 53.3 },
  { map: 6, slug: "frost", areaKo: "서리 고원", tone: "cadence", dropSetId: "gunhim", x: 39.7, y: 47.4 },
  { map: 7, slug: "thunder", areaKo: "천둥 산맥", tone: "tower", dropSetId: "yeongyeol", x: 53, y: 42.8 },
  { map: 8, slug: "abyss", areaKo: "심연 해안", tone: "depth", dropSetId: "bogang", x: 38.9, y: 35.5 },
  { map: 9, slug: "seal", areaKo: "봉인 성채", tone: "ruins", dropSetId: "hwangyeok", x: 58.6, y: 33.6 },
  { map: 10, slug: "dune", areaKo: "황금 사막", tone: "equip", dropSetId: "ssangnip", x: 49.3, y: 25 },
  { map: 11, slug: "star", areaKo: "별빛 정글", tone: "forest", dropSetId: "eungjing", x: 43.6, y: 17.3 },
  { map: 12, slug: "obsidian", areaKo: "흑요 지하", tone: "depth", dropSetId: "tagae", x: 60.5, y: 17.5 },
  { map: 13, slug: "end", areaKo: "종언의 신전", tone: "warena", dropSetId: "pamyeol", x: 51.8, y: 10.5 },
];

/** Low → high: early maps only unlock the front of the pool. */
const MQ_ENEMY_POOL = [
  "cinder_imp_fire",
  "dew_slime_water",
  "gale_bat_wind",
  "magic_archer_fire",
  "capture_hound_dark",
  "seal_apprentice_light",
  "scout_sniper_wind",
  "dew_healer_water",
  "wolf_fighter_fire",
  "steel_armor_water",
  "lotus_dancer_wind",
  "flame_warrior_fire",
  "seal_elder_light",
  "storm_spearmaster_light",
  "abyss_priest_dark",
  "glacier_mage_water",
  "dragon_knight_fire",
] as const;

function mqBoardSize(map: number, stage: number): CombatBoardSize {
  if (map === 1 && stage <= 3) return 5;
  return 7;
}

function mqEnergy(map: number, stage: number): number {
  return Math.min(12, 2 + map + Math.floor(stage / 2));
}

function mqWaves(stage: number): number {
  if (stage <= 1) return 1;
  if (stage <= 3) return 2;
  return 3;
}

/** How far into MQ_ENEMY_POOL a map/stage may reach (inclusive index). */
function mqEnemyPoolCap(map: number, stage: number): number {
  // Map 1 stays on 1★–2★ fodder; higher maps unlock mid/late entries gradually.
  const unlocked = 2 + (map - 1) * 2 + Math.floor((stage - 1) / 2);
  return Math.min(MQ_ENEMY_POOL.length - 1, unlocked);
}

function mqEnemies(map: number, stage: number): string[] {
  const count = Math.min(4, 1 + Math.floor((stage - 1) / 2) + (map >= 8 ? 1 : 0));
  const pool = MQ_ENEMY_POOL.slice(0, mqEnemyPoolCap(map, stage) + 1);
  const start = (map * 3 + stage) % pool.length;
  return Array.from({ length: count }, (_, i) => {
    return pool[(start + i) % pool.length]!;
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

/** Side pins share landmark x/y so buildings and UI stay aligned. */
export const SIDE_CONTENT_PIN_LAYOUT: {
  id: StagesLandmarkId;
  x: number;
  y: number;
  landmarkKo: string;
}[] = STAGES_LANDMARK_LAYOUT.map((lm) => ({
  id: lm.id,
  x: lm.x,
  y: lm.y,
  landmarkKo: lm.landmarkKo,
}));

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

type StarW = { value: SymbolStars; w: number };
type QualW = { value: SymbolQuality; w: number };

export type ScenarioDropDifficulty = "normal" | "hard" | "hell";

/**
 * Scenario rune tables (SWARFARM / wiki), then nudged a bit luckier.
 * Normal 1–2★ (tiny 3★), Hard 2–4★, Hell 3–5★. Boss (stage 7) leans higher.
 */
export function scenarioSymbolDropTable(
  difficulty: ScenarioDropDifficulty,
  stage = 1,
): { starWeights: StarW[]; qualityWeights: QualW[]; dropChance: number } {
  const boss = stage >= 7;
  if (difficulty === "hell") {
    return {
      starWeights: boss
        ? [
            { value: 3, w: 38 },
            { value: 4, w: 44 },
            { value: 5, w: 18 },
          ]
        : [
            { value: 3, w: 50 },
            { value: 4, w: 40 },
            { value: 5, w: 10 },
          ],
      qualityWeights: [
        { value: "advanced", w: 22 },
        { value: "rare", w: 48 },
        { value: "epic", w: 24 },
        { value: "legend", w: 6 },
      ],
      dropChance: 0.58,
    };
  }
  if (difficulty === "hard") {
    return {
      starWeights: boss
        ? [
            { value: 2, w: 46 },
            { value: 3, w: 40 },
            { value: 4, w: 14 },
          ]
        : [
            { value: 2, w: 60 },
            { value: 3, w: 32 },
            { value: 4, w: 8 },
          ],
      qualityWeights: [
        { value: "normal", w: 26 },
        { value: "advanced", w: 42 },
        { value: "rare", w: 26 },
        { value: "epic", w: 6 },
      ],
      dropChance: 0.5,
    };
  }
  return {
    starWeights: boss
      ? [
          { value: 1, w: 66 },
          { value: 2, w: 28 },
          { value: 3, w: 6 },
        ]
      : [
          { value: 1, w: 80 },
          { value: 2, w: 18 },
          { value: 3, w: 2 },
        ],
    qualityWeights: [
      { value: "normal", w: 62 },
      { value: "advanced", w: 30 },
      { value: "rare", w: 8 },
    ],
    dropChance: 0.42,
  };
}

/** @deprecated use scenarioSymbolDropTable("normal") — kept for callers/tests */
export const SCENARIO_NORMAL_STAR_WEIGHTS: StarW[] =
  scenarioSymbolDropTable("normal", 1).starWeights;

/** SWARFARM Giant B1–B10 (2★–6★), then shifted toward the next star. */
const CAIROS_STAR_BY_FLOOR: StarW[][] = [
  [
    { value: 2, w: 42 },
    { value: 3, w: 50 },
    { value: 4, w: 8 },
  ],
  [
    { value: 2, w: 32 },
    { value: 3, w: 54 },
    { value: 4, w: 14 },
  ],
  [
    { value: 2, w: 8 },
    { value: 3, w: 48 },
    { value: 4, w: 36 },
    { value: 5, w: 8 },
  ],
  [
    { value: 3, w: 34 },
    { value: 4, w: 52 },
    { value: 5, w: 14 },
  ],
  [
    { value: 3, w: 12 },
    { value: 4, w: 56 },
    { value: 5, w: 26 },
    { value: 6, w: 6 },
  ],
  [
    { value: 3, w: 4 },
    { value: 4, w: 54 },
    { value: 5, w: 34 },
    { value: 6, w: 8 },
  ],
  [
    { value: 4, w: 46 },
    { value: 5, w: 44 },
    { value: 6, w: 10 },
  ],
  [
    { value: 4, w: 32 },
    { value: 5, w: 52 },
    { value: 6, w: 16 },
  ],
  [
    { value: 4, w: 14 },
    { value: 5, w: 64 },
    { value: 6, w: 22 },
  ],
  [
    { value: 5, w: 74 },
    { value: 6, w: 26 },
  ],
];

/** Cairos rarity is Rare/Hero/Legend only (~70/25/5 in SW); we tilt to ~62/28/10. */
const CAIROS_QUALITY: QualW[] = [
  { value: "rare", w: 62 },
  { value: "epic", w: 28 },
  { value: "legend", w: 10 },
];

function cairosWeights(floor: number): {
  starWeights: StarW[];
  qualityWeights: QualW[];
} {
  const i = Math.max(1, Math.min(10, Math.floor(floor))) - 1;
  return {
    starWeights: CAIROS_STAR_BY_FLOOR[i]!,
    qualityWeights: CAIROS_QUALITY,
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
    const waves = floor >= 8 ? 3 : 2;
    const encounterIds = mqEnemies(map % 10, floor);
    const giantBoss = dungeon === "giant";
    const bossMonsterId = giantBoss ? "stone_golem_dark" : undefined;
    const enemyWaves = giantBoss
      ? Array.from({ length: waves }, (_, waveIndex) =>
          waveIndex === waves - 1 ? [bossMonsterId!] : [...encounterIds],
        )
      : undefined;
    return {
      id: `${dungeon}_b${floor}`,
      nameKo: `${nameKo} B${floor}`,
      map,
      stage: floor,
      boardSize: 7 as CombatBoardSize,
      energyCost: 5 + Math.floor(floor / 2),
      enemyMonsterIds: giantBoss ? [bossMonsterId!] : encounterIds,
      dropSetId: primaryDrop,
      dropSetPool: pool,
      starWeights: w.starWeights,
      qualityWeights: w.qualityWeights,
      waves,
      mode: "depth" as const,
      dropChance: giantBoss ? 1 : 0.9 + floor * 0.007,
      cairosDungeon: dungeon,
      enemyWaves,
      bossMonsterId,
      bossNameKo: giantBoss ? "봉인된 황금암 거신" : undefined,
      bossArtId: giantBoss ? "cairos-giant" : undefined,
      bossHpMultiplier: giantBoss ? 2 + floor * 0.25 : undefined,
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

/**
 * PVP pays in glory / season standing only — no symbol or gear drops. `dropSetId`
 * stays for the battle theme, but `dropChance: 0` keeps the loot roll empty so the
 * sortie UI never advertises a set the fight cannot hand out.
 */
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
    dropChance: 0,
    gloryReward: 25,
  },
  {
    id: "arena_veteran",
    nameKo: "아레나 · 숙련",
    map: 80,
    stage: 2,
    boardSize: 7,
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
    dropChance: 0,
    gloryReward: 45,
  },
  {
    id: "arena_challenger",
    nameKo: "아레나 · 도전자",
    map: 80,
    stage: 3,
    boardSize: 7,
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
    dropChance: 0,
    gloryReward: 60,
  },
  {
    id: "arena_legend",
    nameKo: "아레나 · 전설",
    map: 80,
    stage: 4,
    boardSize: 7,
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
    dropChance: 0,
    gloryReward: 80,
  },
];

const ELEMENT_AWAKEN_DUNGEONS: {
  element: Element;
  nameKo: string;
  enemyMonsterIds: string[];
  dropSetId: SymbolSetId;
  bossMonsterId: string;
  bossNameKo: string;
}[] = [
  { element: "fire", nameKo: "화염 정수 던전", enemyMonsterIds: ["wolf_fighter_fire", "cinder_imp_fire"], dropSetId: "jipjung", bossMonsterId: "flame_warrior_fire", bossNameKo: "화염의 용광로 거신" },
  { element: "water", nameKo: "심해 정수 던전", enemyMonsterIds: ["dew_healer_water", "steel_armor_water"], dropSetId: "hwalro", bossMonsterId: "glacier_mage_water", bossNameKo: "심해의 빙해 거신" },
  { element: "wind", nameKo: "폭풍 정수 던전", enemyMonsterIds: ["lotus_dancer_wind", "scout_sniper_wind"], dropSetId: "haengma", bossMonsterId: "storm_spearmaster_wind", bossNameKo: "폭풍의 천공 거신" },
  { element: "light", nameKo: "광휘 정수 던전", enemyMonsterIds: ["seal_elder_light", "magic_archer_light"], dropSetId: "yongmaeng", bossMonsterId: "storm_spearmaster_light", bossNameKo: "광휘의 태양 거신" },
  { element: "dark", nameKo: "심연 정수 던전", enemyMonsterIds: ["capture_hound_dark", "doom_oracle_dark"], dropSetId: "mussang", bossMonsterId: "abyss_priest_dark", bossNameKo: "심연의 공허 거신" },
];

export const WEEKDAY_STAGES: StageDef[] = [
  ...ELEMENT_AWAKEN_DUNGEONS.flatMap((dungeon) =>
    Array.from({ length: 10 }, (_, index): StageDef => {
      const floor = index + 1;
      const waves = floor >= 8 ? 3 : 2;
      return {
        id: `weekday_awaken_${dungeon.element}_b${floor}`,
        nameKo: `${dungeon.nameKo} B${floor}`,
        map: 70,
        stage: floor,
        boardSize: 7,
        energyCost: 4 + Math.floor(floor / 2),
        enemyMonsterIds: [dungeon.bossMonsterId],
        enemyWaves: Array.from({ length: waves }, (_, waveIndex) =>
          waveIndex === waves - 1
            ? [dungeon.bossMonsterId]
            : [...dungeon.enemyMonsterIds],
        ),
        dropSetId: dungeon.dropSetId,
        waves,
        mode: "weekday",
        dropChance: 0,
        gearDropChance: 0,
        bossMonsterId: dungeon.bossMonsterId,
        bossNameKo: dungeon.bossNameKo,
        bossArtId: `awaken-${dungeon.element}`,
        bossHpMultiplier: 1.75 + floor * 0.2,
        awakenElement: dungeon.element,
        awakenEssenceDrops: awakenEssenceDropsForFloor(floor),
        awakenExpReward: awakenExpForFloor(floor),
      };
    }),
  ),
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

/** JS getDay(): 0=Sun … 6=Sat. Dark→Fire→Water→Wind→Light; weekends open all. */
export function isWeekdayStageOpenToday(
  stageId: string,
  now = Date.now(),
): boolean {
  const d = new Date(now).getDay();
  const awaken = stageId.match(
    /^weekday_awaken_(fire|water|wind|light|dark)(?:_b\d+)?$/,
  )?.[1] as Element | undefined;
  if (awaken) {
    if (d === 0 || d === 6) return true;
    const elementByDay: Partial<Record<number, Element>> = {
      1: "dark",
      2: "fire",
      3: "water",
      4: "wind",
      5: "light",
    };
    return elementByDay[d] === awaken;
  }
  if (stageId === "weekday_skill") {
    return d === 0 || d === 2 || d === 4 || d === 6;
  }
  return true;
}

export const WEEKDAY_EVOLVE_MAT_DROP = 5;
export const WEEKDAY_SKILL_MAT_DROP = 5;
export const CHALLENGE_TOWER_FLOORS = 100;

const TOA_BOSS_IDS = [
  "stone_golem_dark",
  "flame_warrior_fire",
  "glacier_mage_water",
  "storm_spearmaster_light",
  "abyss_priest_dark",
  "dragon_knight_fire",
  "doom_oracle_dark",
  "eternal_healer_water",
  "sky_warden_wind",
  "seal_elder_light",
] as const;

function toaEnemies(floor: number): string[] {
  const poolCap = Math.min(
    MQ_ENEMY_POOL.length - 1,
    2 + Math.floor(floor / 4),
  );
  const pool = MQ_ENEMY_POOL.slice(0, poolCap + 1);
  const count = Math.min(4, 1 + Math.floor(floor / 20));
  const start = (floor * 5) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]!);
}

export function challengeTowerStageFloor(stageId: string): number | null {
  const match = stageId.match(/^toa_f(\d+)$/);
  if (!match) return null;
  return parseInt(match[1]!, 10);
}

/** SW-style Trial of Ascension — 100 floors, monthly reset, legend scroll at 100F. */
export const CHALLENGE_TOWER_STAGES: StageDef[] = Array.from(
  { length: CHALLENGE_TOWER_FLOORS },
  (_, i) => {
    const floor = i + 1;
    const isBoss = floor % 10 === 0;
    const waves = floor >= 70 ? 3 : floor >= 30 ? 2 : 1;
    const encounterIds = toaEnemies(floor);
    const bossMonsterId = isBoss
      ? floor === 100
        ? "doom_oracle_dark"
        : TOA_BOSS_IDS[Math.floor(floor / 10) - 1]!
      : undefined;
    const enemyWaves =
      isBoss && bossMonsterId
        ? Array.from({ length: waves }, (_, waveIndex) =>
            waveIndex === waves - 1 ? [bossMonsterId] : [...encounterIds],
          )
        : undefined;
    return {
      id: `toa_f${floor}`,
      nameKo: `도전의 탑 ${floor}층`,
      map: 95,
      stage: floor,
      boardSize: 7 as CombatBoardSize,
      energyCost: Math.min(12, 4 + Math.floor(floor / 10)),
      enemyMonsterIds: isBoss && bossMonsterId ? [bossMonsterId] : encounterIds,
      enemyWaves,
      dropSetId: "yongmaeng",
      waves,
      mode: "challenge_tower" as const,
      dropChance: 0,
      gearDropChance: 0,
      bossMonsterId,
      bossNameKo: isBoss
        ? floor === 100
          ? "탑의 수호자"
          : `시련 수호자 · ${floor}층`
        : undefined,
      bossHpMultiplier: isBoss ? 1.6 + floor * 0.04 : undefined,
    };
  },
);

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
    boardSize: 7,
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
    boardSize: 7,
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
    boardSize: 7,
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
    dropChance: 0,
    gloryReward: 80,
  },
  {
    id: "warena_final",
    nameKo: "월드아레나 · 결승",
    map: 85,
    stage: 2,
    boardSize: 7,
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
    dropChance: 0,
    gloryReward: 120,
  },
];

export const GUILD_RAID_STAGES: StageDef[] = [
  {
    id: "guild_raid_boss",
    nameKo: "길드 레이드 · 거대 진문",
    map: 95,
    stage: 1,
    boardSize: 7,
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

const EQUIP_VAULT_BOSS_ID = "stone_golem_dark";

/**
 * 황금 금고 — the summoner gear dungeon. Deeper floors shift the ★ table up,
 * which is what unlocks substat count and ★4+ special abilities on drops.
 */
export const EQUIP_STAGES: StageDef[] = [
  {
    id: "equip_vault_1",
    nameKo: "황금 금고 1층 · 입문",
    map: 90,
    stage: 1,
    boardSize: 7,
    energyCost: 6,
    enemyMonsterIds: ["steel_armor_water", "seal_elder_light"],
    dropSetId: "hwalro",
    waves: 2,
    mode: "equip",
    dropChance: 0.22,
    gearDropChance: 0.85,
    gearStarWeights: [
      { value: 1, w: 46 },
      { value: 2, w: 34 },
      { value: 3, w: 20 },
    ],
  },
  {
    id: "equip_vault_boss",
    nameKo: "황금 금고 2층 · 심층",
    map: 90,
    stage: 2,
    boardSize: 7,
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
    gearStarWeights: [
      { value: 1, w: 20 },
      { value: 2, w: 36 },
      { value: 3, w: 30 },
      { value: 4, w: 11 },
      { value: 5, w: 3 },
    ],
  },
  {
    id: "equip_vault_3",
    nameKo: "황금 금고 3층 · 봉인 서고",
    map: 90,
    stage: 3,
    boardSize: 7,
    energyCost: 10,
    enemyMonsterIds: [
      "seal_elder_light",
      "glacier_mage_water",
      "abyss_priest_dark",
      "flame_warrior_fire",
    ],
    dropSetId: "jipjung",
    waves: 3,
    mode: "equip",
    dropChance: 0.36,
    gearDropChance: 1,
    gearStarWeights: [
      { value: 2, w: 30 },
      { value: 3, w: 38 },
      { value: 4, w: 22 },
      { value: 5, w: 10 },
    ],
  },
  {
    id: "equip_vault_4",
    nameKo: "황금 금고 4층 · 보물 회랑",
    map: 90,
    stage: 4,
    boardSize: 7,
    energyCost: 12,
    enemyMonsterIds: [
      "dragon_knight_fire",
      "abyss_priest_dark",
      "glacier_mage_water",
      "storm_spearmaster_light",
    ],
    dropSetId: "gunhim",
    waves: 4,
    mode: "equip",
    dropChance: 0.42,
    gearDropChance: 1,
    gearMinStars: 2,
    gearStarWeights: [
      { value: 2, w: 18 },
      { value: 3, w: 34 },
      { value: 4, w: 32 },
      { value: 5, w: 16 },
    ],
  },
  {
    id: "equip_vault_5",
    nameKo: "황금 금고 5층 · 금고의 주인",
    map: 90,
    stage: 5,
    boardSize: 7,
    energyCost: 14,
    enemyMonsterIds: [EQUIP_VAULT_BOSS_ID],
    enemyWaves: [
      ["dragon_knight_fire", "abyss_priest_dark"],
      ["glacier_mage_water", "storm_spearmaster_light"],
      ["dragon_knight_fire", "flame_warrior_fire", "abyss_priest_dark"],
      [EQUIP_VAULT_BOSS_ID],
    ],
    dropSetId: "hwangyeok",
    waves: 4,
    mode: "equip",
    dropChance: 0.5,
    gearDropChance: 1,
    gearMinStars: 4,
    gearStarWeights: [
      { value: 4, w: 62 },
      { value: 5, w: 38 },
    ],
    bossMonsterId: EQUIP_VAULT_BOSS_ID,
    bossNameKo: "황금 금고의 주인",
    bossHpMultiplier: 3.2,
  },
];

export const ALL_STAGES: StageDef[] = [
  ...MAIN_QUEST_STAGES,
  ...DEPTH_STAGES,
  ...ARENA_STAGES,
  ...WEEKDAY_STAGES,
  ...TRIAL_STAGES,
  ...CHALLENGE_TOWER_STAGES,
  ...WORLD_ARENA_STAGES,
  ...GUILD_RAID_STAGES,
  ...EQUIP_STAGES,
];

export function getStage(id: string): StageDef | undefined {
  const legacyAwaken = id.match(
    /^weekday_awaken_(fire|water|wind|light|dark)$/,
  );
  const normalized = legacyAwaken ? `${id}_b1` : id;
  return ALL_STAGES.find((s) => s.id === normalized);
}

export function stagesByMode(mode: ContentMode): StageDef[] {
  return ALL_STAGES.filter((s) => s.mode === mode);
}
