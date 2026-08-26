/**
 * Verify HQ gear icon coverage (125 stems: 25 weapons + 100 common).
 *
 * Usage:
 *   node scripts/check-gear-art.mjs
 *   node scripts/check-gear-art.mjs --strict
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GEAR_ART_EXPECTED_COUNT,
  GEAR_ART_STEMS,
} from "./lib/gear-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const outDir = path.join(root, "apps/web/public/art/ui/gear");

const missing = [];
const present = [];

for (const stem of GEAR_ART_STEMS) {
  const p = path.join(outDir, `${stem}.webp`);
  if (fs.existsSync(p)) present.push(stem);
  else missing.push(stem);
}

console.log(
  `gear art expected=${GEAR_ART_EXPECTED_COUNT} present=${present.length} missing=${missing.length}`,
);
if (missing.length > 0) {
  console.log(missing.slice(0, 30).join("\n"));
  if (missing.length > 30) console.log(`... +${missing.length - 30} more`);
}
if (strict && missing.length > 0) process.exit(1);
