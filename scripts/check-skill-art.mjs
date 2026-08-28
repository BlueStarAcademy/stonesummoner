/** Validate that only dedicated, painted skill WebP can ship. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { readLock, shipDir } from "./lib/skill-art-lock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const kinds = ["monster", "ui", "summoner"];
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs/art/skill/skill-art-manifest.json"),
    "utf8",
  ),
);
const expected = {
  monster: new Set(
    manifest.entries
      .filter((entry) => entry.kind === "monster")
      .map((entry) => path.basename(entry.iconPath)),
  ),
  ui: new Set(["damage.webp", "heal.webp", "mana.webp", "shield.webp"]),
  summoner: new Set(
    [
      ...manifest.entries
        .filter((entry) => entry.kind === "summoner")
        .map((entry) => path.basename(entry.iconPath)),
      "clean.webp",
      "declare.webp",
      "dual.webp",
      "guard.webp",
      "open.webp",
    ],
  ),
};

const bad = [];

for (const kind of kinds) {
  const ship = shipDir(root, kind);
  if (!fs.existsSync(ship)) {
    bad.push({ kind, name: "(directory)", issue: "missing ship directory" });
    continue;
  }
  const lock = readLock(root, kind);
  const names = fs
    .readdirSync(ship, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
  if (fs.existsSync(path.join(ship, "_procedural"))) {
    bad.push({ kind, name: "_procedural", issue: "retired source directory exists" });
  }
  for (const name of names) {
    if (!name.endsWith(".webp")) {
      bad.push({ kind, name, issue: "non-WebP skill art" });
      continue;
    }
    if (!expected[kind].has(name)) {
      bad.push({ kind, name, issue: "unexpected fallback asset" });
      continue;
    }
    const full = path.join(ship, name);
    const source = lock.locked?.[name];
    if (source !== "painted") {
      bad.push({ kind, name, issue: `lock=${source ?? "none"}` });
      continue;
    }
    const meta = await sharp(full).metadata();
    if (meta.format !== "webp" || meta.width !== 256 || meta.height !== 256) {
      bad.push({
        kind,
        name,
        issue: `${meta.format ?? "unknown"} ${meta.width ?? "?"}x${meta.height ?? "?"}`,
      });
    }
  }
  for (const name of expected[kind]) {
    if (!names.includes(name)) {
      bad.push({ kind, name, issue: "missing dedicated asset" });
    }
  }
}

console.log(`skill art check: bad=${bad.length} (dedicated painted WebP only)`);
if (bad.length) {
  for (const row of bad.slice(0, 30)) {
    console.log(`  ${row.kind}/${row.name} ${row.issue}`);
  }
  if (bad.length > 30) console.log(`  ... +${bad.length - 30} more`);
}
if (bad.length > 0) process.exit(1);
