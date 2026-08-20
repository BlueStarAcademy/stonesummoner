/**
 * Dematte PNG → WebP for hub buildings / circles / glory campus.
 * Input:
 *   apps/web/public/art/hub/{name}.png
 *   apps/web/public/art/hub/glory/_src/{id}.png  (sources kept)
 * Usage: node scripts/process-hub-buildings.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/hub",
);
const NAMES = [
  "bldg-summon",
  "bldg-forge",
  "bldg-gate",
  "bldg-pond",
  "bldg-shop",
  "bldg-party",
  "bldg-wish",
  "bldg-dojo",
  "bldg-mine",
  "bldg-glory",
  "bldg-guild",
  "bldg-fusion",
  "summon-circle",
  "forge-circle",
];
const GLORY_IDS = [
  "mana_fountain",
  "ancient_sword",
  "guardstone",
  "crystal_altar",
  "sky_totem",
  "fire_sanctuary",
  "water_sanctuary",
  "wind_sanctuary",
  "fairy_tree",
];

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const name of NAMES) {
  const png = path.join(outDir, `${name}.png`);
  const webp = path.join(outDir, `${name}.webp`);
  if (!fs.existsSync(png)) {
    console.log(`skip ${name} (no png)`);
    continue;
  }
  await pngToDematteWebp(png, webp, { size: 512, lim: 40 });
  fs.unlinkSync(png);
  n += 1;
  console.log(`wrote ${name}.webp`);
}

const glorySrc = path.join(outDir, "glory", "_src");
const gloryOut = path.join(outDir, "glory");
fs.mkdirSync(gloryOut, { recursive: true });
for (const id of GLORY_IDS) {
  const png = path.join(glorySrc, `${id}.png`);
  const webp = path.join(gloryOut, `${id}.webp`);
  if (!fs.existsSync(png)) {
    console.log(`skip glory/${id} (no png)`);
    continue;
  }
  await pngToDematteWebp(png, webp, { size: 512, lim: 40, fit: "contain" });
  n += 1;
  console.log(`wrote glory/${id}.webp`);
}
console.log(`processed ${n} hub assets`);
