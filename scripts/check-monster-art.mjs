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
import sharp from "sharp";
import { MONSTER_ART_KEYS } from "./lib/monster-art-roster.mjs";
import {
  inspectPortraitDerivative,
  portraitDerivativePath,
  PORTRAIT_DERIVATIVE_SIZES,
} from "./lib/portrait-derivatives.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const requirePortraitCards = process.argv.includes("--require-portrait-cards");

const portraitDir = path.join(root, "apps/web/public/art/monster");
const battleDir = path.join(root, "apps/web/public/art/monster/battle");
const portraitCardDir = path.join(root, "assets/monster/portrait-cards");

const missing = [];
const invalid = [];
let portraitCards = 0;

function resolvePortraitCard(name) {
  for (const ext of [".png", ".webp"]) {
    const candidate = path.join(portraitCardDir, `${name}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

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
    const portraitPath = path.join(portraitDir, `${portraitName}.webp`);
    const cardSource = resolvePortraitCard(portraitName);
    if (cardSource) {
      portraitCards += 1;
      const sourceMeta = await sharp(cardSource).metadata();
      if (
        !sourceMeta.width ||
        !sourceMeta.height ||
        sourceMeta.width !== sourceMeta.height ||
        sourceMeta.width < 768
      ) {
        invalid.push(
          `${path.relative(root, cardSource).replace(/\\/g, "/")}: portrait-card-source=${sourceMeta.width ?? "?"}x${sourceMeta.height ?? "?"}`,
        );
      }
      if (fs.existsSync(portraitPath)) {
        const outputMeta = await sharp(portraitPath).metadata();
        const outputStats = await sharp(portraitPath).stats();
        if (
          outputMeta.format !== "webp" ||
          outputMeta.width !== 768 ||
          outputMeta.height !== 768
        ) {
          invalid.push(
            `${path.relative(root, portraitPath).replace(/\\/g, "/")}: portrait-card-output=${outputMeta.width ?? "?"}x${outputMeta.height ?? "?"}/${outputMeta.format ?? "?"}`,
          );
        }
        if (outputStats.channels.slice(0, 3).every((channel) => channel.stdev < 8)) {
          invalid.push(
            `${path.relative(root, portraitPath).replace(/\\/g, "/")}: near-solid-background`,
          );
        }
      }
    }
    for (const size of PORTRAIT_DERIVATIVE_SIZES) {
      const p = portraitDerivativePath(portraitDir, portraitName, size);
      const result = await inspectPortraitDerivative(p, size, {
        allowOpaque: Boolean(cardSource),
      });
      const relative = path.relative(root, p).replace(/\\/g, "/");
      if (result.issue === "missing") missing.push(relative);
      else if (!result.ok) invalid.push(`${relative}: ${result.issue}`);
    }
  }
}

const expectedPerKey = 6 + PORTRAIT_DERIVATIVE_SIZES.length * 2;
const expectedPortraitCards = MONSTER_ART_KEYS.length * 2;
if (requirePortraitCards && portraitCards !== expectedPortraitCards) {
  invalid.push(
    `portrait-card coverage=${portraitCards}/${expectedPortraitCards}`,
  );
}
console.log(
  `monster art keys=${MONSTER_ART_KEYS.length} portraitCards=${portraitCards} expected=${MONSTER_ART_KEYS.length * expectedPerKey} missing=${missing.length} invalid=${invalid.length}`,
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
