/**
 * Fail if ship skill WebP look procedural (too small / procedural-ship lock).
 *
 *   node scripts/check-skill-art.mjs
 *   node scripts/check-skill-art.mjs --strict
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readLock, shipDir } from "./lib/skill-art-lock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const MIN_PAINTED_BYTES = {
  // Monster skill art is painted character-specific art when supplied.
  monster: 20_000,
  // Effect and summoner icons are compact vector-derived painted WebP.
  ui: 4_000,
  summoner: 4_000,
};
const kinds = ["monster", "ui", "summoner"];

const bad = [];

for (const kind of kinds) {
  const ship = shipDir(root, kind);
  if (!fs.existsSync(ship)) continue;
  const lock = readLock(root, kind);
  for (const name of fs.readdirSync(ship)) {
    if (!name.endsWith(".webp")) continue;
    const full = path.join(ship, name);
    const size = fs.statSync(full).size;
    const source = lock.locked?.[name];
    if (
      size < (MIN_PAINTED_BYTES[kind] ?? 4_000) ||
      source === "procedural-ship" ||
      (strict && source !== "painted")
    ) {
      bad.push({ kind, name, size, source: source ?? "none" });
    }
  }
}

console.log(
  `skill art check: bad=${bad.length}${strict ? " (strict=painted only)" : ""}`,
);
if (bad.length) {
  for (const row of bad.slice(0, 30)) {
    console.log(
      `  ${row.kind}/${row.name} ${row.size}B lock=${row.source}`,
    );
  }
  if (bad.length > 30) console.log(`  ... +${bad.length - 30} more`);
}
if (bad.length > 0) process.exit(1);
