/** Build GenerateImage / painted staging prompts for skill icon stems. */
import fs from "node:fs";
import path from "node:path";

const MASTER =
  "Premium Com2uS Summoners War style skill icon, centered magical combat effect emblem only, ultra detailed hand-painted 2D digital illustration for mobile RPG, glowing energy particles ornate detail, pure dark charcoal gray background flat matte #0a0a0a for alpha extraction, square 1:1 composition, generous margin around effect, no character portrait, no monster face, no body, no text, no watermark, no UI chrome, no outer square frame, no rarity border";

const ELEMENT = {
  fire: "fire element palette: ember red, molten orange, incandescent gold, heat haze",
  water: "water element palette: deep cobalt, glacial cyan, pearlescent ice, liquid refraction",
  wind: "wind element palette: jade green, pale silver, feather-light trails, razor air ribbons",
  light: "light element palette: ivory white, sacred gold, prism flare, clean radiant bloom",
  dark: "dark element palette: indigo black, violet, void magenta, gravitational shadow",
};

const INTENSITY = {
  basic: "compact basic skill with a sharp readable gesture",
  signature: "signature scale and a distinctive central silhouette",
  ultimate: "ultimate scale and layered climax with radial burst",
};

export function loadSkillManifest(root) {
  const manifestPath = path.join(
    root,
    "docs/art/skill/skill-art-manifest.json",
  );
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

export function manifestEntryForStem(manifest, stem) {
  const iconPath = `/art/monster/skill/${stem}.webp`;
  const summonerPath = `/art/summoner/skill/${stem}.webp`;
  return manifest.entries.find(
    (entry) =>
      entry.iconPath === iconPath || entry.iconPath === summonerPath,
  );
}

export function buildSkillArtPrompt(entry) {
  if (entry?.prompt) {
    return entry.prompt.replace(
      /no character portrait, no text, no watermark, no UI frame/g,
      "no character portrait, no monster face, no body, no text, no watermark, no UI chrome, no outer square frame, no rarity border",
    );
  }
  const element = ELEMENT[entry.element] ?? ELEMENT.light;
  const intensity = INTENSITY[entry.intensity] ?? INTENSITY.basic;
  return `${MASTER}; ${element}; ${intensity}; skill concept: ${entry.nameKo}; meaning: ${entry.descKo}; combat effects: ${(entry.effects ?? []).join(", ")}`;
}

export function buildSkillArtPromptForStem(root, stem) {
  const manifest = loadSkillManifest(root);
  const entry = manifestEntryForStem(manifest, stem);
  if (!entry) throw new Error(`no manifest entry for stem: ${stem}`);
  return buildSkillArtPrompt(entry);
}
