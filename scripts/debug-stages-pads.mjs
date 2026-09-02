/**
 * Detect circular stone pads on stages terrain and export ranked centroids.
 * Usage: node scripts/debug-stages-pads.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "apps/web/public/art/stages/stages-world-terrain.webp");
const SCALE = 2;
const W = Math.round(2880 / SCALE);
const H = Math.round(3840 / SCALE);

const { data } = await sharp(src)
  .resize(W, H, { kernel: "lanczos3" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then((r) => r);

const lum = new Float32Array(W * H);
const mask = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const p = i * 3;
  const r = data[p];
  const g = data[p + 1];
  const b = data[p + 2];
  const L = (r + g + b) / 3;
  lum[i] = L;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  // Pale stone disk: warm/neutral gray, not sky/water/grass
  const stone =
    L >= 158 &&
    L <= 225 &&
    chroma <= 42 &&
    !(b > r + 16 && b > 130) &&
    !(g > r + 24 && g > b + 12 && g > 130);
  mask[i] = stone ? 1 : 0;
}

// Morphological open-ish: keep pixels with enough stone neighbors
const cleaned = new Uint8Array(W * H);
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!mask[i]) continue;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (mask[(y + dy) * W + (x + dx)]) n++;
      }
    }
    cleaned[i] = n >= 5 ? 1 : 0;
  }
}

const visited = new Uint8Array(W * H);
const comps = [];
for (let i = 0; i < cleaned.length; i++) {
  if (!cleaned[i] || visited[i]) continue;
  const q = [i];
  visited[i] = 1;
  let n = 0;
  let sx = 0;
  let sy = 0;
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  while (q.length) {
    const cur = q.pop();
    const x = cur % W;
    const y = (cur / W) | 0;
    n++;
    sx += x;
    sy += y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (!cleaned[ni] || visited[ni]) continue;
      visited[ni] = 1;
      q.push(ni);
    }
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const aspect = bw / Math.max(1, bh);
  const fill = n / (bw * bh);
  const diamPct = Math.max(bw, bh) / W * 100;
  // Real pads are round-ish disks of meaningful size
  if (n < 220 || n > 18000) continue;
  if (aspect < 0.72 || aspect > 1.38) continue;
  if (fill < 0.38) continue;
  if (diamPct < 2.4 || diamPct > 12) continue;
  comps.push({
    n,
    x: +((sx / n / W) * 100).toFixed(1),
    y: +((sy / n / H) * 100).toFixed(1),
    diam: +diamPct.toFixed(1),
  });
}

comps.sort((a, b) => a.y - b.y || a.x - b.x);
console.log(`pads=${comps.length}`);
comps.forEach((c, i) =>
  console.log(
    `${String(i + 1).padStart(2)}  x=${c.x.toFixed(1).padStart(5)}  y=${c.y.toFixed(1).padStart(5)}  diam=${c.diam}  n=${c.n}`,
  ),
);

const outJson = path.join(root, "apps/web/public/art/stages/_pads.json");
fs.writeFileSync(outJson, JSON.stringify(comps, null, 2));

const overlay = Buffer.from(data);
for (const [idx, c] of comps.entries()) {
  const cx = Math.round((c.x / 100) * W);
  const cy = Math.round((c.y / 100) * H);
  const rad = Math.round((c.diam / 100) * W * 0.5);
  for (let a = 0; a < 72; a++) {
    const ang = (a / 72) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(ang) * rad);
    const y = Math.round(cy + Math.sin(ang) * rad);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const o = (y * W + x) * 3;
    overlay[o] = 255;
    overlay[o + 1] = 40;
    overlay[o + 2] = 40;
  }
  // crosshair
  for (let d = -4; d <= 4; d++) {
    for (const [x, y] of [
      [cx + d, cy],
      [cx, cy + d],
    ]) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const o = (y * W + x) * 3;
      overlay[o] = 255;
      overlay[o + 1] = 220;
      overlay[o + 2] = 40;
    }
  }
}
const outPng = path.join(root, "apps/web/public/art/stages/_debug-pads.png");
await sharp(overlay, { raw: { width: W, height: H, channels: 3 } })
  .png()
  .toFile(outPng);
console.log("wrote", outPng);
