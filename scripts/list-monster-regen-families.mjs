/**
 * List monster families that still need skill icon regen (from audit).
 *
 * Usage:
 *   node scripts/list-monster-regen-families.mjs
 *   node scripts/list-monster-regen-families.mjs --limit 10
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = path.join(root, "docs/art/skill/skill-art-audit.json");
const args = process.argv.slice(2);
const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? args[args.indexOf("--limit") + 1] ?? 0);

if (!fs.existsSync(auditPath)) {
  console.error("Run npm run skill-art:audit first");
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const byFamily = new Map();
for (const row of audit.needsRegen) {
  if (row.kind !== "monster") continue;
  const stem = row.name.replace(/\.webp$/, "");
  const familyId = stem.replace(/-(fire|water|wind|light|dark)-s[123]$/, "");
  byFamily.set(familyId, (byFamily.get(familyId) ?? 0) + 1);
}

const families = [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const slice = limit > 0 ? families.slice(0, limit) : families;
for (const [familyId, count] of slice) {
  console.log(`${familyId}\t${count}`);
}
console.log(`total families=${families.length} icons=${[...byFamily.values()].reduce((a, b) => a + b, 0)}`);
