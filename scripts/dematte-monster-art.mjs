/**
 * Re-punch outer mattes on installed monster portrait & battle still WebPs.
 * Auto-detects near-white studio plates vs charcoal/black plates.
 *
 * Usage:
 *   node scripts/dematte-monster-art.mjs
 *   node scripts/dematte-monster-art.mjs --all
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  dematteBuffer,
  detectWhitePlate,
  finishDematteRgba,
  zeroClearRgb,
  WHITE_PLATE_BATTLE_DEMATTE,
  WHITE_PLATE_PORTRAIT_DEMATTE,
  PAINTED_BATTLE_DEMATTE,
  PORTRAIT_DEMATTE,
} from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../apps/web/public/art/monster");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(png|webp)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

async function dematteFile(src) {
  const rel = path.relative(root, src).replace(/\\/g, "/");
  const isPortrait = !rel.includes("/");
  const whitePlate = await detectWhitePlate(src);
  const preset = whitePlate
    ? isPortrait
      ? WHITE_PLATE_PORTRAIT_DEMATTE
      : WHITE_PLATE_BATTLE_DEMATTE
    : isPortrait
      ? PORTRAIT_DEMATTE
      : PAINTED_BATTLE_DEMATTE;
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const rgba = new Uint8ClampedArray(data);
  await dematteBuffer(rgba, w, h, preset.lim ?? 36, {
    chromaMax: preset.chromaMax ?? 8,
    flatRange: preset.flatRange ?? 4,
    allowBrightMatte: preset.allowBrightMatte,
    brightMatteLumMin: preset.brightMatteLumMin,
    opaqueMatteLum: preset.opaqueMatteLum,
    plateOnly: preset.plateOnly,
    plateMax: preset.plateMax,
  });
  await finishDematteRgba(rgba, w, h, preset);
  zeroClearRgb(rgba);

  let punched = 0;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 8) punched += 1;
  }
  const pct = punched / (w * h);
  if (pct < 0.01) return { punched: 0, skipped: true, mode: whitePlate ? "white" : "dark" };

  const img = sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  });
  const tmp = `${src}.dematte-tmp`;
  try {
    if (src.toLowerCase().endsWith(".png")) {
      await img.png({ compressionLevel: 9, effort: 8 }).toFile(tmp);
    } else {
      await img.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(tmp);
    }
    fs.copyFileSync(tmp, src);
    fs.unlinkSync(tmp);
  } catch (e) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw e;
  }
  return { punched, skipped: false, pct, mode: whitePlate ? "white" : "dark" };
}

const all = process.argv.includes("--all");
const files = walk(root).filter((f) => {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  if (all) return true;
  if (rel.startsWith("battle/")) return true;
  if (!rel.includes("/")) return true;
  return false;
});
let changed = 0;
let skipped = 0;
for (const f of files) {
  try {
    const r = await dematteFile(f);
    if (r.skipped) {
      skipped += 1;
      continue;
    }
    changed += 1;
    console.log(
      `${path.relative(root, f)} [${r.mode}]: punched ${r.punched} (${Math.round(r.pct * 100)}%)`,
    );
  } catch (e) {
    console.warn("fail", path.relative(root, f), e.message);
  }
}
console.log(`done: changed ${changed}, skipped ${skipped}, total ${files.length}`);
