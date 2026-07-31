/**
 * Dematte + WebP encode for painted symbol marks.
 * Input: apps/web/public/art/ui/symbol/*-mark.png (or staging)
 * Output: same basename .webp (alpha), removes source PNG if converted
 *
 * Usage: node scripts/process-symbol-marks.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../apps/web/public/art/ui/symbol");
const LIM = 36;

const SET_IDS = [
  "hwalro",
  "yongmaeng",
  "mussang",
  "haengma",
  "jipjung",
  "gunhim",
  "yeongyeol",
  "bogang",
  "hwangyeok",
  "ssangnip",
  "eungjing",
  "tagae",
  "pamyeol",
  "myosu",
  "gyeongno",
  "chimtu",
];

function isMatte(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  if (lum <= LIM && chroma <= 22) return true;
  if (r <= LIM + 4 && g <= LIM + 4 && b <= LIM + 10 && chroma <= 28) return true;
  // near-white studio backdrops
  if (lum >= 245 && chroma <= 12) return true;
  return false;
}

async function dematteToWebp(srcPng, dstWebp) {
  const { data, info } = await sharp(srcPng)
    .resize(256, 256, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const rgba = new Uint8ClampedArray(data);
  const visited = new Uint8Array(w * h);
  const q = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isMatte(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
    visited[i] = 1;
    q.push(i);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (q.length) {
    const i = q.pop();
    rgba[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  await sharp(Buffer.from(rgba), { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(dstWebp);
}

fs.mkdirSync(outDir, { recursive: true });

let n = 0;
for (const id of SET_IDS) {
  const png = path.join(outDir, `${id}-mark.png`);
  const webp = path.join(outDir, `${id}-mark.webp`);
  if (!fs.existsSync(png)) {
    if (fs.existsSync(webp)) {
      console.log(`skip ${id} (webp exists, no png)`);
      continue;
    }
    console.warn(`missing ${id}-mark.png`);
    continue;
  }
  await dematteToWebp(png, webp);
  fs.unlinkSync(png);
  n += 1;
  console.log(`wrote ${id}-mark.webp`);
}
console.log(`processed ${n} marks -> ${outDir}`);
