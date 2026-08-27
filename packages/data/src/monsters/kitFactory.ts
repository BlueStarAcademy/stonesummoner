import { SKILL_DMG_MUL } from "../combatTune.js";
import type { SkillDef } from "../skills.js";
import type { Element, ElementKit, FamilyRosterEntry, MonsterRole } from "./types.js";
import { basicStrike, dmg, ELEMENTS } from "./types.js";
import {
  EL_PREFIX,
  familySkillDescKo,
  familySkillName,
  familySkillVfx,
  familyStemsFor,
} from "./familySkillCatalog.js";
import { skillDescForName } from "./skillDescKo.js";
import { monsterSkillVfxId } from "../skillVisuals.js";

function scale(stars: number, base: number): number {
  return Math.round((base + (stars - 3) * 0.08) * 100) / 100;
}

/** Damage coefficients only — heals/shields stay HP-relative. */
function dmgCoeff(stars: number, base: number): number {
  return Math.round(scale(stars, base) * SKILL_DMG_MUL * 100) / 100;
}

function autoDesc(sk: SkillDef, el: Element): SkillDef {
  return { ...sk, descKo: skillDescForName(sk.nameKo, el) };
}

function skillVfx(
  sk: SkillDef,
  vfxFamily: SkillDef["vfxFamily"],
  orbBolt = false,
): SkillDef {
  return { ...sk, vfxFamily, ...(orbBolt ? { orbBolt: true } : {}) };
}

function atkMelee(el: Element): boolean {
  return el === "fire" || el === "wind";
}

function s1Suffix(role: MonsterRole): string {
  switch (role) {
    case "attacker":
      return "타격";
    case "support":
      return "탄";
    case "tank":
      return "강타";
    case "debuffer":
      return "저주";
    case "stonesage":
      return "각인";
    case "capturer":
      return "포획";
  }
}

function buildS1(role: MonsterRole, el: Element, stars: number): SkillDef {
  const p = EL_PREFIX[el];
  const suffix = s1Suffix(role);
  const coeff =
    role === "attacker"
      ? dmgCoeff(stars, 1.15)
      : role === "support"
        ? dmgCoeff(stars, 0.9)
        : role === "tank"
          ? dmgCoeff(stars, 0.95)
          : role === "capturer"
            ? dmgCoeff(stars, 1.1)
            : dmgCoeff(stars, 1.0);
  const vfx =
    role === "capturer"
      ? skillVfx(autoDesc(basicStrike(`${p.s1}${suffix}`, coeff), el), "bolt", true)
      : role === "tank" || (role === "attacker" && atkMelee(el))
        ? skillVfx(autoDesc(basicStrike(`${p.s1}${suffix}`, coeff), el), "melee")
        : skillVfx(autoDesc(basicStrike(`${p.s1}${suffix}`, coeff), el), "bolt");
  return vfx;
}

