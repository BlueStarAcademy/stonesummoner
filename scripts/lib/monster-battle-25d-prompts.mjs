export const BATTLE_25D_VIEWS = ["front", "back"];
export const BATTLE_25D_STATES = ["base", "awaken"];

export const BATTLE_25D_NEGATIVE_PROMPT = [
  "flat paper cutout",
  "flat cel shading",
  "photorealistic human",
  "raw 3D viewport",
  "plastic toy render",
  "chibi proportions",
  "idle T-pose",
  "floating feet",
  "cast shadow baked into background",
  "black background",
  "checkerboard transparency",
  "multiple characters",
  "extra limbs",
  "missing fingers",
  "cropped weapon",
  "cropped wings",
  "cropped feet",
  "text",
  "logo",
  "watermark",
  "UI",
].join(", ");

const ELEMENT_DIRECTION = {
  fire:
    "fire accents: red-orange and gold, controlled flame wisps, hot metal edges, warm rim light",
  water:
    "water accents: deep blue, teal and silver, restrained water or ice detail, cool glossy rim light",
  wind:
    "wind accents: green, lime and bright teal, restrained air ribbons or leaves, light fabric motion",
  light:
    "light accents: ivory, gold and pale yellow, restrained holy radiance, bright readable materials",
  dark:
    "dark accents: charcoal, black-blue and violet, restrained void mist or curse glyphs, readable dark values",
};

function viewDirection(view) {
  if (view === "back") {
    return [
      "rear three-quarter battle view of the exact same character and equipment",
      "show the back construction of armor, garments, wings, tail and weapons",
      "match the front image proportions, silhouette, pose energy, camera height and lighting",
      "do not mirror the front painting and do not hide the rear design with effects",
    ].join(", ");
  }
  return [
    "front three-quarter battle view",
    "face and costume front readable",
    "heroic grounded combat-ready stance",
  ].join(", ");
}

function stateDirection(state) {
  if (state === "awaken") {
    return [
      "awakened evolution of the same character",
      "preserve the base silhouette and identity",
      "upgrade materials, ornaments and elemental aura without changing species or role",
    ].join(", ");
  }
  return "base evolution state, iconic family silhouette, restrained effects";
}

/**
 * Build a generation-ready prompt. The family sheet is included verbatim so
 * art automation cannot silently ignore family-specific identity constraints.
 */
export function buildMonsterBattle25dPrompt({
  familyId,
  element,
  view,
  state,
  familyBrief,
  referenceName,
}) {
  const prompt = [
    "Premium stylized 2.5D mobile RPG battle character, full body single character",
    "high-end hand-painted dark fantasy over dimensional 3D-like forms",
    "strong depth and volume, coherent anatomy, physically believable layered materials",
    "orthographic-like eye-level camera, consistent three-quarter perspective",
    "cinematic soft key light plus clean rim light, ambient occlusion, crisp focal details",
    "clear solid silhouette, grounded feet fully visible, square composition",
    "approximately 12 percent empty margin on sides and top and 5 percent below feet",
    "transparent alpha background or perfectly uniform #FF00FF chroma plate",
    viewDirection(view),
    stateDirection(state),
    ELEMENT_DIRECTION[element],
    "element identity is baked into selected accents and materials, never a global hue shift",
    referenceName ? `visual continuity reference: ${referenceName}` : null,
    `family id: ${familyId}`,
    "Family design brief:",
    familyBrief.trim(),
    "No text, no watermark, no UI, no cropped limbs or equipment.",
  ];
  return prompt.filter(Boolean).join("\n");
}
