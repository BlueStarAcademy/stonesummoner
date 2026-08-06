/**
 * Add transparent safe margin to battle stills that touch the frame edge,
 * so full-body characters aren't clipped in the battle UI.
 *
 * Usage:
 *   node scripts/pad-battle-stills.mjs
 *   node scripts/pad-battle-stills.mjs --dir apps/web/public/art/summoner/battle
 *   node scripts/pad-battle-stills.mjs --qa   # fail if any edge contact remains after pad
 *   node scripts/pad-battle-stills.mjs --staging outDir  # write padded copies, avoid locks
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
const staging = argVal("--staging");
const qa = args.includes("--qa");
const SIZE = 768;
const PAD = 0.12; // 12% margin each side after fit

async function edgeTouches(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let minY = h;
  let maxY = 0;
  let minX = w;
  let maxX = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * c + (c - 1)];
      if (a > 18) {
        found = true;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (!found) return false;
  const edge = 4;
  return minY <= edge || maxY >= h - 1 - edge || minX <= edge || maxX >= w - 1 - edge;
}

async function padBuffer(file) {
  const inner = Math.round(SIZE * (1 - PAD * 2));
  return sharp(file)
    .ensureAlpha()
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.round(SIZE * PAD),
      bottom: Math.round(SIZE * PAD),
      left: Math.round(SIZE * PAD),
      right: Math.round(SIZE * PAD),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(SIZE, SIZE)
    .webp({ quality: 88, alphaQuality: 100 })
    .toBuffer();
}

async function writeOut(file, buf) {
  const base = path.basename(file).replace(/\.(png|jpe?g)$/i, ".webp");
  const dest = staging
    ? path.join(staging, base)
    : file.replace(/\.(png|jpe?g)$/i, ".webp");
  if (staging) fs.mkdirSync(staging, { recursive: true });
  const tmp = `${dest}.padtmp`;
  await fs.promises.writeFile(tmp, buf);
  try {
    await fs.promises.copyFile(tmp, dest);
  } catch {
    const alt = dest.replace(/(\.[^.]+)$/, ".padded$1");
    await fs.promises.writeFile(alt, buf);
    await fs.promises.unlink(dest).catch(() => {});
    await fs.promises.rename(alt, dest);
  }
  await fs.promises.unlink(tmp).catch(() => {});
  return dest;
}

const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(webp|png)$/i.test(f))
  .map((f) => path.join(dir, f));

let n = 0;
const fail = [];
for (const file of files) {
  const touches = await edgeTouches(file);
  if (!touches && !staging) continue;
  const buf = await padBuffer(file);
  const out = await writeOut(file, buf);
  n++;
  console.log("padded", path.basename(out));
  if (qa && (await edgeTouches(out))) fail.push(path.basename(out));
}
console.log(`done: padded ${n}/${files.length}`);
if (qa && fail.length) {
  console.error("QA fail (still touching edges):", fail.join(", "));
  process.exit(1);
}
