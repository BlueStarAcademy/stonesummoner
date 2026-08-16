/**
 * Debug helper: auto-detect the flat beige building terraces in the hub map and
 * print their centroids as percentages of the bitmap.
 * Usage: node scripts/debug-island-pads.mjs [annotated.png]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "apps/web/public/art/home/home-island-tri@2x.webp");
const out = process.argv[2];

const W = 480;
const H = 720;
const MIN_AREA = 90;

const { data } = await sharp(src).resize(W, H, { fit: "fill" }).removeAlpha().raw().toBuffer({
  resolveWithObject: true,
});

/** Terraces are flat warm beige: bright, red>=green>blue, low saturation. */
function isPad(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const bright = (r + g + b) / 3;
  if (bright < 150 || bright > 240) return false;
  if (g > r + 6) return false;
  if (g <= b + 8) return false;
  const warmth = r - b;
  return warmth >= 22 && warmth <= 80;
}

const mask = new Uint8Array(W * H);
for (let p = 0; p < W * H; p += 1) if (isPad(p * 3)) mask[p] = 1;

const seen = new Uint8Array(W * H);
const blobs = [];
const stack = new Int32Array(W * H);

for (let start = 0; start < W * H; start += 1) {
  if (!mask[start] || seen[start]) continue;
  let top = 0;
  stack[top++] = start;
  seen[start] = 1;
  let area = 0;
  let sx = 0;
  let sy = 0;
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  while (top > 0) {
    const p = stack[--top];
    const x = p % W;
    const y = (p / W) | 0;
    area += 1;
    sx += x;
    sy += y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (x > 0 && mask[p - 1] && !seen[p - 1]) (seen[p - 1] = 1), (stack[top++] = p - 1);
    if (x < W - 1 && mask[p + 1] && !seen[p + 1]) (seen[p + 1] = 1), (stack[top++] = p + 1);
    if (y > 0 && mask[p - W] && !seen[p - W]) (seen[p - W] = 1), (stack[top++] = p - W);
    if (y < H - 1 && mask[p + W] && !seen[p + W]) (seen[p + W] = 1), (stack[top++] = p + W);
  }
  if (area < MIN_AREA) continue;
  blobs.push({
    area,
    x: (sx / area / W) * 100,
    y: (sy / area / H) * 100,
    w: ((maxX - minX + 1) / W) * 100,
    h: ((maxY - minY + 1) / H) * 100,
  });
}

blobs.sort((a, b) => a.y - b.y || a.x - b.x);
console.log(`${blobs.length} terraces (area >= ${MIN_AREA}px @ ${W}x${H})`);
for (const b of blobs) {
  console.log(
    `  { x: ${b.x.toFixed(1)}, y: ${b.y.toFixed(1)} },  // area ${b.area}, ${b.w.toFixed(1)}% x ${b.h.toFixed(1)}%`,
  );
}

if (out) {
  const marks = blobs
    .map(
      (b) =>
        `<circle cx="${(b.x / 100) * W}" cy="${(b.y / 100) * H}" r="9" fill="#ff00d0aa" stroke="#fff" stroke-width="3"/>` +
        `<text x="${(b.x / 100) * W + 12}" y="${(b.y / 100) * H + 5}" font-size="16" font-family="Arial" font-weight="bold" fill="#ff00d0" stroke="#fff" stroke-width="0.6">${b.x.toFixed(0)},${b.y.toFixed(0)}</text>`,
    )
    .join("");
  await sharp(src)
    .resize(W, H, { fit: "fill" })
    .composite([
      { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${marks}</svg>`), top: 0, left: 0 },
    ])
    .png()
    .toFile(out);
  console.log(`wrote ${out}`);
}
