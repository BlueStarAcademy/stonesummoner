/**
 * Fix residual flat near-white plate inside installed monster WebP.
 *
 * Outer dematte often leaves studio #fff in wing/limb gaps. Prefer reinstall
 * from transparent Cursor assets when available; otherwise punch enclosed
 * flat bright plate in place.
 *
 * Usage:
 *   node scripts/fix-enclosed-white-monster-art.mjs
 *   node scripts/fix-enclosed-white-monster-art.mjs --families gale_bat
 *   node scripts/fix-enclosed-white-monster-art.mjs --punch-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  artKeysForFamilies,
  MONSTER_ART_KEYS,
} from "./lib/monster-art-roster.mjs";
import {
  imageToInstalledBattleWebp,
  punchEnclosedBrightMatte,
  zeroClearRgb,
  writeWebpAtomic,
  TRANSPARENT_PORTRAIT_INSTALL,
  featherAlphaEdges,
  rawRgbaToTransparentWebp,
  PORTRAIT_DEMATTE,
} from "./lib/dematte-webp.mjs";
import { computeBustRegion, DEFAULT_BUST_CROP } from "./lib/bust-crop.mjs";
import { writePortraitDerivatives } from "./lib/portrait-derivatives.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const punchOnly = args.includes("--punch-only");
const familiesArg = argVal("--families");
const roster = familiesArg
  ? artKeysForFamilies(
      familiesArg.split(",").map((s) => s.trim()).filter(Boolean),
    )
  : MONSTER_ART_KEYS;

const assetsRoot =
  process.env.CURSOR_ASSETS || path.join(root, "assets");
const battleAssetsDir = path.join(assetsRoot, "monster", "battle");
const transparentBattleAssetsDir = path.join(
  assetsRoot,
  "monster",
  "battle-transparent",
);
const battleOutDir = path.join(root, "apps/web/public/art/monster/battle");
const portraitOutDir = path.join(root, "apps/web/public/art/monster");

const WHITE_MIN = 400;

async function countNearWhite(filePath) {
  const { data } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const chroma =
      Math.max(data[i], data[i + 1], data[i + 2]) -
      Math.min(data[i], data[i + 1], data[i + 2]);
    if (lum >= 230 && chroma <= 20) n += 1;
  }
  return n;
}

function resolveBattleSrc(name) {
  const dirs = [transparentBattleAssetsDir, battleAssetsDir];
  for (const dir of dirs) {
    for (const ext of [".webp", ".png"]) {
      const p = path.join(dir, `${name}${ext}`);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

async function punchFile(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  const before = (() => {
    let n = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      if (rgba[i + 3] < 8) continue;
      const lum = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;
      const chroma =
        Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) -
        Math.min(rgba[i], rgba[i + 1], rgba[i + 2]);
      if (lum >= 230 && chroma <= 20) n += 1;
    }
    return n;
  })();
  if (before < WHITE_MIN) return { skipped: true, before, after: before };

  const stats = punchEnclosedBrightMatte(rgba, info.width, info.height);
  zeroClearRgb(rgba);
  if (stats.edgePunched + stats.enclosedPunched < 32) {
    return { skipped: true, before, after: before, ...stats };
  }

  const buf = await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ lossless: true, alphaQuality: 100, effort: 6 })
    .toBuffer();
  await writeWebpAtomic(filePath, buf);

  let after = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 8) continue;
    const lum = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;
    const chroma =
      Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) -
      Math.min(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (lum >= 230 && chroma <= 20) after += 1;
  }
  return { skipped: false, before, after, ...stats };
}

const BUST_OPTS = {
  ...DEFAULT_BUST_CROP,
  bustHeightRatio: 0.68,
  padRatio: 0.1,
  minZoom: 0.4,
  maxZoom: 0.68,
};

async function refreshPortraitFromBattle(artKey, awaken) {
  const tag = awaken ? "-awaken" : "";
  const suffix = awaken ? "_awaken" : "";
  const front = path.join(battleOutDir, `${artKey}${tag}-front.webp`);
  if (!fs.existsSync(front)) return false;
  const dest = path.join(portraitOutDir, `${artKey}${suffix}.webp`);
  const region = await computeBustRegion(front, BUST_OPTS);
  const { data, info } = await sharp(front)
    .extract({
      left: region.left,
      top: region.top,
      width: region.width,
      height: region.height,
    })
    .resize(PORTRAIT_DEMATTE.size, PORTRAIT_DEMATTE.size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  /* Already-dematted battle fronts — crop + feather only, no enclosed punch. */
  featherAlphaEdges(rgba, info.width, info.height, 2);
  await rawRgbaToTransparentWebp(
    rgba,
    info.width,
    info.height,
    dest,
    TRANSPARENT_PORTRAIT_INSTALL,
  );
  await writePortraitDerivatives(dest, portraitOutDir, `${artKey}${suffix}`);
  return true;
}

let reinstalled = 0;
let punched = 0;
let skipped = 0;
let portraits = 0;

for (const artKey of roster) {
  for (const tag of ["", "-awaken"]) {
    for (const side of ["front", "back"]) {
      const name = `${artKey}${tag}-${side}`;
      const out = path.join(battleOutDir, `${name}.webp`);
      if (!fs.existsSync(out)) continue;

      const white = await countNearWhite(out);
      if (white < WHITE_MIN) {
        skipped += 1;
        continue;
      }

      const src = punchOnly ? null : resolveBattleSrc(name);
      if (src) {
        const srcWhite = await countNearWhite(src);
        // Prefer source when it is already cleaner than the install.
        if (srcWhite < white * 0.35 || srcWhite < WHITE_MIN) {
          await imageToInstalledBattleWebp(src, out);
          reinstalled += 1;
          console.log(`reinstall ${name} (srcWhite=${srcWhite}, was=${white})`);
          // Residual soft plate in wing gaps — punch after reinstall too.
          const r = await punchFile(out);
          if (!r.skipped) {
            punched += 1;
            console.log(
              `  punch-after ${name}: ${r.before} → ${r.after}`,
            );
          }
          continue;
        }
      }

      const r = await punchFile(out);
      if (r.skipped) {
        skipped += 1;
      } else {
        punched += 1;
        console.log(
          `punch ${name}: ${r.before} → ${r.after} (edge=${r.edgePunched}, enc=${r.enclosedPunched})`,
        );
      }
    }
  }

  for (const awaken of [false, true]) {
    const ok = await refreshPortraitFromBattle(artKey, awaken);
    if (ok) portraits += 1;
  }
}

console.log(
  JSON.stringify({ reinstalled, punched, skipped, portraits }, null, 2),
);
