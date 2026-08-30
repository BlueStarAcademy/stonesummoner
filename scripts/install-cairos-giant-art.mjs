/**
 * Install one painted stage boss, arena, and circle source set.
 *
 * Usage:
 *   node scripts/install-cairos-giant-art.mjs <sourceDir> [assetId]
 *
 * Required source files:
 * Files are named {assetId}-{front|back|bg|circle}.png.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  imageToDematteWebp,
  imageToInstalledBattleWebp,
} from "./lib/dematte-webp.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.resolve(process.argv[2] ?? "");
const assetId = process.argv[3] ?? "cairos-giant";
if (!process.argv[2] || !fs.existsSync(sourceDir)) {
  console.error(
    "Usage: node scripts/install-cairos-giant-art.mjs <sourceDir> [assetId]",
  );
  process.exit(1);
}

const source = (suffix) => path.join(sourceDir, `${assetId}-${suffix}.png`);
for (const suffix of ["front", "back", "bg", "circle"]) {
  if (!fs.existsSync(source(suffix))) {
    console.error("Missing source:", source(suffix));
    process.exit(1);
  }
}

const bossDir = path.join(root, "apps/web/public/art/battle/boss");
const bgDir = path.join(root, "apps/web/public/art/battle/bg");
const circleDir = path.join(root, "apps/web/public/art/battle/circle");
for (const dir of [bossDir, bgDir, circleDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

for (const facing of ["front", "back"]) {
  const mode = await imageToInstalledBattleWebp(
    source(facing),
      path.join(bossDir, `${assetId}-${facing}.webp`),
    {
      transparent: {
        size: 1024,
        fit: "contain",
        quality: 92,
        alphaQuality: 100,
      },
    },
  );
  console.log(`boss ${facing}: ${mode}`);
}

await sharp(source("bg"))
  .resize(1080, 1920, { fit: "cover", position: "bottom" })
  .webp({ quality: 84 })
  .toFile(path.join(bgDir, `${assetId}.webp`));
await sharp(source("bg"))
  .resize(720, 1280, { fit: "cover", position: "bottom" })
  .webp({ quality: 80 })
  .toFile(path.join(bgDir, `${assetId}-720.webp`));
console.log("arena background: 1080 + 720");

await imageToDematteWebp(
  source("circle"),
  path.join(circleDir, `${assetId}.webp`),
  {
    size: 1024,
    lim: 40,
    fit: "contain",
    quality: 92,
  },
);
console.log("battle circle: 1024");
