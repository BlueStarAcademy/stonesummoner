/**
 * Remove low-quality procedural skill WebP from ship dirs.
 * Procedural previews stay under skill/_procedural/ only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readLock, shipDir, writeLock } from "./lib/skill-art-lock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const MIN_PAINTED_BYTES = 20_000;
const kinds = ["monster", "ui", "summoner"];

let removed = 0;
let kept = 0;

for (const kind of kinds) {
  const ship = shipDir(root, kind);
  if (!fs.existsSync(ship)) continue;
  const lock = readLock(root, kind);
  let kindRemoved = 0;
  let kindKept = 0;
  for (const name of fs.readdirSync(ship)) {
    if (!name.endsWith(".webp")) continue;
    const full = path.join(ship, name);
    const size = fs.statSync(full).size;
    const source = lock.locked?.[name];
    const procedural =
      source === "procedural-ship" || size < MIN_PAINTED_BYTES;
    if (!procedural) {
      kindKept += 1;
      continue;
    }
    fs.unlinkSync(full);
    delete lock.locked?.[name];
    kindRemoved += 1;
  }
  writeLock(root, kind, lock);
  removed += kindRemoved;
  kept += kindKept;
  console.log(`${kind}: removed ${kindRemoved}, kept ${kindKept}`);
}

console.log(`unship done: removed ${removed}, kept ${kept}`);