function kitsForRole(stars: number, role: MonsterRole): Record<Element, ElementKit> {
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

/** Per-family kits: S1 = role basic attack; S2/S3 = family-unique per element. */
export function kitsForFamily(entry: FamilyRosterEntry): Record<Element, ElementKit> {
  const roleKit = kitsForRole(entry.naturalStars, entry.role);
  const stems = familyStemsFor(entry.familyId);
  const out = {} as Record<Element, ElementKit>;

  for (const el of ELEMENTS) {
    const base = roleKit[el];
    const s2Base = base.skills[1];
    const s3Base = base.skills[2];
    const s2Vfx = familySkillVfx(entry.role, "s2", el);
    const s3Vfx = familySkillVfx(entry.role, "s3", el);

    const skills = [
      buildS1(entry.role, el, entry.naturalStars),
      skillVfx(
        {
          id: "s2",
          nameKo: familySkillName(el, "s2", stems.s2),
          descKo: familySkillDescKo(el, "s2", entry.role),
          cooldown: s2Base.cooldown,
          effects: s2Base.effects,
        },
        s2Vfx.vfxFamily,
        s2Vfx.orbBolt,
      ),
      skillVfx(
        {
          id: "s3",
          nameKo: familySkillName(el, "s3", stems.s3),
          descKo: familySkillDescKo(el, "s3", entry.role),
          cooldown: s3Base.cooldown,
          effects: s3Base.effects,
        },
        s3Vfx.vfxFamily,
        s3Vfx.orbBolt,
      ),
    ] as const;
    out[el] = {
      ...base,
      skills: skills.map((skill, index) => ({
        ...skill,
        vfxId: monsterSkillVfxId(
          entry.familyId,
          el,
          (["s1", "s2", "s3"] as const)[index]!,
        ),
      })),
    };
  }
  return out;
}

function attackerKits(stars: number): Record<Element, ElementKit> {
  const out = {} as Record<Element, ElementKit>;
  for (const el of ELEMENTS) {
    const p = EL_PREFIX[el];
    const atkBias =
      el === "fire" ? 22 : el === "light" ? 14 : el === "dark" ? 11 : 0;
    const spdBias = el === "wind" ? 8 : 0;
    const melee = atkMelee(el);
    out[el] = {
      skillCoeff: dmgCoeff(stars, 1.15),
      baseStats: {
        atk: atkBias || undefined,
        spd: spdBias || undefined,
        critRate: el === "dark" || el === "light" ? 8 : undefined,
        accuracy: el === "dark" ? 10 : undefined,
      },
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}타격`, dmgCoeff(stars, 1.15)), el),
          melee ? "melee" : "bolt",
        ),
        skillVfx(
          autoDesc(dmg(`${p.s2}일격`, 3, dmgCoeff(stars, 1.7)), el),
          melee ? "melee" : "bolt",
        ),
        el === "water" || el === "dark"
          ? skillVfx(
              autoDesc(
                dmg(`${p.s3}일격`, 4, dmgCoeff(stars, 1.85), "single", "s3"),
                el,
              ),
              "bolt",
            )
          : skillVfx(
              autoDesc(
                dmg(`${p.s3}난무`, 4, dmgCoeff(stars, 1.2), "all_enemies", "s3"),
                el,
              ),
              "nova",
            ),
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
        skillVfx(
          autoDesc(basicStrike(`${p.s1}탄`, dmgCoeff(stars, 0.9)), el),
          "bolt",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}치유`,
              cooldown: 3,
              effects: [{ kind: "heal", target: "ally_lowest", coeff: heal }],
            },
            el,
          ),
          "support",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s3",
              nameKo: `${p.s3}가호`,
              cooldown: 4,
              effects: [
                { kind: "heal", target: "all_allies", coeff: heal * 0.55 },
                { kind: "shield", target: "all_allies", coeff: 0.08 + stars * 0.01 },
                ...(el === "light"
                  ? ([
                      { kind: "cleanse" as const, target: "all_allies" as const, count: 1 },
                    ] satisfies SkillDef["effects"])
                  : []),
              ],
            },
            el,
          ),
          "support",
        ),
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
        skillVfx(
          autoDesc(basicStrike(`${p.s1}강타`, dmgCoeff(stars, 0.95)), el),
          "melee",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}도발`,
              cooldown: 3,
              effects: [
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.2) },
                { kind: "provoke", target: "single", turns: 1 },
              ],
            },
            el,
          ),
          "melee",
        ),
        skillVfx(
          autoDesc(
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
            el,
          ),
          "support",
        ),
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
        skillVfx(
          autoDesc(basicStrike(`${p.s1}저주`, dmgCoeff(stars, 1.0)), el),
          "bolt",
        ),
        skillVfx(
          autoDesc(
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
            el,
          ),
          "bolt",
        ),
        skillVfx(
          autoDesc(
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
            el,
          ),
          "nova",
        ),
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
        skillVfx(
          autoDesc(basicStrike(`${p.s1}각인`, dmgCoeff(stars, 1.0)), el),
          "bolt",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}착수`,
              cooldown: 3,
              effects: [
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.25) },
                { kind: "mana", amount: 8 + stars * 2 },
              ],
            },
            el,
          ),
          "bolt",
          true,
        ),
        skillVfx(
          autoDesc(
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
            el,
          ),
          "nova",
        ),
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
        skillVfx(
          autoDesc(basicStrike(`${p.s1}포획`, dmgCoeff(stars, 1.1)), el),
          "bolt",
          true,
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}추적`,
              cooldown: 3,
              effects: [
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 1.5) },
                { kind: "mana", amount: 10 + stars },
              ],
            },
            el,
          ),
          "bolt",
          true,
        ),
        skillVfx(
          autoDesc(
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
            el,
          ),
          "bolt",
          true,
        ),
      ],
    };
  }
  return out;
}

/** @deprecated Use kitsForFamily — kept for tests / internal role templates. */
export function kitsForRoleExport(
  role: MonsterRole,
  stars: number,
): Record<Element, ElementKit> {
  return kitsForRole(stars, role);
}
