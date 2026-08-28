import type { SkillDef } from "./skills.js";

export type SkillVisualElement = "fire" | "water" | "wind" | "light" | "dark";

export type SkillVisualMotion = "melee" | "bolt" | "nova" | "support";

export type SkillVisualIntensity = "basic" | "signature" | "ultimate";

export interface SkillVisualDescriptor {
  id: string;
  assetStem: string;
  element: SkillVisualElement;
  slot: string;
  intensity: SkillVisualIntensity;
  motion: SkillVisualMotion;
}

export function monsterSkillVfxId(
  familyId: string,
  element: SkillVisualElement,
  slot: "s1" | "s2" | "s3",
): string {
  return `monster:${familyId}:${element}:${slot}`;
}

export function summonerSkillVfxId(skillId: string): string {
  return `summoner:${skillId}`;
}

/**
 * Resolve the single painted ship asset for a runtime skill.
 *
 * Deliberately has no generic, family, SVG, or procedural fallback: every
 * runtime skill has a dedicated WebP and missing art must fail visibly.
 */
export function skillIconPath(vfxId: string | undefined | null): string | null {
  if (!vfxId) return null;
  const parts = vfxId.split(":");
  if (
    parts.length === 4 &&
    parts[0] === "monster" &&
    /^[a-z0-9_]+$/.test(parts[1]!) &&
    (["fire", "water", "wind", "light", "dark"] as const).includes(
      parts[2] as SkillVisualElement,
    ) &&
    (["s1", "s2", "s3"] as const).includes(parts[3] as "s1" | "s2" | "s3")
  ) {
    return `/art/monster/skill/${parts[1]}-${parts[2]}-${parts[3]}.webp`;
  }
  if (
    parts.length === 2 &&
    parts[0] === "summoner" &&
    /^[a-z0-9_]+$/.test(parts[1]!)
  ) {
    return `/art/summoner/skill/${parts[1]}.webp`;
  }
  return null;
}

function intensityForSlot(slot: string): SkillVisualIntensity {
  if (slot === "s3" || slot === "A" || slot === "A3" || slot === "A4") {
    return "ultimate";
  }
  if (slot === "s2" || slot === "B" || slot === "A1" || slot === "A2" || slot === "B1" || slot === "B2") {
    return "signature";
  }
  return "basic";
}

function motionForSkill(
  skill: Pick<SkillDef, "vfxFamily">,
): SkillVisualMotion {
  return skill.vfxFamily ?? "bolt";
}

export function describeSkillVfx(
  id: string,
  skill: Pick<SkillDef, "vfxFamily"> & { element?: SkillVisualElement; slot?: string },
): SkillVisualDescriptor {
  const parts = id.split(":");
  const isMonster = parts[0] === "monster";
  const element =
    skill.element ??
    (isMonster && parts[2] ? (parts[2] as SkillVisualElement) : "light");
  const slot = skill.slot ?? (isMonster ? parts[3] ?? "s1" : "A");
  const familyId = isMonster ? parts[1] ?? "skill" : "summoner";
  const assetStem = isMonster
    ? `${familyId}-${element}-${slot}`
    : id.replace(/^summoner:/, "");
  return {
    id,
    assetStem,
    element,
    slot,
    intensity: intensityForSlot(slot),
    motion: motionForSkill(skill),
  };
}
