import type { CombatBoardSize } from "./scenarioTypes.js";

export interface StageDef {
  id: string;
  nameKo: string;
  map: number;
  stage: number;
  boardSize: CombatBoardSize;
  energyCost: number;
  enemyMonsterIds: string[];
  /** Drop symbol set id chance stub */
  dropSetId: "hwalro";
  waves: number;
}

/** 가렌숲 chapter 1 — boards grow 5→7. */
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
  },
];

export function getStage(id: string): StageDef | undefined {
  return CHAPTER1_STAGES.find((s) => s.id === id);
}
