/**
 * Copy generated battle stills from Cursor assets into public/art/monster/battle.
 * Usage: node scripts/install-battle-stills.mjs
 *
 * Prefers dedicated `{id}-back.png` when present; otherwise copies front → back.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assets =
  process.env.CURSOR_ASSETS ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-project-StoneSummoner/assets",
  );
const outDir = path.join(root, "apps/web/public/art/monster/battle");

const ROSTER = [
  "stone_golem", "forest_sprite", "venom_stinger", "cinder_imp", "dew_slime",
  "gale_bat", "sand_lizard", "moss_turtle", "crow_scout", "bone_thrall",
  "mace_soldier", "heal_priest", "magic_archer", "shadow_thief", "thunder_spear",
  "frost_witch", "stone_fist", "herb_alchemist", "capture_hound", "seal_apprentice",
  "flame_warrior", "abyss_pirate", "gale_rider", "sanctuary_guard", "abyss_hexer",
  "dew_healer", "seal_elder", "wolf_fighter", "lotus_dancer", "scout_sniper",
  "steel_armor", "mana_captor", "magma_knight", "glacier_mage", "storm_spearmaster",
  "angel_healer", "demon_hexer", "rune_scholar", "golden_guardian", "shadow_assassin",
  "holy_judge", "abyss_priest", "wyrm_rider", "capture_lord", "dragon_knight",
  "primordial_hierophant", "doom_oracle", "sky_warden", "eternal_healer", "absolute_captor",
];

fs.mkdirSync(outDir, { recursive: true });
let fronts = 0;
let dedicatedBacks = 0;
let fallbackBacks = 0;
for (const id of ROSTER) {
  const frontSrc = path.join(assets, `${id}-front.png`);
  const backSrc = path.join(assets, `${id}-back.png`);
  const frontOut = path.join(outDir, `${id}-front.png`);
  const backOut = path.join(outDir, `${id}-back.png`);

  if (fs.existsSync(frontSrc)) {
    fs.copyFileSync(frontSrc, frontOut);
    fronts += 1;
  } else if (!fs.existsSync(frontOut)) {
    console.warn(`missing front: ${id}`);
  }

  if (fs.existsSync(backSrc)) {
    fs.copyFileSync(backSrc, backOut);
    dedicatedBacks += 1;
  } else if (fs.existsSync(frontOut)) {
    fs.copyFileSync(frontOut, backOut);
    fallbackBacks += 1;
  } else {
    console.warn(`missing back (and no front to copy): ${id}`);
  }
}
console.log(
  `installed fronts=${fronts}/${ROSTER.length}, dedicatedBacks=${dedicatedBacks}, fallbackBacks=${fallbackBacks} -> ${outDir}`,
);
