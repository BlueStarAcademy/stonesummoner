/**
 * Promote procedural WebP previews → ship (locked). **Dev preview only.**
 * Painted PNG install is the ship target: npm run skill-art:install
 *
 * Blocked unless ALLOW_PROCEDURAL_SHIP=1 (never use in normal workflows).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lockFile, shipDir } from "./lib/skill-art-lock.mjs";

if (process.env.ALLOW_PROCEDURAL_SHIP !== "1") {
  console.error(
    "refused: procedural must not ship. Use npm run skill-art:install for painted HQ.",
  );
  console.error("Dev-only override: ALLOW_PROCEDURAL_SHIP=1 node scripts/publish-skill-art-proc.mjs");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const kinds = ["monster", "ui", "summoner"];
const force = process.argv.includes("--force");

let copied = 0;
let skipped = 0;

for (const kind of kinds) {
  const ship = shipDir(root, kind);
  const proc = path.join(ship, "_procedural");
  if (!fs.existsSync(proc)) continue;
  for (const name of fs.readdirSync(proc)) {
    if (!name.endsWith(".webp")) continue;
    const src = path.join(proc, name);
    const dst = path.join(ship, name);
    if (fs.existsSync(dst) && !force) {
      const srcT = fs.statSync(src).mtimeMs;
      const dstT = fs.statSync(dst).mtimeMs;
      if (dstT >= srcT) {
        skipped += 1;
        continue;
      }
    }
    fs.copyFileSync(src, dst);
    lockFile(root, kind, name, "procedural-ship");
    copied += 1;
  }
}

console.log(`published ${copied} procedural webp to ship, skipped ${skipped}`);
