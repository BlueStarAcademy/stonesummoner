/**
 * Verify monster art coverage (source art plus inventory derivatives).
 *
 * Usage:
 *   node scripts/check-monster-art.mjs
 *   node scripts/check-monster-art.mjs --strict
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MONSTER_ART_KEYS } from "./lib/monster-art-roster.mjs";
import {
  inspectPortraitDerivative,
  portraitDerivativePath,
  PORTRAIT_DERIVATIVE_SIZES,
} from "./lib/portrait-derivatives.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");

const portraitDir = path.join(root, "apps/web/public/art/monster");
const battleDir = path.join(root, "apps/web/public/art/monster/battle");

const missing = [];
const invalid = [];

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
  for (const portraitName of [artKey, `${artKey}_awaken`]) {
    for (const size of PORTRAIT_DERIVATIVE_SIZES) {
      const p = portraitDerivativePath(portraitDir, portraitName, size);
      const result = await inspectPortraitDerivative(p, size);
      const relative = path.relative(root, p).replace(/\\/g, "/");
      if (result.issue === "missing") missing.push(relative);
      else if (!result.ok) invalid.push(`${relative}: ${result.issue}`);
    }
  }
}

const expectedPerKey = 6 + PORTRAIT_DERIVATIVE_SIZES.length * 2;
console.log(
  `monster art keys=${MONSTER_ART_KEYS.length} expected=${MONSTER_ART_KEYS.length * expectedPerKey} missing=${missing.length} invalid=${invalid.length}`,
);
if (missing.length > 0) {
  console.log(missing.slice(0, 40).join("\n"));
  if (missing.length > 40) console.log(`... +${missing.length - 40} more`);
}
if (invalid.length > 0) {
  console.log(invalid.slice(0, 40).join("\n"));
  if (invalid.length > 40) console.log(`... +${invalid.length - 40} more invalid`);
}
if (strict && (missing.length > 0 || invalid.length > 0)) process.exit(1);
