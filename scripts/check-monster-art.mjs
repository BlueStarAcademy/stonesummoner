/**
 * Verify monster art coverage (250 monsters × 6 assets).
 *
 * Usage:
 *   node scripts/check-monster-art.mjs
 *   node scripts/check-monster-art.mjs --strict
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MONSTER_ART_KEYS } from "./lib/monster-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");

const portraitDir = path.join(root, "apps/web/public/art/monster");
const battleDir = path.join(root, "apps/web/public/art/monster/battle");

const missing = [];

for (const artKey of MONSTER_ART_KEYS) {
  const checks = [
    path.join(portraitDir, `${artKey}.webp`),
    path.join(portraitDir, `${artKey}_awaken.webp`),
    path.join(battleDir, `${artKey}-front.webp`),
    path.join(battleDir, `${artKey}-back.webp`),
    path.join(battleDir, `${artKey}-awaken-front.webp`),
    path.join(battleDir, `${artKey}-awaken-back.webp`),
  ];
  for (const p of checks) {
    if (!fs.existsSync(p)) missing.push(path.relative(root, p).replace(/\\/g, "/"));
  }
}

console.log(
  `monster art keys=${MONSTER_ART_KEYS.length} expected=${MONSTER_ART_KEYS.length * 6} missing=${missing.length}`,
);
if (missing.length > 0) {
  console.log(missing.slice(0, 40).join("\n"));
  if (missing.length > 40) console.log(`... +${missing.length - 40} more`);
}
if (strict && missing.length > 0) process.exit(1);
