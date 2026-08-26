/**
 * Re-chroma-key battle PNGs in assets/monster/battle (fixes leftover magenta plates).
 *
 * Usage:
 *   node scripts/fix-chroma-battle-png.mjs --families wolf_fighter
 *   node scripts/fix-chroma-battle-png.mjs --all
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { artKeysForFamilies } from "./lib/monster-art-roster.mjs";
import {
  processChromaBattleRgba,
  finishDematteRgba,
  featherAlphaEdges,
  zeroClearRgb,
  TRANSPARENT_BATTLE_INSTALL,
} from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const families = args.includes("--all")
  ? null
  : argVal("--families")
    ? argVal("--families").split(",").map((s) => s.trim()).filter(Boolean)
    : [];

if (!args.includes("--all") && families.length === 0) {
  console.error("usage: --families id1,id2 or --all");
  process.exit(1);
}

const battleDir = path.join(root, "assets", "monster", "battle");
const artKeys = families === null ? null : artKeysForFamilies(families);

async function fixPng(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  await processChromaBattleRgba(rgba, info.width, info.height, TRANSPARENT_BATTLE_INSTALL);
  await finishDematteRgba(rgba, info.width, info.height, TRANSPARENT_BATTLE_INSTALL);
  featherAlphaEdges(rgba, info.width, info.height, 2);
  zeroClearRgb(rgba);
  const tmp = `${src}.${process.pid}.tmp.png`;
  await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);
  await fs.promises.rename(tmp, src);
  return src;
}

const names = fs.readdirSync(battleDir).filter((f) => /-(front|back)\.png$/i.test(f));
let n = 0;
for (const name of names) {
  const base = name.replace(/\.png$/i, "");
  const artKey = base.replace(/-awaken-front$/, "").replace(/-front$/, "");
  if (artKeys && !artKeys.some((k) => base.startsWith(k))) continue;
  const src = path.join(battleDir, name);
  await fixPng(src);
  n += 1;
  console.log("fixed", name);
}
console.log(`done: ${n} PNG(s)`);
