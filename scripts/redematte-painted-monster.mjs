/**
 * Re-dematte installed painted monster WebP from source PNG/WebP in assets/.
 *
 * Usage:
 *   node scripts/redematte-painted-monster.mjs --families wolf_fighter
 *   node scripts/redematte-painted-monster.mjs --all
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FAMILY_IDS } from "./lib/monster-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const families = args.includes("--all")
  ? FAMILY_IDS
  : argVal("--families")
    ? argVal("--families").split(",").map((s) => s.trim()).filter(Boolean)
    : [];

if (families.length === 0) {
  console.error("usage: --families id1,id2 or --all");
  process.exit(1);
}

process.env.CURSOR_ASSETS = path.join(root, "assets");
const r = spawnSync(
  process.execPath,
  [
    path.join(root, "scripts/sync-painted-monster-art.mjs"),
    "--families",
    families.join(","),
  ],
  { cwd: root, stdio: "inherit", env: process.env },
);
process.exit(r.status ?? 1);
