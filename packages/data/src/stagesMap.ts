/**
 * Expedition world-map atlas.
 * Buildings are baked into stages-world-terrain.webp.
 * Pin % coords (layout x/y) MUST sit on each painted plaza.
 */

/** Expansive pannable atlas (wider + taller than phone viewport). */
export const STAGES_MAP_NATURAL = { w: 2880, h: 3840 } as const;

export type StagesSideLandmarkId =
  | "challenge_tower"
  | "cadence"
  | "depth"
  | "equip"
  | "warena"
  | "arena"
  | "guild";

export type StagesLandmarkId = StagesSideLandmarkId;

export type StagesLandmarkDef = {
  id: StagesLandmarkId;
  /** File stem under /art/stages/landmark-{artKey}.webp */
  artKey: string;
  /** Percent of atlas width (0–100) — pad center. */
  x: number;
  /** Percent of atlas height (0–100) — pad center. */
  y: number;
  /** Visual scale vs default landmark size (1 = normal). */
  scale: number;
  landmarkKo: string;
};

export type StagesMqLandmarkDef = {
  map: number;
  artKey: string;
  x: number;
  y: number;
  scale: number;
  areaKo: string;
  battleBgId: string;
};

/**
 * Side-content pin anchors (buildings are painted on the terrain).
 * Pins share these x/y (SIDE_CONTENT_PIN_LAYOUT).
 */
export const STAGES_LANDMARK_LAYOUT: readonly StagesLandmarkDef[] = [
  {
    id: "challenge_tower",
    artKey: "challenge-tower",
    x: 13.4,
    y: 35.5,
    scale: 1.5,
    landmarkKo: "도전의 탑",
  },
  {
    id: "cadence",
    artKey: "cadence",
    x: 15.1,
    y: 55.3,
    scale: 1.2,
    landmarkKo: "룬스톤 시련림",
  },
  {
    id: "depth",
    artKey: "depth",
    x: 83.3,
    y: 26.5,
    scale: 1.25,
    landmarkKo: "카이로스 심층",
  },
  {
    id: "equip",
    artKey: "equip",
    x: 83.1,
    y: 43.5,
    scale: 1.2,
    landmarkKo: "황금 금고 유적",
  },
  {
    id: "warena",
    artKey: "warena",
    x: 85.8,
    y: 60.4,
    scale: 1.25,
    landmarkKo: "의식 투기 칼데라",
  },
  {
    id: "arena",
    artKey: "arena",
    x: 85.2,
    y: 76.1,
    scale: 1.3,
    landmarkKo: "콜로세움",
  },
  {
    id: "guild",
    artKey: "guild",
    x: 80.8,
    y: 95,
    scale: 1.2,
    landmarkKo: "길드 요새",
  },
];

/**
 * Main-quest pin anchors along the center road (south → north).
 * Keep in sync with MAIN_QUEST_AREAS x/y in scenario.ts.
 * artKey retained for battle-bg / legacy lookup — not drawn as map overlays.
 */
export const STAGES_MQ_LANDMARK_LAYOUT: readonly StagesMqLandmarkDef[] = [
  { map: 1, artKey: "mq-01", x: 27.6, y: 95.2, scale: 1, areaKo: "월영숲", battleBgId: "map-01" },
  { map: 2, artKey: "mq-02", x: 35.8, y: 81.2, scale: 1, areaKo: "용맹의 탑", battleBgId: "map-02" },
  { map: 3, artKey: "mq-03", x: 52.3, y: 73.7, scale: 1, areaKo: "고대 유적", battleBgId: "map-03" },
  { map: 4, artKey: "mq-04", x: 42.9, y: 64.5, scale: 1, areaKo: "안개 습지", battleBgId: "map-04" },
  { map: 5, artKey: "mq-05", x: 60.4, y: 53.3, scale: 1, areaKo: "화염 협곡", battleBgId: "map-05" },
  { map: 6, artKey: "mq-06", x: 39.7, y: 47.4, scale: 1, areaKo: "서리 고원", battleBgId: "map-06" },
  { map: 7, artKey: "mq-07", x: 53, y: 42.8, scale: 1, areaKo: "천둥 산맥", battleBgId: "map-07" },
  { map: 8, artKey: "mq-08", x: 38.9, y: 35.5, scale: 1, areaKo: "심연 해안", battleBgId: "map-08" },
  { map: 9, artKey: "mq-09", x: 58.6, y: 33.6, scale: 1, areaKo: "봉인 성채", battleBgId: "map-09" },
  { map: 10, artKey: "mq-10", x: 49.3, y: 25, scale: 1, areaKo: "황금 사막", battleBgId: "map-10" },
  { map: 11, artKey: "mq-11", x: 43.6, y: 17.3, scale: 1, areaKo: "별빛 정글", battleBgId: "map-11" },
  { map: 12, artKey: "mq-12", x: 60.5, y: 17.5, scale: 1, areaKo: "흑요 지하", battleBgId: "map-12" },
  { map: 13, artKey: "mq-13", x: 51.8, y: 10.5, scale: 1, areaKo: "종언의 신전", battleBgId: "map-13" },
];

export function stagesLandmarkArtPath(artKey: string): string {
  return `/art/stages/landmark-${artKey}.webp?v=5`;
}

export const STAGES_TERRAIN_ART_PATH =
  "/art/stages/stages-world-terrain.webp?v=6";

export const STAGES_MAP_HOME_REGION_ID = "mq1" as const;
