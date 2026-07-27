import { basicStrike, type SkillDef } from "./skills.js";
import {
  STONE_PASSIVE_LABEL,
  type StonePassiveId,
} from "./stonePassives.js";

export type Element = "fire" | "water" | "wind" | "light" | "dark";

export const ELEMENTS: readonly Element[] = [
  "fire",
  "water",
  "wind",
  "light",
  "dark",
] as const;

export interface MonsterDef {
  id: string;
  /** Shared display name across all 5 element variants (SW-style). */
  nameKo: string;
  /** Species family key shared by element variants. */
  familyId: string;
  /** Portrait / skill-icon / spine art key (may be shared within a family). */
  artKey: string;
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
    accuracy: number;
    resistance: number;
  };
  /** @deprecated Prefer skills[0]; kept for fallback. */
  skillCoeff: number;
  skills: [SkillDef, SkillDef, SkillDef];
  stonePassiveId: StonePassiveId;
  /** Display string for UI. */
  stonePassive: string;
}

type Stats = MonsterDef["baseStats"];

type ElementKit = {
  skillCoeff: number;
  skills: [SkillDef, SkillDef, SkillDef];
  /** Optional per-element role shift (SW often changes kits by attribute). */
  role?: string;
  baseStats?: Partial<Stats>;
  stonePassiveId?: StonePassiveId;
};

type FamilySeed = {
  familyId: string;
  nameKo: string;
  /** Existing art folder / webp basename until per-element skins ship. */
  artKey: string;
  naturalStars: number;
  role: string;
  baseStats: Stats;
  stonePassiveId: StonePassiveId;
  kits: Record<Element, ElementKit>;
};

function mon(
  partial: Omit<MonsterDef, "stonePassive">,
): MonsterDef {
  return {
    ...partial,
    stonePassive: STONE_PASSIVE_LABEL[partial.stonePassiveId],
  };
}

function dmg(
  nameKo: string,
  cooldown: number,
  coeff: number,
  target: "single" | "all_enemies" = "single",
  id = "s2",
): SkillDef {
  return {
    id,
    nameKo,
    cooldown,
    effects: [{ kind: "damage", target, coeff }],
  };
}

function expandFamily(seed: FamilySeed): MonsterDef[] {
  return ELEMENTS.map((element) => {
    const kit = seed.kits[element];
    return mon({
      id: `${seed.familyId}_${element}`,
      familyId: seed.familyId,
      nameKo: seed.nameKo,
      artKey: seed.artKey,
      element,
      naturalStars: seed.naturalStars,
      role: kit.role ?? seed.role,
      baseStats: { ...seed.baseStats, ...kit.baseStats },
      skillCoeff: kit.skillCoeff,
      skills: kit.skills,
      stonePassiveId: kit.stonePassiveId ?? seed.stonePassiveId,
    });
  });
}

/**
 * Phase 1 roster: 10 families × 5 elements = 50 variants.
 * Same display name per family; skills (and often role bias) differ by element.
 * Leader skills live on the summoner — never on monsters.
 */
