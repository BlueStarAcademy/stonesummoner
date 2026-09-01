/**
 * Expedition world-map atlas + placeable landmarks.
 * Terrain is empty (no baked buildings); landmarks are separate sprites.
 */

export const STAGES_MAP_NATURAL = { w: 2160, h: 2880 } as const;

export type StagesLandmarkId =
  | "challenge_tower"
  | "cadence"
  | "depth"
  | "equip"
  | "warena"
  | "arena"
  | "guild";

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

/**
 * Side-content landmarks on the expansive atlas.
 * Challenge Tower sits on a wide NW plateau as the hero landmark.
 * Pins share these x/y values (see SIDE_CONTENT_PIN_LAYOUT).
 */
export const STAGES_LANDMARK_LAYOUT: readonly StagesLandmarkDef[] = [
  {
    id: "challenge_tower",
    artKey: "challenge-tower",
    x: 16,
    y: 24,
    scale: 1.35,
    landmarkKo: "도전의 탑",
  },
  {
    id: "cadence",
    artKey: "cadence",
    x: 10,
    y: 52,
    scale: 1,
    landmarkKo: "룬스톤 시련림",
  },
  {
    id: "depth",
    artKey: "depth",
    x: 88,
    y: 36,
    scale: 1.1,
    landmarkKo: "카이로스 심층",
  },
  {
    id: "equip",
    artKey: "equip",
    x: 78,
    y: 48,
    scale: 1,
    landmarkKo: "황금 금고 유적",
  },
  {
    id: "warena",
    artKey: "warena",
    x: 90,
    y: 58,
    scale: 1.05,
    landmarkKo: "의식 투기 칼데라",
  },
  {
    id: "arena",
    artKey: "arena",
    x: 88,
    y: 76,
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

export function stagesLandmarkArtPath(artKey: string): string {
  return `/art/stages/landmark-${artKey}.webp`;
}

export const STAGES_TERRAIN_ART_PATH = "/art/stages/stages-world-terrain.webp";
