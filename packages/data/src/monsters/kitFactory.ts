import { SKILL_DMG_MUL } from "../combatTune.js";
import type { SkillDef } from "../skills.js";
import type { Element, ElementKit, MonsterRole } from "./types.js";
import { basicStrike, dmg, ELEMENTS } from "./types.js";

const EL_PREFIX: Record<Element, { s1: string; s2: string; s3: string }> = {
  fire: { s1: "화염", s2: "작열", s3: "폭염" },
  water: { s1: "냉기", s2: "해일", s3: "빙결" },
  wind: { s1: "질풍", s2: "돌풍", s3: "폭풍" },
  light: { s1: "섬광", s2: "성휘", s3: "심판" },
  dark: { s1: "암영", s2: "심연", s3: "공허" },
};

function scale(stars: number, base: number): number {
  return Math.round((base + (stars - 3) * 0.08) * 100) / 100;
}

/** Damage coefficients only — heals/shields stay HP-relative. */
function dmgCoeff(stars: number, base: number): number {
  return Math.round(scale(stars, base) * SKILL_DMG_MUL * 100) / 100;
}

function attackerKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    const atkBias =
      el === "fire" ? 22 : el === "light" ? 14 : el === "dark" ? 11 : 0;
    const spdBias = el === "wind" ? 8 : 0;
    out[el] = {
      skillCoeff: dmgCoeff(stars, 1.15),
      baseStats: {
        atk: atkBias || undefined,
        spd: spdBias || undefined,
        critRate: el === "dark" || el === "light" ? 8 : undefined,
        accuracy: el === "dark" ? 10 : undefined,
      },
      skills: [
        basicStrike(`${p.s1}타격`, dmgCoeff(stars, 1.15)),
        dmg(`${p.s2}일격`, 3, dmgCoeff(stars, 1.7)),
        el === "water" || el === "dark"
          ? dmg(`${p.s3}일격`, 4, dmgCoeff(stars, 1.85), "single", "s3")
          : dmg(`${p.s3}난무`, 4, dmgCoeff(stars, 1.2), "all_enemies", "s3"),
      ],
    };
  }
  return out;
}

function supportKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    const heal = scale(stars, 0.26);
    out[el] = {
      skillCoeff: dmgCoeff(stars, 0.9),
      baseStats: {
        hp: el === "water" || el === "light" ? 200 : undefined,
        spd: el === "wind" ? 6 : undefined,
      },
      skills: [
        basicStrike(`${p.s1}탄`, dmgCoeff(stars, 0.9)),
        {
          id: "s2",
          nameKo: `${p.s2}치유`,
          cooldown: 3,
          effects: [{ kind: "heal", target: "ally_lowest", coeff: heal }],
        },
        {
          id: "s3",
          nameKo: `${p.s3}가호`,
          cooldown: 4,
          effects: [
            { kind: "heal", target: "all_allies", coeff: heal * 0.55 },
            { kind: "shield", target: "all_allies", coeff: 0.08 + stars * 0.01 },
            ...(el === "light"
              ? ([{ kind: "cleanse" as const, target: "all_allies" as const, count: 1 }] satisfies SkillDef["effects"])
              : []),
          ],
        },
      ],
    };
  }
  return out;
}

function tankKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    out[el] = {
      skillCoeff: dmgCoeff(stars, 0.95),
      role: "tank",
      baseStats: { def: el === "light" ? 40 : 20, hp: el === "water" ? 250 : 100 },
      skills: [
        basicStrike(`${p.s1}강타`, dmgCoeff(stars, 0.95)),
        {
          id: "s2",
          nameKo: `${p.s2}도발`,
          cooldown: 3,
          effects: [
            { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.2) },
            { kind: "provoke", target: "single", turns: 1 },
          ],
        },
        {
          id: "s3",
          nameKo: `${p.s3}방벽`,
          cooldown: 4,
          effects: [
            { kind: "shield", target: "self", coeff: 0.18 + stars * 0.02 },
            {
              kind: "buff",
              target: "self",
              axis: "def",
              amount: 0.2,
              turns: 2,
            },
          ],
        },
      ],
    };
  }
  return out;
}

function debufferKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    const axis =
      el === "fire"
        ? ("atk" as const)
        : el === "water"
          ? ("spd" as const)
          : el === "wind"
            ? ("spd" as const)
            : el === "light"
              ? ("accuracy" as const)
              : ("def" as const);
    out[el] = {
      skillCoeff: dmgCoeff(stars, 1.05),
      role: "debuffer",
      baseStats: { accuracy: 15 + stars * 2 },
      skills: [
        basicStrike(`${p.s1}저주`, dmgCoeff(stars, 1.0)),
        {
          id: "s2",
          nameKo: `${p.s2}약화`,
          cooldown: 3,
          effects: [
            { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.35) },
            {
              kind: "debuff",
              target: "single",
              axis,
              amount: 0.2,
              turns: 2,
            },
          ],
        },
        {
          id: "s3",
          nameKo: `${p.s3}파열`,
          cooldown: 4,
          effects: [
            {
              kind: "damage",
              target: "all_enemies",
              coeff: dmgCoeff(stars, 1.05),
            },
            {
              kind: "debuff",
              target: "all_enemies",
              axis,
              amount: 0.15,
              turns: 2,
            },
            ...(el === "water" || el === "dark"
              ? ([
                  {
                    kind: "cc" as const,
                    target: "single" as const,
                    cc: el === "water" ? ("freeze" as const) : ("stun" as const),
                    turns: 1,
                    chance: 0.35,
                  },
                ] satisfies SkillDef["effects"])
              : []),
          ],
        },
      ],
    };
  }
  return out;
}

function stonesageKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    out[el] = {
      skillCoeff: dmgCoeff(stars, 1.0),
      role: "stonesage",
      skills: [
        basicStrike(`${p.s1}각인`, dmgCoeff(stars, 1.0)),
        {
          id: "s2",
          nameKo: `${p.s2}착수`,
          cooldown: 3,
          effects: [
            { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.25) },
            { kind: "mana", amount: 8 + stars * 2 },
          ],
        },
        {
          id: "s3",
          nameKo: `${p.s3}진문`,
          cooldown: 4,
          effects: [
            {
              kind: "damage",
              target: "all_enemies",
              coeff: dmgCoeff(stars, 1.1),
            },
            { kind: "mana", amount: 12 + stars * 2 },
            {
              kind: "buff",
              target: "all_allies",
              axis: "accuracy",
              amount: 0.15,
              turns: 2,
            },
          ],
        },
      ],
    };
  }
  return out;
}

function capturerKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    out[el] = {
      skillCoeff: dmgCoeff(stars, 1.1),
      role: "capturer",
      baseStats: { spd: 4 + stars },
      skills: [
        basicStrike(`${p.s1}포획`, dmgCoeff(stars, 1.1)),
        {
          id: "s2",
          nameKo: `${p.s2}추적`,
          cooldown: 3,
          effects: [
            { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.5) },
            { kind: "mana", amount: 10 + stars },
          ],
        },
        {
          id: "s3",
          nameKo: `${p.s3}속박`,
          cooldown: 4,
          effects: [
            { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.6) },
            {
              kind: "debuff",
              target: "single",
              axis: "spd",
              amount: 0.25,
              turns: 2,
            },
            { kind: "mana", amount: 14 + stars * 2 },
          ],
        },
      ],
    };
  }
  return out;
}

export function kitsForRole(
  role: MonsterRole,
  stars: number,
): Record<Element, ElementKit> {
  switch (role) {
    case "attacker":
      return attackerKits(stars);
    case "support":
      return supportKits(stars);
    case "tank":
      return tankKits(stars);
    case "debuffer":
      return debufferKits(stars);
    case "stonesage":
      return stonesageKits(stars);
    case "capturer":
      return capturerKits(stars);
  }
}
