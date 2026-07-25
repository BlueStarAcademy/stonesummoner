export type Element = "fire" | "water" | "wind" | "light" | "dark";

export interface MonsterDef {
  id: string;
  nameKo: string;
  element: Element;
  naturalStars: number;
  role: string;
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    critRate: number;
    critDmg: number;
  };
  skillCoeff: number;
  stonePassive: string;
}

/** Phase 1 sample roster (subset of docs/monster-template.md). */
export const MONSTERS: MonsterDef[] = [
  {
    id: "fire_fang",
    nameKo: "불꽃잡이",
    element: "fire",
    naturalStars: 3,
    role: "attacker",
    baseStats: { hp: 280, atk: 130, def: 28, spd: 98, critRate: 25, critDmg: 60 },
    skillCoeff: 1.2,
    stonePassive: "따냄 시 치피 +10%",
  },
  {
    id: "dew_healer",
    nameKo: "이슬치유사",
    element: "water",
    naturalStars: 3,
    role: "support",
    baseStats: { hp: 320, atk: 70, def: 40, spd: 95, critRate: 15, critDmg: 50 },
    skillCoeff: 0.9,
    stonePassive: "실드핵 힐 증폭",
  },
  {
    id: "gale_scout",
    nameKo: "돌풍정찰",
    element: "wind",
    naturalStars: 3,
    role: "debuffer",
    baseStats: { hp: 260, atk: 110, def: 30, spd: 105, critRate: 20, critDmg: 55 },
    skillCoeff: 1.1,
    stonePassive: "착수 시 아군 ATB +5%",
  },
  {
    id: "shield_tortoise",
    nameKo: "방패거북",
    element: "water",
    naturalStars: 4,
    role: "tank",
    baseStats: { hp: 420, atk: 60, def: 70, spd: 85, critRate: 10, critDmg: 50 },
    skillCoeff: 0.8,
    stonePassive: "대마 유지 받는피해↓",
  },
  {
    id: "ash_archer",
    nameKo: "잿빛궁수",
    element: "fire",
    naturalStars: 4,
    role: "attacker",
    baseStats: { hp: 270, atk: 145, def: 26, spd: 100, critRate: 35, critDmg: 70 },
    skillCoeff: 1.3,
    stonePassive: "치명부적 +1턴",
  },
  {
    id: "seal_scholar",
    nameKo: "진문학자",
    element: "light",
    naturalStars: 4,
    role: "stonesage",
    baseStats: { hp: 300, atk: 95, def: 35, spd: 92, critRate: 15, critDmg: 50 },
    skillCoeff: 1.0,
    stonePassive: "착수 하이라이트 +1",
  },
  {
    id: "capture_hound",
    nameKo: "사석사냥꾼",
    element: "dark",
    naturalStars: 4,
    role: "capturer",
    baseStats: { hp: 290, atk: 120, def: 32, spd: 97, critRate: 20, critDmg: 55 },
    skillCoeff: 1.15,
    stonePassive: "따냄 마나 +30%",
  },
  {
    id: "thunder_lancer",
    nameKo: "천둥창병",
    element: "light",
    naturalStars: 5,
    role: "attacker",
    baseStats: { hp: 310, atk: 155, def: 34, spd: 102, critRate: 30, critDmg: 65 },
    skillCoeff: 1.35,
    stonePassive: "연타착수 15%",
  },
];

export function getMonster(id: string): MonsterDef | undefined {
  return MONSTERS.find((m) => m.id === id);
}
