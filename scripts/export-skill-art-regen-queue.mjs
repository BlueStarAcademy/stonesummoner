/**
 * Export stems that failed skill art audit for batch regeneration.
 *
 * Usage:
 *   node scripts/export-skill-art-regen-queue.mjs
 *   node scripts/export-skill-art-regen-queue.mjs --family stone_golem
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSkillArtPrompt } from "./lib/skill-art-prompts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const auditPath = path.join(root, "docs/art/skill/skill-art-audit.json");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs/art/skill/skill-art-manifest.json"),
    "utf8",
  ),
);

const args = process.argv.slice(2);
function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
const familyFilter = argVal("--family");

if (!fs.existsSync(auditPath)) {
  console.error("Run: node scripts/audit-skill-art.mjs --json docs/art/skill/skill-art-audit.json");
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const entryByStem = new Map(
  manifest.entries.map((entry) => [
    entry.iconPath.replace(/^\/art\/[^/]+\/skill\//, "").replace(/\.webp$/, ""),
    entry,
  ]),
);

const queue = [];
for (const row of audit.needsRegen) {
  const stem = row.name.replace(/\.webp$/, "");
  const entry = entryByStem.get(stem);
  if (familyFilter && entry?.familyId !== familyFilter) continue;
  queue.push({
    kind: row.kind,
    stem,
    issues: row.issues,
    prompt: entry ? buildSkillArtPrompt(entry) : null,
    familyId: entry?.familyId ?? null,
  });
}

const outPath = path.join(
  root,
  "docs/art/skill",
  familyFilter ? `regen-queue-${familyFilter}.json` : "regen-queue.json",
);
fs.writeFileSync(outPath, JSON.stringify({ count: queue.length, queue }, null, 2), "utf8");
console.log(`wrote ${path.relative(root, outPath)} (${queue.length} stems)`);
