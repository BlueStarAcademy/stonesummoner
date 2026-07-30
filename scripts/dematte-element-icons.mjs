/**
 * Punch outer black matte on element medallions (edge flood-fill → alpha).
 * Keeps the dark disc inside the gold ring.
 * Usage: node scripts/dematte-element-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "../apps/web/public/art/ui/element");
const ELS = ["fire", "water", "wind", "light", "dark"];
const LIM = 22;

function isMatte(r, g, b, a) {
  if (a < 8) return true;
  return r <= LIM && g <= LIM && b <= LIM;
}

for (const el of ELS) {
  const src = path.join(dir, `${el}.webp`);
  if (!fs.existsSync(src)) {
    console.warn("missing", src);
    continue;
  }
  const { data, info } = await sharp(src)
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
  let punched = 0;
  while (q.length) {
    const i = q.pop();
    rgba[i * 4 + 3] = 0;
    punched += 1;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (visited[i]) continue;
      const o = i * 4;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const a = rgba[o + 3];
      if (a < 8) continue;
      if (!(r < 40 && g < 40 && b < 40)) continue;
      let near = false;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        if (visited[(y + dy) * w + (x + dx)]) {
          near = true;
          break;
        }
      }
      if (!near) continue;
      const lum = (r + g + b) / 3;
      rgba[o + 3] = Math.round(a * Math.min(1, lum / 36));
    }
  }
  await sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(src);
  console.log(
    `${el}: punched ${punched} (${Math.round((100 * punched) / (w * h))}%)`,
  );
}
