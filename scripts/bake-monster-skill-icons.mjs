/**
 * Rasterize procedural skill SVGs in _procedural/ only — never touches ship WebP.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SIZE = 256;
const DENSITY = 220;

const PROC_DIRS = [
  path.join(root, "apps/web/public/art/monster/skill/_procedural"),
  path.join(root, "apps/web/public/art/ui/skill/_procedural"),
  path.join(root, "apps/web/public/art/summoner/skill/_procedural"),
];

let wrote = 0;
let skipped = 0;

for (const dir of PROC_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".svg")) continue;
    const svgPath = path.join(dir, name);
    const webpPath = path.join(dir, name.replace(/\.svg$/i, ".webp"));
    const svgStat = fs.statSync(svgPath);
    if (fs.existsSync(webpPath)) {
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs >= svgStat.mtimeMs) {
        skipped += 1;
        continue;
      }
    }
    const buf = fs.readFileSync(svgPath);
    await sharp(buf, { density: DENSITY })
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 92, effort: 4 })
      .toFile(webpPath);
    wrote += 1;
  }
}

console.log(`procedural skill webp: wrote ${wrote}, skipped ${skipped} (ship dir untouched)`);
