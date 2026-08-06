/**
 * Asymmetric safe margin for battle stills (feet near bottom).
 * Crops to opaque bbox, then places in 768² with ~12% top/sides and ~5% bottom.
 *
 * Usage:
 *   node scripts/pad-battle-stills.mjs
 *   node scripts/pad-battle-stills.mjs --dir apps/web/public/art/summoner/battle --force
 *   node scripts/pad-battle-stills.mjs --qa
 *   node scripts/pad-battle-stills.mjs --dir dematteDir --staging outDir --force
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const dir = path.resolve(
  root,
  argVal("--dir") || "apps/web/public/art/monster/battle",
);
const staging = argVal("--staging")
  ? path.resolve(root, argVal("--staging"))
  : null;
const qa = args.includes("--qa");
const force = args.includes("--force");
const SIZE = 768;
const PAD_X = 0.12;
const PAD_TOP = 0.12;
const PAD_BOTTOM = 0.05;
const ALPHA_T = 18;

async function opaqueBounds(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let minY = h;
  let maxY = -1;
  let minX = w;
  let maxX = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * c + (c - 1)] > ALPHA_T) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxY < 0) return null;
  return { minX, minY, maxX, maxY, w, h };
}

async function edgeTouches(file) {
  const b = await opaqueBounds(file);
  if (!b) return false;
  const edge = 4;
  return (
    b.minY <= edge ||
    b.maxY >= b.h - 1 - edge ||
    b.minX <= edge ||
    b.maxX >= b.w - 1 - edge
  );
}

async function padBuffer(file) {
  const padL = Math.round(SIZE * PAD_X);
  const padR = Math.round(SIZE * PAD_X);
  const padT = Math.round(SIZE * PAD_TOP);
  const padB = Math.round(SIZE * PAD_BOTTOM);
  const innerW = SIZE - padL - padR;
  const innerH = SIZE - padT - padB;

  const bounds = await opaqueBounds(file);
  let pipeline = sharp(file).ensureAlpha();
  if (bounds) {
    pipeline = pipeline.extract({
      left: bounds.minX,
      top: bounds.minY,
      width: bounds.maxX - bounds.minX + 1,
      height: bounds.maxY - bounds.minY + 1,
    });
  }

  const fittedBuf = await pipeline
    .resize(innerW, innerH, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const meta = await sharp(fittedBuf).metadata();
  const fw = meta.width ?? innerW;
  const fh = meta.height ?? innerH;
  const left = padL + Math.round((innerW - fw) / 2);
  const right = SIZE - left - fw;
  const top = padT + (innerH - fh); // bottom-align in inner box
  const bottom = SIZE - top - fh;

  return sharp(fittedBuf)
    .ensureAlpha()
    .extend({
      top,
      bottom,
      left,
      right,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
}

async function writeOut(file, buf) {
  const base = path.basename(file).replace(/\.(png|jpe?g)$/i, ".webp");
  const dest = staging
    ? path.join(staging, base)
    : /\.webp$/i.test(file)
      ? file
      : file.replace(/\.(png|jpe?g)$/i, ".webp");
  if (staging) fs.mkdirSync(staging, { recursive: true });
  const tmp = `${dest}.${process.pid}.${Date.now()}.padtmp`;
  await fs.promises.writeFile(tmp, buf);
  try {
    await fs.promises.unlink(dest).catch(() => {});
    await fs.promises.rename(tmp, dest);
  } catch {
    await fs.promises.copyFile(tmp, dest);
  }
  await fs.promises.unlink(tmp).catch(() => {});
  return dest;
}

const names = fs.readdirSync(dir).filter((f) => /\.(webp|png)$/i.test(f));
const byStem = new Map();
for (const f of names) {
  const stem = f.replace(/\.(webp|png|jpe?g)$/i, "");
  const prev = byStem.get(stem);
  if (!prev || f.endsWith(".webp")) byStem.set(stem, f);
}
const unique = [...byStem.values()].map((f) => path.join(dir, f));

let n = 0;
const fail = [];
for (const file of unique) {
  const touches = await edgeTouches(file);
  if (!touches && !staging && !force) continue;
  const buf = await padBuffer(file);
  const out = await writeOut(file, buf);
  n++;
  console.log("padded", path.basename(out));
  if (qa && (await edgeTouches(out))) fail.push(path.basename(out));
}
console.log(`done: padded ${n}/${unique.length}`);
if (qa && fail.length) {
  console.error("QA fail (still touching edges):", fail.join(", "));
  process.exit(1);
}
