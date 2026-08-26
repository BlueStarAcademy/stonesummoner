/**
 * Generate docs/art/monster/families/{familyId}.md prompt sheets.
 * Usage: node scripts/gen-family-prompt-sheets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FAMILY_IDS, ELEMENTS } from "./lib/monster-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const rosterPath = path.join(root, "docs/art/monster/roster-50.md");
const outDir = path.join(root, "docs/art/monster/families");

const rosterText = fs.readFileSync(rosterPath, "utf8");
const rows = [...rosterText.matchAll(
  /\|\s*\d+\s*\|\s*(\w+)\s*\|\s*([^\|]+)\s*\|/g,
)].map((m) => ({ familyId: m[1], nameKo: m[2].trim() }));

fs.mkdirSync(outDir, { recursive: true });

for (const { familyId, nameKo } of rows) {
  if (!FAMILY_IDS.includes(familyId)) continue;
  const elNotes = ELEMENTS.map(
    (el) =>
      `- **${el}**: baked palette per element-palette.md — distinct from other elements`,
  ).join("\n");
  const body = [
    `# ${familyId} (${nameKo})`,
    "",
    "## Identity",
    "",
    "- Family silhouette and role from roster-50.md",
    `- artKey per element: ${familyId}_{element}`,
    "",
    "## Element variants",
    "",
    elNotes,
    "",
    "## Awaken delta",
    "",
    "- Brighter element aura, evolved armor trim, optional crown or wings",
    `- Portrait: ${familyId}_{element}_awaken.webp`,
    `- Battle: ${familyId}_{element}-awaken-front.webp / -awaken-back.webp`,
    "",
    "## Prompts",
    "",
    "Use master blocks in ../prompts.md + element palette + this identity.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(outDir, `${familyId}.md`), body, "utf8");
  console.log("wrote", familyId);
}

console.log("done", rows.length);
