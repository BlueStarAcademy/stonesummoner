/**
 * Ensure battle FX ship painted WebP only (no SVG/projectile orbs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fxDir = path.join(root, "apps/web/public/art/battle/fx");

const REQUIRED = [
  "fx-slash-1.webp",
  "fx-slash-2.webp",
  "fx-slash-3.webp",
  "fx-slash-fire.webp",
  "fx-slash-wind.webp",
  "fx-impact-1.webp",
  "fx-impact-3.webp",
  "fx-hit-fire.webp",
  "fx-hit-water.webp",
  "fx-hit-wind.webp",
  "fx-hit-light.webp",
  "fx-hit-dark.webp",
  "fx-hit-crit.webp",
  "fx-strike-ult.webp",
  "fx-cast.webp",
  "fx-heal.webp",
  "fx-shield.webp",
  "fx-buff.webp",
  "fx-hex.webp",
  "fx-bolt.webp",
  "fx-bolt-water.webp",
  "fx-bolt-dark.webp",
  "fx-bolt-fire.webp",
  "fx-bolt-wind.webp",
  "fx-bolt-light.webp",
  "fx-orb-heal.webp",
  "fx-orb-buff.webp",
  "fx-orb-shield.webp",
  "fx-shockwave.webp",
];

const bad = [];

for (const name of REQUIRED) {
  const full = path.join(fxDir, name);
  if (!fs.existsSync(full)) {
    bad.push({ name, issue: "missing" });
    continue;
  }
  if (!name.endsWith(".webp")) {
    bad.push({ name, issue: "not-webp" });
    continue;
  }
  const meta = await sharp(full).metadata();
  if (meta.format !== "webp" || meta.width !== 512 || meta.height !== 512) {
    bad.push({
      name,
      issue: `${meta.format ?? "?"} ${meta.width ?? "?"}x${meta.height ?? "?"}`,
    });
  }
}

const legacySvg = fs
  .readdirSync(fxDir)
  .filter((f) => f.endsWith(".svg"));
if (legacySvg.length) {
  for (const name of legacySvg) {
    bad.push({ name, issue: "legacy-svg-present" });
  }
}

console.log(`battle fx check: bad=${bad.length}`);
for (const row of bad.slice(0, 40)) {
  console.log(`  ${row.name}: ${row.issue}`);
}
if (bad.length > 40) console.log(`  ... +${bad.length - 40} more`);
if (bad.length) process.exit(1);
