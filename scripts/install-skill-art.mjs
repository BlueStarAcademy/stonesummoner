/**
 * Install painted skill icons → ship WebP (256², dematte). Locked after install.
 *
 * Drop PNG/WebP sources into (first match wins):
 *   apps/web/public/art/_staging/monster/skill/{name}.png
 *   assets/monster/skill/{name}.png
 *   $CURSOR_ASSETS/monster/skill/{name}.png
 *
 * Same pattern for ui/skill and summoner/skill with --kind ui|summoner
 *
 * Usage:
 *   node scripts/install-skill-art.mjs
 *   node scripts/install-skill-art.mjs --kind ui
 *   node scripts/install-skill-art.mjs --file capture_hound-fire-s1
 *   node scripts/install-skill-art.mjs --lock-ship
 *   node scripts/install-skill-art.mjs --force
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageToDematteWebp } from "./lib/dematte-webp.mjs";
import {
  isLocked,
  lockFile,
  lockAllShipWebp,
  shipDir,
  SKILL_SHIP_DIRS,
} from "./lib/skill-art-lock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const kind = argVal("--kind") ?? "monster";
const force = args.includes("--force");
const fileStem = argVal("--file");

const assetsRoot =
  process.env.CURSOR_ASSETS ||
  path.join(process.env.USERPROFILE || "", ".cursor/projects/c-project-StoneSummoner/assets");

const SOURCE_DIRS = [
  path.join(root, "apps/web/public/art/_staging", kind, "skill"),
  path.join(root, "assets", kind, "skill"),
  path.join(assetsRoot, kind, "skill"),
];

const outDir = shipDir(root, kind);
const DEMATTE = {
  size: 256,
  fit: "contain",
  lim: 36,
  chromaMax: 10,
  quality: 92,
};

if (args.includes("--lock-ship")) {
  const n = lockAllShipWebp(root, kind);
  console.log(`locked ${n} ship webp in ${SKILL_SHIP_DIRS[kind]}`);
  process.exit(0);
}

function findSource(stem) {
  for (const dir of SOURCE_DIRS) {
    for (const ext of [".png", ".webp"]) {
      const p = path.join(dir, `${stem}${ext}`);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

fs.mkdirSync(outDir, { recursive: true });

const stems = [];
if (fileStem) {
  stems.push(fileStem);
} else {
  const staging = SOURCE_DIRS[0];
  if (!fs.existsSync(staging)) {
    if (kind === "monster") {
      console.log(
        "No monster skill staging: runtime uses dedicated effect icons until painted monster skill art is supplied",
      );
      process.exit(0);
    }
    console.error(`No staging dir: ${staging}`);
    console.error("Drop painted PNGs there, or pass --file stem --lock-ship");
    process.exit(1);
  }
  for (const f of fs.readdirSync(staging)) {
    if (!/\.(png|webp)$/i.test(f)) continue;
    stems.push(f.replace(/\.(png|webp)$/i, ""));
  }
}

let installed = 0;
let skipped = 0;
let missing = 0;

for (const stem of [...new Set(stems)]) {
  const dstName = `${stem}.webp`;
  const dst = path.join(outDir, dstName);
  if (isLocked(root, kind, dstName) && fs.existsSync(dst) && !force) {
    skipped += 1;
    continue;
  }
  const src = findSource(stem);
  if (!src) {
    missing += 1;
    console.warn(`skip (no source): ${stem}`);
    continue;
  }
  await imageToDematteWebp(src, dst, DEMATTE);
  lockFile(root, kind, dstName, "painted");
  installed += 1;
  console.log(`installed ${dstName} <- ${path.basename(src)}`);
}

console.log(`done: installed ${installed}, skipped ${skipped}, missing ${missing}`);
