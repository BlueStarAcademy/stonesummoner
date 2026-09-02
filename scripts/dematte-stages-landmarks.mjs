/**
 * Punch white/near-white matte from stages landmark WebPs (edge flood + pure-white key).
 * Usage: node scripts/dematte-stages-landmarks.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { zeroClearRgb } from "./lib/dematte-webp.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "apps/web/public/art/stages");
const outDir = path.join(dir, "_dematte_out");

function isWhiteMatte(r, g, b, a, lim = 236) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const chroma = max - min;
  return lum >= lim && chroma <= 18;
}

function punchWhiteMatte(rgba, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isWhiteMatte(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
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
    const o = i * 4;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  // Soft fringe: near-white beside transparent becomes soft alpha.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const o = i * 4;
      if (rgba[o + 3] < 8) continue;
      if (!isWhiteMatte(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3], 228)) {
        continue;
      }
      let nearClear = false;
      for (let dy = -1; dy <= 1 && !nearClear; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (rgba[((y + dy) * w + (x + dx)) * 4 + 3] < 8) {
            nearClear = true;
            break;
          }
        }
      }
      if (nearClear) {
        rgba[o] = 0;
        rgba[o + 1] = 0;
        rgba[o + 2] = 0;
        rgba[o + 3] = 0;
      }
    }
  }
  zeroClearRgb(rgba);
}

fs.mkdirSync(outDir, { recursive: true });
const files = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith("landmark-") && f.endsWith(".webp") && !f.includes("dematte"));

for (const f of files) {
  const src = path.join(dir, f);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  punchWhiteMatte(rgba, info.width, info.height);
  let trans = 0;
  let white = 0;
  const total = info.width * info.height;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 8) trans++;
    else if (rgba[i] > 245 && rgba[i + 1] > 245 && rgba[i + 2] > 245) white++;
  }
  const dst = path.join(outDir, f);
  await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(dst);
  console.log(
    `${f} trans=${((trans / total) * 100).toFixed(1)}% white=${((white / total) * 100).toFixed(1)}%`,
  );
}
