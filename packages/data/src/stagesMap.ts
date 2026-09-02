/**
 * Expedition world-map atlas + placeable landmarks.
 * Terrain is empty (no baked buildings); landmarks are separate sprites.
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
  /** Percent of atlas width (0–100). */
  x: number;
  /** Percent of atlas height (0–100). */
  y: number;
  /** Visual scale vs default landmark size (1 = normal). */
  scale: number;
  landmarkKo: string;
};

export type StagesMqLandmarkDef = {
  /** Matches MAIN_QUEST_PIN_LAYOUT map 1–13. */
  map: number;
  artKey: string;
  x: number;
  y: number;
  scale: number;
  areaKo: string;
  /** Battle arena bg id used as art reference (map-01 … map-13). */
  battleBgId: string;
};

/**
 * Side-content landmarks on the expansive atlas.
 * Challenge Tower sits on a wide NW plateau as the hero landmark.
 * Pins share these x/y values (see SIDE_CONTENT_PIN_LAYOUT).
 */
export const STAGES_LANDMARK_LAYOUT: readonly StagesLandmarkDef[] = [
  {
    id: "challenge_tower",
    artKey: "challenge-tower",
    x: 12,
    y: 18,
    scale: 1.35,
    landmarkKo: "도전의 탑",
  },
  {
    id: "cadence",
    artKey: "cadence",
    x: 8,
    y: 48,
    scale: 1,
    landmarkKo: "룬스톤 시련림",
  },
  {
    id: "depth",
    artKey: "depth",
    x: 90,
    y: 32,
    scale: 1.1,
    landmarkKo: "카이로스 심층",
  },
  {
    id: "equip",
    artKey: "equip",
    x: 84,
    y: 46,
    scale: 1,
    landmarkKo: "황금 금고 유적",
  },
  {
    id: "warena",
    artKey: "warena",
    x: 92,
    y: 58,
    scale: 1.05,
    landmarkKo: "의식 투기 칼데라",
  },
  {
    id: "arena",
    artKey: "arena",
    x: 88,
    y: 74,
    scale: 1.1,
    landmarkKo: "콜로세움",
  },
  {
    id: "guild",
    artKey: "guild",
    x: 86,
    y: 90,
    scale: 1,
    landmarkKo: "길드 요새",
  },
];

/**
 * Main-quest region landmarks — art matches battle bg map-01…map-13 themes.
 * Coords follow a winding south→north path with left/right travel for panning.
 */
export const STAGES_MQ_LANDMARK_LAYOUT: readonly StagesMqLandmarkDef[] = [
  { map: 1, artKey: "mq-01", x: 52, y: 90, scale: 1.15, areaKo: "월영숲", battleBgId: "map-01" },
  { map: 2, artKey: "mq-02", x: 28, y: 84, scale: 1.1, areaKo: "용맹의 탑", battleBgId: "map-02" },
  { map: 3, artKey: "mq-03", x: 68, y: 78, scale: 1.1, areaKo: "고대 유적", battleBgId: "map-03" },
  { map: 4, artKey: "mq-04", x: 38, y: 72, scale: 1.05, areaKo: "안개 습지", battleBgId: "map-04" },
  { map: 5, artKey: "mq-05", x: 74, y: 66, scale: 1.1, areaKo: "화염 협곡", battleBgId: "map-05" },
  { map: 6, artKey: "mq-06", x: 22, y: 60, scale: 1.05, areaKo: "서리 고원", battleBgId: "map-06" },
  { map: 7, artKey: "mq-07", x: 58, y: 54, scale: 1.1, areaKo: "천둥 산맥", battleBgId: "map-07" },
  { map: 8, artKey: "mq-08", x: 18, y: 48, scale: 1.05, areaKo: "심연 해안", battleBgId: "map-08" },
  { map: 9, artKey: "mq-09", x: 62, y: 42, scale: 1.1, areaKo: "봉인 성채", battleBgId: "map-09" },
  { map: 10, artKey: "mq-10", x: 78, y: 36, scale: 1.05, areaKo: "황금 사막", battleBgId: "map-10" },
  { map: 11, artKey: "mq-11", x: 26, y: 30, scale: 1.05, areaKo: "별빛 정글", battleBgId: "map-11" },
  { map: 12, artKey: "mq-12", x: 64, y: 24, scale: 1.1, areaKo: "흑요 지하", battleBgId: "map-12" },
  { map: 13, artKey: "mq-13", x: 48, y: 16, scale: 1.2, areaKo: "종언의 신전", battleBgId: "map-13" },
];

export function stagesLandmarkArtPath(artKey: string): string {
  return `/art/stages/landmark-${artKey}.webp`;
}

export const STAGES_TERRAIN_ART_PATH = "/art/stages/stages-world-terrain.webp";

/** First main-quest pin id — camera home when opening the expedition map. */
export const STAGES_MAP_HOME_REGION_ID = "mq1" as const;
