import { basicStrike, type SkillDef } from "./skills.js";
import {
  STONE_PASSIVE_LABEL,
  type StonePassiveId,
} from "./stonePassives.js";

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
  stonePassiveId: StonePassiveId;
  /** Display string for UI. */
  stonePassive: string;
}

function mon(
  partial: Omit<MonsterDef, "stonePassive">,
): MonsterDef {
  return {
    ...partial,
    stonePassive: STONE_PASSIVE_LABEL[partial.stonePassiveId],
  };
}

/** Phase 1 sample roster (docs/monster-template.md 10종). */
export const MONSTERS: MonsterDef[] = [
  mon({
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
    stonePassiveId: "capture_crit",
  }),
  mon({
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
    stonePassiveId: "shield_core_heal",
  }),
  mon({
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
    stonePassiveId: "stone_ally_atb",
  }),
  mon({
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
    stonePassiveId: "high_amp_dr",
  }),
  mon({
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
    stonePassiveId: "crit_charm_plus",
  }),
  mon({
    id: "mist_shaman",
    nameKo: "안개무녀",
    element: "wind",
    naturalStars: 4,
    role: "support",
    baseStats: { hp: 310, atk: 85, def: 38, spd: 96, critRate: 15, critDmg: 50 },
    skillCoeff: 0.95,
    skills: [
      basicStrike("안개탄", 0.95),
      {
        id: "s2",
        nameKo: "공속버프",
        cooldown: 3,
        effects: [
          { kind: "heal", target: "ally_lowest", coeff: 0.12 },
          { kind: "mana", amount: 10 },
        ],
      },
      {
        id: "s3",
        nameKo: "재생안개",
        cooldown: 4,
        effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.32 }],
      },
    ],
    stonePassiveId: "stone_ally_heal",
  }),
  mon({
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
    stonePassiveId: "suggest_plus",
  }),
  mon({
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
    stonePassiveId: "capture_mana",
  }),
  mon({
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
    stonePassiveId: "stone_amp_proc",
  }),
  mon({
    id: "abyss_priest",
    nameKo: "심연사제",
    element: "dark",
    naturalStars: 5,
    role: "debuffer",
    baseStats: { hp: 300, atk: 125, def: 36, spd: 94, critRate: 20, critDmg: 60 },
    skillCoeff: 1.1,
    skills: [
      basicStrike("저주", 1.1),
      {
        id: "s2",
        nameKo: "침묵",
        cooldown: 3,
        effects: [{ kind: "damage", target: "single", coeff: 1.45 }],
      },
      {
        id: "s3",
        nameKo: "심연의 눈",
        cooldown: 5,
        effects: [{ kind: "damage", target: "all_enemies", coeff: 1.1 }],
      },
    ],
    stonePassiveId: "capture_amp",
  }),
];

export function getMonster(id: string): MonsterDef | undefined {
  return MONSTERS.find((m) => m.id === id);
}
