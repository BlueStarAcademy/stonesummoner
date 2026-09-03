/**
 * Copy painted PNG/WebP from repo assets/ into install pipeline and run install.
 *
 * Place files under:
 *   assets/monster/battle/{artKey}-front.png
 *   assets/monster/battle/{artKey}-awaken-front.png
 *
 * Usage:
 *   node scripts/sync-painted-monster-art.mjs --families wolf_fighter,moss_turtle
 *   node scripts/sync-painted-monster-art.mjs --all
 *   node scripts/sync-painted-monster-art.mjs --assets C:/art-source --families wolf_fighter
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

const assetsRoot = path.resolve(
  argVal("--assets") ||
    process.env.CURSOR_ASSETS ||
    path.join(root, "assets"),
);
if (!path.isAbsolute(assetsRoot)) {
  console.error(`assets path must resolve to an absolute path: ${assetsRoot}`);
  process.exit(1);
}
process.env.CURSOR_ASSETS = assetsRoot;

const r = spawnSync(
  process.execPath,
  [
    path.join(root, "scripts/install-battle-stills.mjs"),
    "--families",
    families.join(","),
  ],
  { cwd: root, stdio: "inherit", env: process.env },
);
process.exit(r.status ?? 1);
