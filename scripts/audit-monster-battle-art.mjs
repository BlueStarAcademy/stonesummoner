/**
 * Audit installed monster battle stills beyond simple file coverage.
 *
 * Checks canonical 1024² WebP/alpha output and detects exact front→back copies.
 *
 * Usage:
 *   node scripts/audit-monster-battle-art.mjs
 *   node scripts/audit-monster-battle-art.mjs --strict
 *   node scripts/audit-monster-battle-art.mjs --strict --families forest_sprite,stone_golem
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  MONSTER_ART_KEYS,
  artKeysForFamilies,
} from "./lib/monster-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const strict = process.argv.includes("--strict");

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const familiesArg = argVal("--families");
const roster = familiesArg
  ? artKeysForFamilies(
      familiesArg.split(",").map((value) => value.trim()).filter(Boolean),
    )
  : MONSTER_ART_KEYS;
const battleDir = path.join(root, "apps/web/public/art/monster/battle");
const outputPath = path.resolve(
  root,
  argVal("--output") ||
    (familiesArg
      ? "docs/art/monster/battle-25d-pilot-audit.json"
      : "docs/art/monster/battle-25d-audit.json"),
);

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

async function sha256(file) {
  const data = await fs.promises.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}

const missing = [];
const invalid = [];
const duplicateBacks = [];
const hashes = new Map();

for (const artKey of roster) {
  for (const state of ["base", "awaken"]) {
    for (const view of ["front", "back"]) {
      const stem = `${artKey}${state === "awaken" ? "-awaken" : ""}-${view}`;
      const file = path.join(battleDir, `${stem}.webp`);
      if (!fs.existsSync(file)) {
        missing.push(relative(file));
        continue;
      }
      const metadata = await sharp(file).metadata();
      const issues = [];
      if (metadata.format !== "webp") issues.push(`format=${metadata.format}`);
      if (metadata.width !== 1024 || metadata.height !== 1024) {
        issues.push(`size=${metadata.width}x${metadata.height}`);
      }
      if (metadata.hasAlpha !== true) issues.push("alpha=false");
      if (metadata.hasAlpha === true) {
        const { data, info } = await sharp(file)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let visiblePixels = 0;
        for (let i = 3; i < data.length; i += info.channels) {
          if (data[i] > 8) visiblePixels += 1;
        }
        const visibleRatio = visiblePixels / (info.width * info.height);
        if (visibleRatio < 0.01) {
          issues.push(`empty-silhouette=${visibleRatio.toFixed(4)}`);
        }
      }
      if (issues.length > 0) {
        invalid.push({ file: relative(file), issues });
      }
      hashes.set(stem, await sha256(file));
    }

    const frontStem = `${artKey}${state === "awaken" ? "-awaken" : ""}-front`;
    const backStem = `${artKey}${state === "awaken" ? "-awaken" : ""}-back`;
    if (
      hashes.has(frontStem) &&
      hashes.get(frontStem) === hashes.get(backStem)
    ) {
      duplicateBacks.push({
        artKey,
        state,
        front: relative(path.join(battleDir, `${frontStem}.webp`)),
        back: relative(path.join(battleDir, `${backStem}.webp`)),
        issue: "exact-front-copy",
      });
    }
  }
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  families: familiesArg ? familiesArg.split(",") : null,
  expectedBattleStills: roster.length * 4,
  summary: {
    missing: missing.length,
    invalid: invalid.length,
    exactFrontCopyBacks: duplicateBacks.length,
    passed:
      missing.length === 0 &&
      invalid.length === 0 &&
      duplicateBacks.length === 0,
  },
  missing,
  invalid,
  duplicateBacks,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(
  `battle stills=${payload.expectedBattleStills} missing=${missing.length} invalid=${invalid.length} exactFrontCopyBacks=${duplicateBacks.length}`,
);
console.log(`wrote ${relative(outputPath)}`);

if (strict && !payload.summary.passed) process.exit(1);
