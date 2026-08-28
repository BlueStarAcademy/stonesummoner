/**
 * Process painted gear / generic UI / battle PNGs → WebP.
 * Scans given dirs for *.png and converts.
 * Usage:
 *   node scripts/process-paint-icons.mjs ui-gear
 *   node scripts/process-paint-icons.mjs monster-portrait
 *   node scripts/process-paint-icons.mjs battle-still
 *   node scripts/process-paint-icons.mjs battle-fx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pngToDematteWebp } from "./lib/dematte-webp.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAP = {
  "ui-gear": { dir: "apps/web/public/art/ui/gear", size: 512 },
  "ui-res": { dir: "apps/web/public/art/ui/res", size: 256 },
  "monster-portrait": { dir: "apps/web/public/art/monster", size: 768, flat: true },
  "battle-still": { dir: "apps/web/public/art/monster/battle", size: 1024 },
  "battle-fx": { dir: "apps/web/public/art/battle/fx", size: 512, fit: "contain", lim: 32 },
};

const key = process.argv[2];
const cfg = MAP[key];
if (!cfg) {
  console.error(`Usage: node scripts/process-paint-icons.mjs <${Object.keys(MAP).join("|")}>`);
  process.exit(1);
}
const dir = path.join(root, cfg.dir);
fs.mkdirSync(dir, { recursive: true });
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
let n = 0;
for (const f of files) {
  if (cfg.flat && f.includes(path.sep)) continue;
  // portraits: only top-level {artKey}.png (no subdirs)
  if (cfg.flat) {
    const base = path.basename(f, ".png");
    if (base.includes("-")) {
      // skip accidental battle names in root
    }
  }
  const png = path.join(dir, f);
  const webp = path.join(dir, f.replace(/\.png$/i, ".webp"));
  await pngToDematteWebp(png, webp, {
    size: cfg.size,
    fit: cfg.fit,
    lim: cfg.lim,
  });
  fs.unlinkSync(png);
  n += 1;
  console.log(`wrote ${path.basename(webp)}`);
}
console.log(`processed ${n} -> ${dir}`);
