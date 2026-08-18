/**
 * Punch the generated black plate on battle magic-stone sprites.
 * Edge flood-fill keeps the gem (including dark gold / obsidian) because
 * those pixels are not 4-connected to the border through near-black.
 *
 * Usage: node scripts/dematte-battle-stones.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "../apps/web/public/art/battle/stone");
const IDS = ["fire", "water", "wind", "light", "dark", "enemy"];

function isPlate(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  // Tinted black / baked glow that still reads as a plate on the board
  if (max <= 56) return true;
  if (lum <= 34) return true;
  if (lum <= 48 && max - min <= 28) return true;
  return false;
}

function dematte(rgba, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isPlate(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
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

  // Soften / lift the remaining black-baked fringe so it does not read as a plate.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (visited[i]) continue;
      const o = i * 4;
      const a = rgba[o + 3];
      if (a < 8) continue;
      let clearN = 0;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          if (rgba[(yy * w + xx) * 4 + 3] < 8) clearN += 1;
        }
      }
      if (clearN < 2) continue;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const max = Math.max(r, g, b);
      if (max <= 64) {
        rgba[o + 3] = 0;
        punched += 1;
        continue;
      }
      if (max < 130) {
        const lifted = Math.min(a, Math.round((255 * (max - 56)) / 74));
        rgba[o + 3] = lifted;
        if (lifted > 8) {
          const s = 255 / max;
          rgba[o] = Math.min(255, Math.round(r * s));
          rgba[o + 1] = Math.min(255, Math.round(g * s));
          rgba[o + 2] = Math.min(255, Math.round(b * s));
        }
      }
    }
  }
  return punched;
}

for (const id of IDS) {
  const srcPng = path.join(dir, "_src", `${id}.png`);
  const dstWebp = path.join(dir, `${id}.webp`);
  if (!fs.existsSync(srcPng)) {
    console.warn("missing", srcPng);
    continue;
  }
  const { data, info } = await sharp(srcPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  const punched = dematte(rgba, info.width, info.height);
  const raw = Buffer.from(rgba);
  const buf = await sharp(raw, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 90, alphaQuality: 100, effort: 5 })
    .toBuffer();
  const tmp = `${dstWebp}.${process.pid}.tmp`;
  await fs.promises.writeFile(tmp, buf);
  try {
    await fs.promises.unlink(dstWebp).catch(() => {});
    await fs.promises.rename(tmp, dstWebp);
  } catch {
    await fs.promises.copyFile(tmp, dstWebp);
    await fs.promises.unlink(tmp).catch(() => {});
  }
  await fs.promises.unlink(tmp).catch(() => {});
  console.log(id, "punched", punched, "/", info.width * info.height);
}
