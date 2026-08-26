/**
 * Install painted gear icons from Cursor assets → public WebP (512², dematte).
 *
 * Source (first match per stem):
 *   $CURSOR_ASSETS/gear/{stem}.png | .webp
 *   assets/gear/{stem}.png | .webp  (repo-local)
 *
 * Usage:
 *   node scripts/install-gear-art.mjs
 *   node scripts/install-gear-art.mjs --stems weapon-fire-s5,top-plate-s3
 *   node scripts/install-gear-art.mjs --all   # process every roster stem (warn on missing)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageToDematteWebp } from "./lib/dematte-webp.mjs";
import { GEAR_ART_STEMS, gearArtStems } from "./lib/gear-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const assetsRoot =
  process.env.CURSOR_ASSETS ||
  path.join(process.env.USERPROFILE || "", ".cursor/projects/c-project-StoneSummoner/assets");
const gearAssetsDir = path.join(assetsRoot, "gear");
const localAssetsDir = path.join(root, "assets", "gear");
const outDir = path.join(root, "apps/web/public/art/ui/gear");

const stemsArg = argVal("--stems");
const roster = stemsArg
  ? stemsArg.split(",").map((s) => s.trim()).filter(Boolean)
  : args.includes("--all")
    ? GEAR_ART_STEMS
    : GEAR_ART_STEMS;

const DEMATTE = {
  size: 512,
  fit: "contain",
  lim: 40,
  chromaMax: 10,
  flatRange: 8,
  quality: 92,
  inset: 0.1,
  radius: 0.06,
};

function findSource(stem) {
  const names = [`${stem}.png`, `${stem}.webp`];
  for (const dir of [gearAssetsDir, localAssetsDir]) {
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

fs.mkdirSync(outDir, { recursive: true });

let installed = 0;
let missing = 0;

for (const stem of roster) {
  const src = findSource(stem);
  const dst = path.join(outDir, `${stem}.webp`);
  if (!src) {
    missing += 1;
    if (args.includes("--all") || stemsArg) {
      console.warn(`skip (no source): ${stem}`);
    }
    continue;
  }
  await imageToDematteWebp(src, dst, {
    ...DEMATTE,
    punchCenter: false,
  });
  installed += 1;
  console.log(`wrote ${stem}.webp`);
}

console.log(
  `gear-art: installed=${installed} missing=${missing} roster=${roster.length} -> ${outDir}`,
);
if (stemsArg && installed === 0) process.exit(1);
