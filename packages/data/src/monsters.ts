import { basicStrike, type SkillDef } from "./skills.js";

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
  /** @deprecated Prefer skills[0]; kept for fallback. */
  skillCoeff: number;
  skills: [SkillDef, SkillDef, SkillDef];
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
    skills: [
      basicStrike("할퀴기", 1.2),
      {
        id: "s2",
        nameKo: "화염일격",
        cooldown: 3,
        effects: [{ kind: "damage", target: "single", coeff: 1.7 }],
      },
      {
        id: "s3",
        nameKo: "작열",
        cooldown: 4,
        effects: [{ kind: "damage", target: "all_enemies", coeff: 1.15 }],
      },
    ],
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
    skills: [
      basicStrike("물방울", 0.9),
      {
        id: "s2",
        nameKo: "치유물결",
        cooldown: 3,
        effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.28 }],
      },
      {
        id: "s3",
        nameKo: "정화",
        cooldown: 4,
        effects: [
          { kind: "heal", target: "self", coeff: 0.18 },
          { kind: "shield", target: "self", coeff: 0.12 },
        ],
      },
    ],
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
    skills: [
      basicStrike("절삭", 1.1),
      {
        id: "s2",
        nameKo: "속도저하",
        cooldown: 3,
        effects: [{ kind: "damage", target: "single", coeff: 1.35 }],
      },
      {
        id: "s3",
        nameKo: "바람표식",
        cooldown: 4,
        effects: [{ kind: "damage", target: "single", coeff: 1.55 }],
      },
    ],
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
    skills: [
      basicStrike("충돌", 0.8),
      {
        id: "s2",
        nameKo: "도발",
        cooldown: 3,
        effects: [
          { kind: "damage", target: "single", coeff: 1.0 },
          { kind: "shield", target: "self", coeff: 0.2 },
        ],
      },
      {
        id: "s3",
        nameKo: "철벽",
        cooldown: 4,
        effects: [{ kind: "shield", target: "self", coeff: 0.35 }],
      },
    ],
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
    skills: [
      basicStrike("연사", 1.3),
      {
        id: "s2",
        nameKo: "약점조준",
        cooldown: 3,
        effects: [{ kind: "damage", target: "single", coeff: 1.85 }],
      },
      {
        id: "s3",
        nameKo: "화살비",
        cooldown: 4,
        effects: [{ kind: "damage", target: "all_enemies", coeff: 1.2 }],
      },
    ],
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
    skills: [
      basicStrike("봉인타", 1.0),
      {
        id: "s2",
        nameKo: "봉인점",
        cooldown: 3,
        effects: [
          { kind: "damage", target: "single", coeff: 1.2 },
          { kind: "mana", amount: 12 },
        ],
      },
      {
        id: "s3",
        nameKo: "진문해석",
        cooldown: 4,
        effects: [
          { kind: "damage", target: "single", coeff: 1.4 },
          { kind: "mana", amount: 20 },
        ],
      },
    ],
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
    skills: [
      basicStrike("물어뜯기", 1.15),
      {
        id: "s2",
        nameKo: "추격",
        cooldown: 3,
        effects: [{ kind: "damage", target: "single", coeff: 1.5 }],
      },
      {
        id: "s3",
        nameKo: "사석폭주",
        cooldown: 4,
        effects: [
          { kind: "damage", target: "all_enemies", coeff: 1.05 },
          { kind: "mana", amount: 18 },
        ],
      },
    ],
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
    skills: [
      basicStrike("찌르기", 1.35),
      {
        id: "s2",
        nameKo: "충전돌격",
        cooldown: 3,
        effects: [{ kind: "damage", target: "single", coeff: 1.9 }],
      },
      {
        id: "s3",
        nameKo: "낙뢰",
        cooldown: 4,
        effects: [{ kind: "damage", target: "all_enemies", coeff: 1.25 }],
      },
    ],
    stonePassive: "연타착수 15%",
  },
];

export function getMonster(id: string): MonsterDef | undefined {
  return MONSTERS.find((m) => m.id === id);
}