const FAMILIES: FamilySeed[] = [
  {
    familyId: "seokrang",
    nameKo: "석랑",
    artKey: "fire_fang",
    naturalStars: 3,
    role: "attacker",
    baseStats: {
      hp: 280,
      atk: 130,
      def: 28,
      spd: 98,
      critRate: 25,
      critDmg: 60,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "capture_crit",
    kits: {
      fire: {
        skillCoeff: 1.2,
        skills: [
          basicStrike("할퀴기", 1.2),
          dmg("화염일격", 3, 1.7),
          dmg("작열", 4, 1.15, "all_enemies", "s3"),
        ],
      },
      water: {
        skillCoeff: 1.1,
        role: "debuffer",
        baseStats: { atk: 118, spd: 100, critRate: 20 },
        skills: [
          basicStrike("냉기발톱", 1.1),
          dmg("빙결할퀴기", 3, 1.45),
          dmg("서리파열", 4, 1.5, "single", "s3"),
        ],
      },
      wind: {
        skillCoeff: 1.15,
        baseStats: { spd: 108, atk: 122 },
        skills: [
          basicStrike("질풍할퀴기", 1.15),
          dmg("연속절삭", 3, 1.55),
          dmg("돌풍난무", 4, 1.2, "all_enemies", "s3"),
        ],
      },
      light: {
        skillCoeff: 1.25,
        baseStats: { critRate: 35, critDmg: 70, atk: 135 },
        skills: [
          basicStrike("섬광할퀴기", 1.25),
          dmg("심판일격", 3, 1.9),
          dmg("성휘폭", 4, 1.25, "all_enemies", "s3"),
        ],
      },
      dark: {
        skillCoeff: 1.2,
        baseStats: { atk: 128, accuracy: 15 },
        skills: [
          basicStrike("암영할퀴기", 1.2),
          dmg("흡혈일격", 3, 1.65),
          dmg("심연발톱", 4, 1.7, "single", "s3"),
        ],
      },
    },
  },
  {
    familyId: "yeonhwa",
    nameKo: "연화",
    artKey: "dew_healer",
    naturalStars: 3,
    role: "support",
    baseStats: {
      hp: 320,
      atk: 70,
      def: 40,
      spd: 95,
      critRate: 15,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "shield_core_heal",
    kits: {
      fire: {
        skillCoeff: 0.95,
        role: "support",
        baseStats: { atk: 85, hp: 300 },
        skills: [
          basicStrike("홍련탄", 0.95),
          {
            id: "s2",
            nameKo: "온기파동",
            cooldown: 3,
            effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.22 }],
          },
          {
            id: "s3",
            nameKo: "작열치유",
            cooldown: 4,
            effects: [
              { kind: "heal", target: "self", coeff: 0.15 },
              { kind: "shield", target: "self", coeff: 0.1 },
            ],
          },
        ],
      },
      water: {
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
      },
      wind: {
        skillCoeff: 0.92,
        baseStats: { spd: 102 },
        skills: [
          basicStrike("이슬바람", 0.92),
          {
            id: "s2",
            nameKo: "산들치유",
            cooldown: 3,
            effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.24 }],
          },
          {
            id: "s3",
            nameKo: "재생바람",
            cooldown: 4,
            effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.3 }],
          },
        ],
      },
      light: {
        skillCoeff: 0.88,
        baseStats: { def: 45, resistance: 25 },
        skills: [
          basicStrike("성수방울", 0.88),
          {
            id: "s2",
            nameKo: "축복물결",
            cooldown: 3,
            effects: [
              { kind: "heal", target: "ally_lowest", coeff: 0.26 },
              { kind: "mana", amount: 8 },
            ],
          },
          {
            id: "s3",
            nameKo: "광휘정화",
            cooldown: 4,
            effects: [
              { kind: "heal", target: "self", coeff: 0.2 },
              { kind: "shield", target: "self", coeff: 0.15 },
            ],
          },
        ],
      },
      dark: {
        skillCoeff: 0.95,
        role: "debuffer",
        baseStats: { atk: 90, hp: 300 },
        skills: [
          basicStrike("암연탄", 0.95),
          {
            id: "s2",
            nameKo: "흡혈이슬",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.2 },
              { kind: "heal", target: "self", coeff: 0.12 },
            ],
          },
          {
            id: "s3",
            nameKo: "그림자치유",
            cooldown: 4,
            effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.26 }],
          },
        ],
      },
    },
  },
  {
    familyId: "cheokhu",
    nameKo: "척후",
    artKey: "gale_scout",
    naturalStars: 3,
    role: "debuffer",
    baseStats: {
      hp: 260,
      atk: 110,
      def: 30,
      spd: 105,
      critRate: 20,
      critDmg: 55,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "stone_ally_atb",
    kits: {
      fire: {
        skillCoeff: 1.15,
        role: "attacker",
        baseStats: { atk: 120, spd: 100 },
        skills: [
          basicStrike("열풍절삭", 1.15),
          dmg("화염표식", 3, 1.4),
          dmg("작열추적", 4, 1.6, "single", "s3"),
        ],
      },
      water: {
        skillCoeff: 1.05,
        baseStats: { accuracy: 20, spd: 103 },
        skills: [
          basicStrike("수막절삭", 1.05),
          dmg("냉기표식", 3, 1.35),
          dmg("빙결추적", 4, 1.55, "single", "s3"),
        ],
      },
      wind: {
        skillCoeff: 1.1,
        skills: [
          basicStrike("절삭", 1.1),
          dmg("속도저하", 3, 1.35),
          dmg("바람표식", 4, 1.55, "single", "s3"),
        ],
      },
      light: {
        skillCoeff: 1.1,
        baseStats: { critRate: 30, spd: 107 },
        skills: [
          basicStrike("섬광절삭", 1.1),
          dmg("심판표식", 3, 1.4),
          dmg("광휘추적", 4, 1.6, "single", "s3"),
        ],
      },
      dark: {
        skillCoeff: 1.12,
        baseStats: { accuracy: 25 },
        skills: [
          basicStrike("암영절삭", 1.12),
          dmg("저주표식", 3, 1.4),
          dmg("심연추적", 4, 1.65, "single", "s3"),
        ],
      },
    },
  },
  {
    familyId: "cheolgap",
    nameKo: "철갑",
    artKey: "shield_tortoise",
    naturalStars: 4,
    role: "tank",
    baseStats: {
      hp: 420,
      atk: 60,
      def: 70,
      spd: 85,
      critRate: 10,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "high_amp_dr",
    kits: {
      fire: {
        skillCoeff: 0.85,
        baseStats: { def: 65, atk: 70 },
        skills: [
          basicStrike("화염충돌", 0.85),
          {
            id: "s2",
            nameKo: "작열도발",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.05 },
              { kind: "shield", target: "self", coeff: 0.18 },
            ],
          },
          {
            id: "s3",
            nameKo: "용암철벽",
            cooldown: 4,
            effects: [{ kind: "shield", target: "self", coeff: 0.32 }],
          },
        ],
      },
      water: {
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
      },
      wind: {
        skillCoeff: 0.82,
        baseStats: { spd: 92, def: 66 },
        skills: [
          basicStrike("돌풍충돌", 0.82),
          {
            id: "s2",
            nameKo: "회피도발",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 0.95 },
              { kind: "shield", target: "self", coeff: 0.22 },
            ],
          },
          {
            id: "s3",
            nameKo: "질풍철벽",
            cooldown: 4,
            effects: [{ kind: "shield", target: "self", coeff: 0.3 }],
          },
        ],
      },
      light: {
        skillCoeff: 0.8,
        baseStats: { resistance: 30, hp: 440 },
        skills: [
          basicStrike("성광충돌", 0.8),
          {
            id: "s2",
            nameKo: "수호도발",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 0.95 },
              { kind: "shield", target: "self", coeff: 0.24 },
            ],
          },
          {
            id: "s3",
            nameKo: "성벽",
            cooldown: 4,
            effects: [{ kind: "shield", target: "self", coeff: 0.38 }],
          },
        ],
      },
      dark: {
        skillCoeff: 0.85,
        baseStats: { hp: 450, def: 68 },
        skills: [
          basicStrike("암영충돌", 0.85),
          {
            id: "s2",
            nameKo: "저주도발",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.1 },
              { kind: "shield", target: "self", coeff: 0.18 },
            ],
          },
          {
            id: "s3",
            nameKo: "심연철벽",
            cooldown: 4,
            effects: [{ kind: "shield", target: "self", coeff: 0.36 }],
          },
        ],
      },
    },
  },
  {
    familyId: "myeongsa",
    nameKo: "명사",
    artKey: "ash_archer",
    naturalStars: 4,
    role: "attacker",
    baseStats: {
      hp: 270,
      atk: 145,
      def: 26,
      spd: 100,
      critRate: 35,
      critDmg: 70,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "crit_charm_plus",
    kits: {
      fire: {
        skillCoeff: 1.3,
        skills: [
          basicStrike("연사", 1.3),
          dmg("약점조준", 3, 1.85),
          dmg("화살비", 4, 1.2, "all_enemies", "s3"),
        ],
      },
      water: {
        skillCoeff: 1.2,
        baseStats: { accuracy: 20, critRate: 30 },
        skills: [
          basicStrike("수연사", 1.2),
          dmg("빙결조준", 3, 1.75),
          dmg("물화살비", 4, 1.15, "all_enemies", "s3"),
        ],
      },
      wind: {
        skillCoeff: 1.25,
        baseStats: { spd: 110, critRate: 32 },
        skills: [
          basicStrike("질풍연사", 1.25),
          dmg("관통조준", 3, 1.8),
          dmg("폭풍화살", 4, 1.22, "all_enemies", "s3"),
        ],
      },
      light: {
        skillCoeff: 1.35,
        baseStats: { critRate: 40, critDmg: 75 },
        skills: [
          basicStrike("섬광연사", 1.35),
          dmg("심판조준", 3, 2.0),
          dmg("성화살비", 4, 1.28, "all_enemies", "s3"),
        ],
      },
      dark: {
        skillCoeff: 1.28,
        baseStats: { accuracy: 25, atk: 148 },
        skills: [
          basicStrike("암연사", 1.28),
          dmg("저주조준", 3, 1.9),
          dmg("심연화살", 4, 1.25, "all_enemies", "s3"),
        ],
      },
    },
  },
  {
    familyId: "yeongmae",
    nameKo: "영매",
    artKey: "mist_shaman",
    naturalStars: 4,
    role: "support",
    baseStats: {
      hp: 310,
      atk: 85,
      def: 38,
      spd: 96,
      critRate: 15,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "stone_ally_heal",
    kits: {
      fire: {
        skillCoeff: 1.0,
        baseStats: { atk: 95 },
        skills: [
          basicStrike("홍연탄", 1.0),
          {
            id: "s2",
            nameKo: "화염축복",
            cooldown: 3,
            effects: [
              { kind: "heal", target: "ally_lowest", coeff: 0.1 },
              { kind: "mana", amount: 12 },
            ],
          },
          {
            id: "s3",
            nameKo: "작열안개",
            cooldown: 4,
            effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.28 }],
          },
        ],
      },
      water: {
        skillCoeff: 0.95,
        skills: [
          basicStrike("수무탄", 0.95),
          {
            id: "s2",
            nameKo: "치유축복",
            cooldown: 3,
            effects: [
              { kind: "heal", target: "ally_lowest", coeff: 0.14 },
              { kind: "mana", amount: 10 },
            ],
          },
          {
            id: "s3",
            nameKo: "심해안개",
            cooldown: 4,
            effects: [{ kind: "heal", target: "ally_lowest", coeff: 0.34 }],
          },
        ],
      },
      wind: {
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
      },
      light: {
        skillCoeff: 0.9,
        baseStats: { resistance: 25 },
        skills: [
          basicStrike("성무탄", 0.9),
          {
            id: "s2",
            nameKo: "광휘축복",
            cooldown: 3,
            effects: [
              { kind: "heal", target: "ally_lowest", coeff: 0.15 },
              { kind: "mana", amount: 14 },
            ],
          },
          {
            id: "s3",
            nameKo: "성역안개",
            cooldown: 4,
            effects: [
              { kind: "heal", target: "ally_lowest", coeff: 0.3 },
              { kind: "shield", target: "self", coeff: 0.1 },
            ],
          },
        ],
      },
      dark: {
        skillCoeff: 1.0,
        role: "debuffer",
        baseStats: { atk: 100, accuracy: 15 },
        skills: [
          basicStrike("암무탄", 1.0),
          {
            id: "s2",
            nameKo: "저주안개",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.25 },
              { kind: "mana", amount: 10 },
            ],
          },
          {
            id: "s3",
            nameKo: "심연안개",
            cooldown: 4,
            effects: [
              { kind: "heal", target: "ally_lowest", coeff: 0.22 },
              { kind: "damage", target: "all_enemies", coeff: 0.85 },
            ],
          },
        ],
      },
    },
  },
  {
    familyId: "jinmunsa",
    nameKo: "진문사",
    artKey: "seal_scholar",
    naturalStars: 4,
    role: "stonesage",
    baseStats: {
      hp: 300,
      atk: 95,
      def: 35,
      spd: 92,
      critRate: 15,
      critDmg: 50,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "suggest_plus",
    kits: {
      fire: {
        skillCoeff: 1.05,
        baseStats: { atk: 105 },
        skills: [
          basicStrike("화봉인타", 1.05),
          {
            id: "s2",
            nameKo: "작열봉인",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.25 },
              { kind: "mana", amount: 10 },
            ],
          },
          {
            id: "s3",
            nameKo: "화진해석",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "single", coeff: 1.45 },
              { kind: "mana", amount: 18 },
            ],
          },
        ],
      },
      water: {
        skillCoeff: 0.98,
        skills: [
          basicStrike("수봉인타", 0.98),
          {
            id: "s2",
            nameKo: "수막봉인",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.15 },
              { kind: "mana", amount: 14 },
            ],
          },
          {
            id: "s3",
            nameKo: "수진해석",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "single", coeff: 1.35 },
              { kind: "mana", amount: 22 },
            ],
          },
        ],
      },
      wind: {
        skillCoeff: 1.0,
        baseStats: { spd: 100 },
        skills: [
          basicStrike("풍봉인타", 1.0),
          {
            id: "s2",
            nameKo: "질풍봉인",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.2 },
              { kind: "mana", amount: 12 },
            ],
          },
          {
            id: "s3",
            nameKo: "풍진해석",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "single", coeff: 1.4 },
              { kind: "mana", amount: 20 },
            ],
          },
        ],
      },
      light: {
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
      },
      dark: {
        skillCoeff: 1.05,
        baseStats: { accuracy: 20 },
        skills: [
          basicStrike("암봉인타", 1.05),
          {
            id: "s2",
            nameKo: "심연봉인",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.3 },
              { kind: "mana", amount: 12 },
            ],
          },
          {
            id: "s3",
            nameKo: "암진해석",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "single", coeff: 1.5 },
              { kind: "mana", amount: 18 },
            ],
          },
        ],
      },
    },
  },
  {
    familyId: "pohwagyeon",
    nameKo: "포획견",
    artKey: "capture_hound",
    naturalStars: 4,
    role: "capturer",
    baseStats: {
      hp: 290,
      atk: 120,
      def: 32,
      spd: 97,
      critRate: 20,
      critDmg: 55,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "capture_mana",
    kits: {
      fire: {
        skillCoeff: 1.2,
        baseStats: { atk: 128 },
        skills: [
          basicStrike("화염물어뜯기", 1.2),
          dmg("작열추격", 3, 1.55),
          {
            id: "s3",
            nameKo: "화석폭주",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "all_enemies", coeff: 1.1 },
              { kind: "mana", amount: 16 },
            ],
          },
        ],
      },
      water: {
        skillCoeff: 1.1,
        skills: [
          basicStrike("수막물어뜯기", 1.1),
          dmg("빙결추격", 3, 1.45),
          {
            id: "s3",
            nameKo: "수석폭주",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "all_enemies", coeff: 1.0 },
              { kind: "mana", amount: 20 },
            ],
          },
        ],
      },
      wind: {
        skillCoeff: 1.15,
        baseStats: { spd: 105 },
        skills: [
          basicStrike("질풍물어뜯기", 1.15),
          dmg("돌풍추격", 3, 1.5),
          {
            id: "s3",
            nameKo: "풍석폭주",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "all_enemies", coeff: 1.08 },
              { kind: "mana", amount: 18 },
            ],
          },
        ],
      },
      light: {
        skillCoeff: 1.15,
        baseStats: { critRate: 28 },
        skills: [
          basicStrike("성광물어뜯기", 1.15),
          dmg("심판추격", 3, 1.55),
          {
            id: "s3",
            nameKo: "성석폭주",
            cooldown: 4,
            effects: [
              { kind: "damage", target: "all_enemies", coeff: 1.12 },
              { kind: "mana", amount: 18 },
            ],
          },
        ],
      },
      dark: {
        skillCoeff: 1.15,
        skills: [
          basicStrike("물어뜯기", 1.15),
          dmg("추격", 3, 1.5),
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
      },
    },
  },
  {
    familyId: "changsu",
    nameKo: "창수",
    artKey: "thunder_lancer",
    naturalStars: 5,
    role: "attacker",
    baseStats: {
      hp: 310,
      atk: 155,
      def: 34,
      spd: 102,
      critRate: 30,
      critDmg: 65,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "stone_amp_proc",
    kits: {
      fire: {
        skillCoeff: 1.4,
        baseStats: { atk: 160, critDmg: 70 },
        skills: [
          basicStrike("화염찌르기", 1.4),
          dmg("작열돌격", 3, 1.95),
          dmg("화염창폭", 4, 1.3, "all_enemies", "s3"),
        ],
      },
      water: {
        skillCoeff: 1.3,
        baseStats: { accuracy: 20 },
        skills: [
          basicStrike("수창찌르기", 1.3),
          dmg("빙결돌격", 3, 1.85),
          dmg("수창폭", 4, 1.22, "all_enemies", "s3"),
        ],
      },
      wind: {
        skillCoeff: 1.35,
        baseStats: { spd: 112 },
        skills: [
          basicStrike("질풍찌르기", 1.35),
          dmg("돌풍돌격", 3, 1.9),
          dmg("풍창폭", 4, 1.28, "all_enemies", "s3"),
        ],
      },
      light: {
        skillCoeff: 1.35,
        skills: [
          basicStrike("찌르기", 1.35),
          dmg("충전돌격", 3, 1.9),
          dmg("낙뢰", 4, 1.25, "all_enemies", "s3"),
        ],
      },
      dark: {
        skillCoeff: 1.38,
        baseStats: { accuracy: 20, atk: 158 },
        skills: [
          basicStrike("암영찌르기", 1.38),
          dmg("심연돌격", 3, 2.0),
          dmg("암창폭", 4, 1.3, "all_enemies", "s3"),
        ],
      },
    },
  },
  {
    familyId: "jegwan",
    nameKo: "제관",
    artKey: "abyss_priest",
    naturalStars: 5,
    role: "debuffer",
    baseStats: {
      hp: 300,
      atk: 125,
      def: 36,
      spd: 94,
      critRate: 20,
      critDmg: 60,
      accuracy: 0,
      resistance: 15,
    },
    stonePassiveId: "capture_amp",
    kits: {
      fire: {
        skillCoeff: 1.15,
        role: "attacker",
        baseStats: { atk: 135 },
        skills: [
          basicStrike("작열저주", 1.15),
          dmg("화염침묵", 3, 1.5),
          dmg("홍련의 눈", 5, 1.2, "all_enemies", "s3"),
        ],
      },
      water: {
        skillCoeff: 1.05,
        role: "support",
        baseStats: { atk: 110, hp: 320 },
        skills: [
          basicStrike("냉기저주", 1.05),
          {
            id: "s2",
            nameKo: "빙결침묵",
            cooldown: 3,
            effects: [
              { kind: "damage", target: "single", coeff: 1.35 },
              { kind: "heal", target: "self", coeff: 0.1 },
            ],
          },
          dmg("심해의 눈", 5, 1.05, "all_enemies", "s3"),
        ],
      },
      wind: {
        skillCoeff: 1.1,
        baseStats: { spd: 102, accuracy: 15 },
        skills: [
          basicStrike("질풍저주", 1.1),
          dmg("돌풍침묵", 3, 1.45),
          dmg("폭풍의 눈", 5, 1.12, "all_enemies", "s3"),
        ],
      },
      light: {
        skillCoeff: 1.1,
        baseStats: { resistance: 25, critRate: 25 },
        skills: [
          basicStrike("성광저주", 1.1),
          dmg("심판침묵", 3, 1.5),
          dmg("광휘의 눈", 5, 1.15, "all_enemies", "s3"),
        ],
      },
      dark: {
        skillCoeff: 1.1,
        skills: [
          basicStrike("저주", 1.1),
          dmg("침묵", 3, 1.45),
          dmg("심연의 눈", 5, 1.1, "all_enemies", "s3"),
        ],
      },
    },
  },
];

