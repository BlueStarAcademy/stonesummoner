/**
 * @deprecated Do not run — overwrites HQ per-element portraits.
 * Use scripts/bake-monster-element-art.mjs or painted install pipeline.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../apps/web/public/art/monster");
const srcDir = outDir;

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

/** Prefer existing Phase 1 files when renaming. */
const ALIAS = {
  wolf_fighter: "fire_fang",
  magic_archer: "ash_archer",
  scout_sniper: "gale_scout",
  steel_armor: "shield_tortoise",
  lotus_dancer: "mist_shaman",
  seal_elder: "seal_scholar",
  thunder_spear: "thunder_lancer",
  storm_spearmaster: "thunder_lancer",
  dew_healer: "dew_healer",
  capture_hound: "capture_hound",
  abyss_priest: "abyss_priest",
};

const fallback = path.join(srcDir, "fire_fang.webp");
if (!fs.existsSync(fallback)) {
  console.error("missing fire_fang.webp");
  process.exit(1);
}

let n = 0;
for (const id of ROSTER) {
  const dest = path.join(outDir, `${id}.webp`);
  if (fs.existsSync(dest) && !ALIAS[id]) continue;
  const alias = ALIAS[id];
  const src = alias
    ? path.join(srcDir, `${alias}.webp`)
    : fallback;
  if (!fs.existsSync(src)) {
    fs.copyFileSync(fallback, dest);
  } else if (path.resolve(src) !== path.resolve(dest)) {
    fs.copyFileSync(src, dest);
  }
  n += 1;
}
console.log(`portraits ready: ${n} written/checked, ${ROSTER.length} families`);
