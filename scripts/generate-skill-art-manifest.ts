import fs from "node:fs";
import path from "node:path";
import {
  describeSkillVfx,
  getSummonerKit,
  MONSTERS,
  type SkillDef,
  type Element,
  type MonsterRole,
} from "../packages/data/src/index.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs", "art", "skill", "skill-art-manifest.json");

const ELEMENT_PROMPTS: Record<Element, string> = {
  fire: "ember red, molten orange, incandescent gold, heat haze",
  water: "deep cobalt, glacial cyan, pearlescent ice, liquid refraction",
  wind: "jade green, pale silver, feather-light trails, razor air ribbons",
  light: "ivory white, sacred gold, prism flare, clean radiant bloom",
  dark: "indigo black, violet, void magenta, gravitational shadow",
};

const ROLE_PROMPTS: Record<MonsterRole, string> = {
  attacker: "decisive offensive force with a readable point of impact",
  support: "protective or restorative magic with elegant concentric motifs",
  tank: "heavy defensive mass, ward plates, and grounded force",
  debuffer: "ominous binding marks, fracture lines, and lingering curse residue",
  stonesage: "ancient rune geometry, stone seals, and ritual inscription energy",
  capturer: "a clearly readable binding orb, ring, chain, or containment field",
};

function effectsOf(skill: SkillDef): string[] {
  return [...new Set(skill.effects.map((effect) => effect.kind))];
}

function promptFor(input: {
  nameKo: string;
  descKo?: string;
  element: Element;
  role?: MonsterRole;
  slot: string;
  effects: string[];
}): string {
  const role = input.role
    ? ROLE_PROMPTS[input.role]
    : "commanding summoner magic with a clear battlefield purpose";
  const intensity =
    input.slot === "s3" ||
    input.slot === "A" ||
    input.slot === "A3" ||
    input.slot === "A4"
      ? "ultimate scale and layered climax"
      : input.slot === "s2" ||
          input.slot === "B" ||
          input.slot === "A1" ||
          input.slot === "A2" ||
          input.slot === "B1" ||
          input.slot === "B2"
        ? "signature scale and a distinctive central silhouette"
        : "compact basic skill with a sharp readable gesture";
  return [
    "Premium hand-painted 2D fantasy mobile RPG skill art",
    `${input.element} element palette: ${ELEMENT_PROMPTS[input.element]}`,
    role,
    intensity,
    `skill concept: ${input.nameKo}`,
    input.descKo ? `meaning: ${input.descKo}` : "",
    `combat effects: ${input.effects.join(", ")}`,
    "centered magical combat effect, transparent dematted edge, dark charcoal negative space",
    "high contrast focal silhouette, ornate particles, no character portrait, no text, no watermark, no UI frame",
  ]
    .filter(Boolean)
    .join("; ");
}

const monsterEntries = MONSTERS.flatMap((monster) =>
  monster.skills.map((skill, index) => {
    const slot = (["s1", "s2", "s3"] as const)[index]!;
    const visual = describeSkillVfx(skill.vfxId!, {
      ...skill,
      element: monster.element,
      slot,
    });
    return {
      kind: "monster" as const,
      id: skill.vfxId,
      nameKo: skill.nameKo,
      descKo: skill.descKo,
      familyId: monster.familyId,
      monsterId: monster.id,
      element: monster.element,
      role: monster.role,
      slot,
      effects: effectsOf(skill),
      motion: visual.motion,
      intensity: visual.intensity,
      iconPath: `/art/monster/skill/${visual.assetStem}.webp`,
      battleFxDir: `/art/battle/fx/skills/${skill.vfxId!.replaceAll(":", "-")}`,
      prompt: promptFor({
        nameKo: skill.nameKo,
        descKo: skill.descKo,
        element: monster.element,
        role: monster.role,
        slot,
        effects: effectsOf(skill),
      }),
    };
  }),
);

const summonerEntries = (["fire", "water", "wind", "light", "dark"] as const).flatMap(
  (element) =>
    Object.values(getSummonerKit(element).skills).map((skill) => {
      const visual = describeSkillVfx(skill.vfxId!, {
        vfxFamily: skill.vfxFamily,
        element,
        slot: skill.slot,
      });
      return {
        kind: "summoner" as const,
        id: skill.vfxId,
        nameKo: skill.nameKo,
        descKo: skill.descKo,
        element,
        slot: skill.slot,
        effects: [skill.kind],
        motion: visual.motion,
        intensity: visual.intensity,
        iconPath: `/art/summoner/skill/${skill.id}.webp`,
        battleFxDir: `/art/battle/fx/skills/${skill.vfxId!.replaceAll(":", "-")}`,
        prompt: promptFor({
          nameKo: skill.nameKo,
          descKo: skill.descKo,
          element,
          slot: skill.slot,
          effects: [skill.kind],
        }),
      };
    }),
);

const entries = [...monsterEntries, ...summonerEntries];
const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  counts: {
    total: entries.length,
    monster: monsterEntries.length,
    summoner: summonerEntries.length,
  },
  entries,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote ${entries.length} skill art briefs to ${path.relative(ROOT, OUT)}`);
