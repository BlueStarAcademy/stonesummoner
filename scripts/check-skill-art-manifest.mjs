import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(
  root,
  "docs",
  "art",
  "skill",
  "skill-art-manifest.json",
);
const publicRoot = path.join(root, "apps", "web", "public");

if (!fs.existsSync(manifestPath)) {
  console.error(`missing manifest: ${path.relative(root, manifestPath)}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const ids = entries.map((entry) => entry.id);
const missingIcons = entries.filter(
  (entry) =>
    typeof entry.iconPath !== "string" ||
    !fs.existsSync(path.join(publicRoot, entry.iconPath.replace(/^\//, ""))),
);
const invalidIds = entries.filter(
  (entry) =>
    typeof entry.id !== "string" ||
    !entry.id.startsWith("monster:") && !entry.id.startsWith("summoner:"),
);

const expected = { total: 800, monster: 750, summoner: 50 };
const actual = {
  total: entries.length,
  monster: entries.filter((entry) => entry.kind === "monster").length,
  summoner: entries.filter((entry) => entry.kind === "summoner").length,
};
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

if (
  actual.total !== expected.total ||
  actual.monster !== expected.monster ||
  actual.summoner !== expected.summoner ||
  duplicateIds.length > 0 ||
  invalidIds.length > 0 ||
  missingIcons.length > 0
) {
  console.error(
    JSON.stringify(
      {
        expected,
        actual,
        duplicateIds: [...new Set(duplicateIds)],
        invalidIds: invalidIds.map((entry) => entry.id),
        missingIcons: missingIcons.map((entry) => entry.iconPath),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  `skill art manifest OK: ${actual.monster} monster + ${actual.summoner} summoner icons`,
);
