/**
 * One-time: move procedural SVG out of ship dirs into _procedural/, lock ship WebP.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lockAllShipWebp, shipDir } from "./lib/skill-art-lock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const kinds = ["monster", "ui", "summoner"];

for (const kind of kinds) {
  const dir = shipDir(root, kind);
  if (!fs.existsSync(dir)) continue;
  const proc = path.join(dir, "_procedural");
  fs.mkdirSync(proc, { recursive: true });
  let moved = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".svg")) continue;
    const from = path.join(dir, name);
    const to = path.join(proc, name);
    if (fs.existsSync(to)) fs.unlinkSync(from);
    else fs.renameSync(from, to);
    moved += 1;
  }
  const locked = lockAllShipWebp(root, kind);
  console.log(`${kind}: moved ${moved} svg → _procedural, locked ${locked} webp`);
}
