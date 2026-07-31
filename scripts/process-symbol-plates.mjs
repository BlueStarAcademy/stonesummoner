/**
 * Dematte painted symbol plates + empty slots → WebP.
 * Input PNGs: plate-{rarity}-{1..6}.png, empty-{1..6}.png
 * Usage: node scripts/process-symbol-plates.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/ui/symbol",
);
const RARITIES = ["normal", "magic", "rare", "epic", "legendary", "mythic"];
const SLOTS = [1, 2, 3, 4, 5, 6];

fs.mkdirSync(outDir, { recursive: true });
let n = 0;

async function one(base) {
  const png = path.join(outDir, `${base}.png`);
  const webp = path.join(outDir, `${base}.webp`);
  const tmp = path.join(outDir, `${base}.tmp.webp`);
  if (!fs.existsSync(png)) return false;
  await pngToDematteWebp(png, tmp, { size: 256, lim: 38 });
  fs.renameSync(tmp, webp);
  fs.unlinkSync(png);
  console.log(`wrote ${base}.webp`);
  return true;
}

for (const r of RARITIES) {
  for (const s of SLOTS) {
    if (await one(`plate-${r}-${s}`)) n += 1;
  }
}
for (const s of SLOTS) {
  if (await one(`empty-${s}`)) n += 1;
}
console.log(`processed ${n} symbol plates/empties -> ${outDir}`);
