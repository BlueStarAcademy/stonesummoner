/** Build GenerateImage prompts for gear art stems. */

const MASTER =
  "Premium Com2uS Summoners War style inventory gear icon, ultra detailed hand-painted 2D digital illustration for mobile RPG, single centered fantasy equipment, heroic fantasy summoners war aesthetic, rich metal fabric leather gem enamel detail, crisp silhouette, pure dark charcoal gray background flat matte #0a0a0a for alpha extraction, square 1:1 composition, generous margin around item, no text, no watermark, no UI, no outer picture frame, no rarity border";

const STAR_TIER = {
  1: "worn humble simple, minimal ornament, matte materials, first tier",
  2: "cleaner polish, subtle edge highlight, second tier",
  3: "ornate trim, small gems, richer materials, third tier",
  4: "glowing accents, enchanted shimmer, premium gems, fourth tier",
  5: "legendary masterpiece, radiant aura, crown jewels, maximum detail, fifth tier",
};

const MATERIAL = {
  cloth: "soft woven linen and silk, light robes, fabric folds, mage vestments",
  leather: "tanned leather, straps, buckles, agile ranger gear",
  chain: "chain mail links, ring armor, steel rings, medium armor",
  plate: "heavy plate panels, rivets, pauldrons, fortress armor",
};

const SLOT = {
  top: "breastplate or robe chest armor, front 3/4 view, heroic V-waist",
  bottom: "war greaves waist armor faulds, front 3/4 view",
  shoes: "pair of fantasy boots, both boots visible, slight 3/4 angle",
  ring: "jeweled fantasy ring close-up, band and gem centered",
  necklace: "fantasy pendant with chain arc, centered",
};

const ELEMENT = {
  fire: "lava orange molten core, ember sparks, fire ritual blade",
  water: "frost blue steel, ice mist, tidal enchantment",
  wind: "jade teal edge, wind ribbons, swift blade",
  light: "gold-white radiance, holy filigree, sacred sword",
  dark: "violet-black void metal, purple rift energy, shadow blade",
};

export function parseGearArtStem(stem) {
  const weapon = stem.match(/^weapon-(fire|water|wind|light|dark)-s([1-5])$/);
  if (weapon) {
    return { kind: "weapon", element: weapon[1], star: Number(weapon[2]) };
  }
  const common = stem.match(
    /^(top|bottom|shoes|ring|necklace)-(cloth|leather|chain|plate)-s([1-5])$/,
  );
  if (common) {
    return {
      kind: "common",
      slot: common[1],
      material: common[2],
      star: Number(common[3]),
    };
  }
  return null;
}

export function buildGearArtPrompt(stem) {
  const parsed = parseGearArtStem(stem);
  if (!parsed) throw new Error(`unknown stem: ${stem}`);
  const starLine = STAR_TIER[parsed.star];
  if (parsed.kind === "weapon") {
    const elLine = ELEMENT[parsed.element];
    return `${MASTER}. Fantasy summoner weapon: centered short magic sword ritual blade. ${elLine}. ${starLine}.`;
  }
  const matLine = MATERIAL[parsed.material];
  const slotLine = SLOT[parsed.slot];
  return `${MASTER}. ${matLine}. ${slotLine}. ${starLine}.`;
}
