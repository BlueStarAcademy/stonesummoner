/**
 * Process painted inv-grade frames: dematte + punch portrait well → WebP.
 * Input: apps/web/public/art/ui/inv-grade/{grade}.png
 * Usage: node scripts/process-inv-grade.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/art/ui/inv-grade",
);
const GRADES = ["gray", "green", "blue", "purple", "red"];

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const g of GRADES) {
  const png = path.join(outDir, `${g}.png`);
  const webp = path.join(outDir, `${g}.webp`);
  if (!fs.existsSync(png)) {
    console.log(`skip ${g} (no png)`);
    continue;
  }
  await pngToDematteWebp(png, webp, { size: 256, punchCenter: true, inset: 0.13, radius: 0.08 });
  fs.unlinkSync(png);
  n += 1;
  console.log(`wrote ${g}.webp`);
}
console.log(`processed ${n} inv-grade frames`);
