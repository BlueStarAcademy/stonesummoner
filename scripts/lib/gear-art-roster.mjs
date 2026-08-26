/** Gear icon roster — ★1–★5 star art + 4 materials (non-weapon). */

export const GEAR_STAR_LEVELS = [1, 2, 3, 4, 5];
export const GEAR_ELEMENTS = ["fire", "water", "wind", "light", "dark"];
export const GEAR_MATERIALS = ["cloth", "leather", "chain", "plate"];
export const GEAR_ARMOR_SLOTS = ["top", "bottom", "shoes"];
export const GEAR_ACC_SLOTS = ["ring", "necklace"];
export const GEAR_COMMON_SLOTS = [...GEAR_ARMOR_SLOTS, ...GEAR_ACC_SLOTS];

/** @returns stems without extension, e.g. `weapon-fire-s3`, `top-cloth-s5` */
export function gearArtStems(opts = {}) {
  const stars = opts.stars ?? GEAR_STAR_LEVELS;
  const elements = opts.elements ?? GEAR_ELEMENTS;
  const materials = opts.materials ?? GEAR_MATERIALS;
  const stems = [];
  for (const el of elements) {
    for (const s of stars) {
      stems.push(`weapon-${el}-s${s}`);
    }
  }
  for (const slot of GEAR_COMMON_SLOTS) {
    for (const mat of materials) {
      for (const s of stars) {
        stems.push(`${slot}-${mat}-s${s}`);
      }
    }
  }
  return stems;
}

export const GEAR_ART_STEMS = gearArtStems();
export const GEAR_ART_EXPECTED_COUNT = GEAR_ART_STEMS.length;