/** Phase 1: 10 families × 5 elements. */
export const MONSTERS: MonsterDef[] = FAMILIES.flatMap(expandFamily);

/** Old Phase-1 unique ids → family_element ids (save / scenario migration). */
export const LEGACY_MONSTER_IDS: Readonly<Record<string, string>> = {
  fire_fang: "seokrang_fire",
  dew_healer: "yeonhwa_water",
  gale_scout: "cheokhu_wind",
  shield_tortoise: "cheolgap_water",
  ash_archer: "myeongsa_fire",
  mist_shaman: "yeongmae_wind",
  seal_scholar: "jinmunsa_light",
  capture_hound: "pohwagyeon_dark",
  thunder_lancer: "changsu_light",
  abyss_priest: "jegwan_dark",
};

export function resolveMonsterId(id: string): string {
  return LEGACY_MONSTER_IDS[id] ?? id;
}

export function getMonster(id: string): MonsterDef | undefined {
  const resolved = resolveMonsterId(id);
  return MONSTERS.find((m) => m.id === resolved);
}

export function getMonsterArtKey(id: string | undefined | null): string | null {
  if (!id) return null;
  const def = getMonster(id);
  if (def) return def.artKey;
  return LEGACY_MONSTER_IDS[id] ? getMonster(id)?.artKey ?? id : id;
}

export function listMonsterFamilies(): {
  familyId: string;
  nameKo: string;
  naturalStars: number;
  artKey: string;
}[] {
  const seen = new Set<string>();
  const out: {
    familyId: string;
    nameKo: string;
    naturalStars: number;
    artKey: string;
  }[] = [];
  for (const m of MONSTERS) {
    if (seen.has(m.familyId)) continue;
    seen.add(m.familyId);
    out.push({
      familyId: m.familyId,
      nameKo: m.nameKo,
      naturalStars: m.naturalStars,
      artKey: m.artKey,
    });
  }
  return out;
}
