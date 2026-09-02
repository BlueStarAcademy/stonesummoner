import { SKILL_DMG_MUL } from "../combatTune.js";
import type { SkillDef, SkillEffect, StatModAxis } from "../skills.js";
import type {
  BalanceArchetype,
  Element,
  ElementKit,
  FamilyRosterEntry,
  MonsterRole,
} from "./types.js";
import { basicStrike, dmg, ELEMENTS } from "./types.js";
import {
  EL_PREFIX,
  familySkillName,
  familySkillVfx,
  familyStemsFor,
} from "./familySkillCatalog.js";
import {
  familyKitProfile,
  type FamilySkillProfile,
  type KitMechanic,
} from "./familyKitProfiles.js";
import { skillDescForName } from "./skillDescKo.js";
import { monsterSkillVfxId } from "../skillVisuals.js";

/**
 * Summoners War–style ATK% coefficient (3.7 = 370%).
 * Natural stars do **not** inflate skill % — star power comes from base stats.
 */
function dmgCoeff(_stars: number, atkPct: number): number {
  return Math.round(atkPct * 100) / 100;
}

/** Mild utility scale (heal/shield/mana) — keeps high-nat supports slightly stronger. */
function utilScale(stars: number, base: number, perStar = 0.02): number {
  return Math.round((base + (stars - 3) * perStar) * 100) / 100;
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

function s1Suffix(role: BalanceArchetype): string {
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

function buildS1(role: BalanceArchetype, el: Element, stars: number): SkillDef {
  const p = EL_PREFIX[el];
  const suffix = s1Suffix(role);
  const coeff =
    role === "attacker"
      ? dmgCoeff(stars, 3.7)
      : role === "support"
        ? dmgCoeff(stars, 3.0)
        : role === "tank"
          ? dmgCoeff(stars, 3.2)
          : role === "capturer"
            ? dmgCoeff(stars, 3.8)
            : dmgCoeff(stars, 3.4);
  const vfx =
    role === "capturer"
      ? skillVfx(autoDesc(basicStrike(`${p.s1}${suffix}`, coeff), el), "bolt", true)
      : role === "tank" || (role === "attacker" && atkMelee(el))
        ? skillVfx(autoDesc(basicStrike(`${p.s1}${suffix}`, coeff), el), "melee")
        : skillVfx(autoDesc(basicStrike(`${p.s1}${suffix}`, coeff), el), "bolt");
  return vfx;
}

function kitsForRole(stars: number, role: BalanceArchetype): Record<Element, ElementKit> {
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

function alliedTarget(stars: number): "ally_lowest" | "all_allies" {
  return stars >= 4 ? "all_allies" : "ally_lowest";
}

function enemyTarget(
  stars: number,
  element: Element,
): "single" | "all_enemies" {
  return stars >= 4 && (element === "fire" || element === "dark")
    ? "all_enemies"
    : "single";
}

function elementAxis(element: Element): StatModAxis {
  return {
    fire: "atk",
    water: "def",
    wind: "spd",
    light: "accuracy",
    dark: "critRate",
  }[element] as StatModAxis;
}

function mechanicEffects(
  mechanic: KitMechanic,
  role: MonsterRole,
  element: Element,
  stars: number,
  light = false,
): SkillEffect[] {
  const ally = light ? "self" : alliedTarget(stars);
  const enemy = enemyTarget(stars, element);
  const turns = light ? 1 : stars >= 5 ? 3 : 2;
  const chance = light ? 0.2 : stars >= 4 ? 0.75 : 0.6;
  switch (mechanic) {
    case "heal":
      return [{ kind: "heal", target: ally, coeff: light ? 0.04 : 0.12 + stars * 0.015 }];
    case "buff":
      return [{ kind: "buff", target: ally === "self" ? "self" : "all_allies", axis: elementAxis(element), amount: light ? 0.08 : 0.2, turns }];
    case "debuff":
      return [{ kind: "debuff", target: enemy, axis: elementAxis(element), amount: light ? 0.08 : 0.2, turns }];
    case "dot":
      return [{ kind: "dot", target: enemy, coeff: light ? 0.06 : 0.12, turns }];
    case "strip":
      return [{ kind: "strip", target: enemy, count: light ? 1 : stars >= 5 ? 2 : 1 }];
    case "cleanse":
      return [{ kind: "cleanse", target: ally === "self" ? "self" : "all_allies", count: light ? 1 : stars >= 5 ? 2 : 1 }];
    case "cc":
      return [{ kind: "cc", target: enemy, cc: element === "water" ? "freeze" : element === "wind" ? "sleep" : "stun", turns: 1, chance }];
    case "hot":
      return [{ kind: "hot", target: ally, coeff: light ? 0.025 : 0.07 + stars * 0.005, turns }];
    case "heal_block":
      return [{ kind: "heal_block", target: enemy, turns, chance }];
    case "silence":
      return [{ kind: "silence", target: enemy, turns: light ? 1 : 2, chance }];
    case "atb_gain":
      return [{ kind: "atb", target: ally, amount: light ? 6 : 18 + stars }];
    case "atb_drain":
      return [{ kind: "atb", target: enemy, amount: light ? -5 : -18 - stars }];
    case "revive":
      return [{ kind: "revive", target: "ally_lowest", hpFraction: 0.2 + stars * 0.04 }];
    case "cooldown_down":
      return [{ kind: "cooldown", target: ally, direction: "decrease", amount: stars >= 5 ? 2 : 1 }];
    case "cooldown_up":
      return [{ kind: "cooldown", target: enemy, direction: "increase", amount: stars >= 5 ? 2 : 1 }];
    case "damage_share":
      return [{ kind: "damage_share", target: ally, fraction: light ? 0.08 : 0.2 + stars * 0.02, turns }];
    case "reflect":
      return [{ kind: "reflect", target: ally === "self" ? "self" : "all_allies", fraction: light ? 0.08 : 0.18 + stars * 0.02, turns }];
    case "provoke":
      return [{ kind: "provoke", target: "single", turns: 1, chance }];
    case "shield":
      return [{ kind: "shield", target: ally === "self" ? "self" : "all_allies", coeff: light ? 0.04 : 0.12 + stars * 0.01 }];
    case "mana":
      return [{ kind: "mana", amount: light ? 2 : 8 + stars * 2 }];
  }
}

const EFFECT_DESC: Record<SkillEffect["kind"], string> = {
  damage: "피해를 입힙니다",
  heal: "체력을 회복합니다",
  hot: "지속 회복을 부여합니다",
  shield: "실드를 부여합니다",
  mana: "마나를 얻습니다",
  buff: "능력치를 높입니다",
  debuff: "능력치를 낮춥니다",
  dot: "지속 피해를 부여합니다",
  cc: "행동을 방해합니다",
  strip: "강화 효과를 제거합니다",
  cleanse: "약화 효과를 해제합니다",
  heal_block: "회복을 막습니다",
  silence: "스킬 사용을 봉인합니다",
  atb: "공격 게이지를 조정합니다",
  revive: "쓰러진 아군을 되살립니다",
  cooldown: "스킬 재사용 대기시간을 조정합니다",
  damage_share: "받는 피해를 나눕니다",
  reflect: "받은 피해를 반사합니다",
  provoke: "적을 도발합니다",
};

function effectsDesc(
  effects: readonly SkillEffect[],
  element: Element,
): string {
  const elementName = {
    fire: "불",
    water: "물",
    wind: "바람",
    light: "빛",
    dark: "어둠",
  }[element];
  return `${elementName}의 힘으로 ` +
    effects.map((effect) => EFFECT_DESC[effect.kind]).join(" 그리고 ") +
    ".";
}

function damageEffect(
  base: SkillDef,
  entry: FamilyRosterEntry,
  element: Element,
): SkillEffect | undefined {
  const original = base.effects.find(
    (effect): effect is Extract<SkillEffect, { kind: "damage" }> =>
      effect.kind === "damage",
  );
  if (!original) return undefined;
  const source =
    entry.familyId === "doom_oracle" || entry.familyId === "absolute_captor"
      ? "targetMaxHp"
      : entry.role === "hp"
        ? "maxHp"
        : entry.role === "defense"
          ? "def"
          : entry.role === "speed"
            ? "spd"
            : "atk";
  const sourceFactor =
    source === "maxHp"
      ? 0.06
      : source === "targetMaxHp"
        ? 0.04
        : source === "spd"
          ? 3
          : 1;
  return {
    ...original,
    source,
    sourceFactor,
    ...(entry.role === "attacker" && element === "dark"
      ? { ignoreDef: 0.2 }
      : {}),
  };
}

function buildProfileSkill(
  slot: "s2" | "s3",
  base: SkillDef,
  profile: FamilySkillProfile,
  entry: FamilyRosterEntry,
  element: Element,
  nameKo: string,
): SkillDef {
  const damage = profile.damage ? damageEffect(base, entry, element) : undefined;
  const effects = [
    ...(damage ? [damage] : []),
    ...mechanicEffects(profile.mechanic, entry.role, element, entry.naturalStars),
  ];
  return {
    id: slot,
    nameKo,
    descKo: effectsDesc(effects, element),
    cooldown: profile.cooldown,
    effects,
  };
}

/** Per-family kits composed from display role, family profile, and element. */
export function kitsForFamily(entry: FamilyRosterEntry): Record<Element, ElementKit> {
  const roleKit = kitsForRole(entry.naturalStars, entry.balanceArchetype);
  const profile = familyKitProfile(entry.familyId);
  const stems = familyStemsFor(entry.familyId);
  const out = {} as Record<Element, ElementKit>;

  for (const el of ELEMENTS) {
    const base = roleKit[el];
    const s2Base = base.skills[1];
    const s3Base = base.skills[2];
    const s2Vfx = familySkillVfx(entry.familyIdentity, "s2", el);
    const s3Vfx = familySkillVfx(entry.familyIdentity, "s3", el);
    const s1Base = buildS1(entry.balanceArchetype, el, entry.naturalStars);
    const s1Effects = [
      ...s1Base.effects,
      ...mechanicEffects(profile.s1, entry.role, el, entry.naturalStars, true),
    ];

    const skills = [
      {
        ...s1Base,
        descKo: effectsDesc(s1Effects, el),
        effects: s1Effects,
      },
      skillVfx(
        buildProfileSkill(
          "s2",
          s2Base,
          profile.s2,
          entry,
          el,
          familySkillName(el, "s2", stems.s2),
        ),
        s2Vfx.vfxFamily,
        s2Vfx.orbBolt,
      ),
      skillVfx(
        buildProfileSkill(
          "s3",
          s3Base,
          profile.s3,
          entry,
          el,
          familySkillName(el, "s3", stems.s3),
        ),
        s3Vfx.vfxFamily,
        s3Vfx.orbBolt,
      ),
    ] as const;
    const skillsWithVfx = skills.map((skill, index) => ({
      ...skill,
      vfxId: monsterSkillVfxId(
        entry.familyId,
        el,
        (["s1", "s2", "s3"] as const)[index]!,
      ),
    })) as [SkillDef, SkillDef, SkillDef];
    out[el] = {
      ...base,
      role: entry.role,
      skills: skillsWithVfx,
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
      skillCoeff: dmgCoeff(stars, 3.7),
      baseStats: {
        atk: atkBias || undefined,
        spd: spdBias || undefined,
        critRate: el === "dark" || el === "light" ? 8 : undefined,
        accuracy: el === "dark" ? 10 : undefined,
      },
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}타격`, dmgCoeff(stars, 3.7)), el),
          melee ? "melee" : "bolt",
        ),
        skillVfx(
          autoDesc(dmg(`${p.s2}일격`, 3, dmgCoeff(stars, 5.6)), el),
          melee ? "melee" : "bolt",
        ),
        el === "water" || el === "dark"
          ? skillVfx(
              autoDesc(
                dmg(`${p.s3}일격`, 4, dmgCoeff(stars, 7.2), "single", "s3"),
                el,
              ),
              "bolt",
            )
          : skillVfx(
              autoDesc(
                dmg(`${p.s3}난무`, 4, dmgCoeff(stars, 4.0), "all_enemies", "s3"),
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
    const heal = utilScale(stars, 0.25);
    out[el] = {
      skillCoeff: dmgCoeff(stars, 3.0),
      baseStats: {
        hp: el === "water" || el === "light" ? 200 : undefined,
        spd: el === "wind" ? 6 : undefined,
      },
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}탄`, dmgCoeff(stars, 3.0)), el),
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
      skillCoeff: dmgCoeff(stars, 3.2),
      baseStats: { def: el === "light" ? 40 : 20, hp: el === "water" ? 250 : 100 },
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}강타`, dmgCoeff(stars, 3.2)), el),
          "melee",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}도발`,
              cooldown: 3,
              effects: [
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 4.0) },
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
      skillCoeff: dmgCoeff(stars, 3.6),
      baseStats: { accuracy: 15 + stars * 2 },
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}저주`, dmgCoeff(stars, 3.4)), el),
          "bolt",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}약화`,
              cooldown: 3,
              effects: [
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 4.6) },
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
                  coeff: dmgCoeff(stars, 3.6),
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
      skillCoeff: dmgCoeff(stars, 3.4),
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}각인`, dmgCoeff(stars, 3.4)), el),
          "bolt",
        ),
        skillVfx(
          autoDesc(
            {
              id: "s2",
              nameKo: `${p.s2}착수`,
              cooldown: 3,
              effects: [
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 4.4) },
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
                  coeff: dmgCoeff(stars, 3.8),
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
      skillCoeff: dmgCoeff(stars, 3.8),
      baseStats: { spd: 4 + stars },
      skills: [
        skillVfx(
          autoDesc(basicStrike(`${p.s1}포획`, dmgCoeff(stars, 3.8)), el),
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
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 5.1) },
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
                { kind: "damage", target: "single", coeff: dmgCoeff(stars, 5.5) },
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
  role: BalanceArchetype,
  stars: number,
): Record<Element, ElementKit> {
  return kitsForRole(stars, role);
}
