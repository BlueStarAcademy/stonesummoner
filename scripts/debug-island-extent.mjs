/**
 * Debug helper: measure how much of the hub map bitmap is actually land, so we
 * know how much ocean margin exists around the archipelago.
 * Usage: node scripts/debug-island-extent.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "apps/web/public/art/home/home-island-tri@2x.webp");

const W = 360;
const H = 540;

const { data } = await sharp(src)
  .resize(W, H, { fit: "fill" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

/**
 * Land is green foliage or warm tan stone; sky/ocean is blue-dominant and
 * clouds are near-neutral, so both fail these margins.
 */
function isLand(r, g, b) {
  return g > b + 12 || r > b + 24;
}

let minX = W;
let maxX = -1;
let minY = H;
let maxY = -1;
const rowSpan = [];

for (let y = 0; y < H; y += 1) {
  let rowMin = W;
  let rowMax = -1;
  for (let x = 0; x < W; x += 1) {
    const i = (y * W + x) * 3;
    if (!isLand(data[i], data[i + 1], data[i + 2])) continue;
    if (x < rowMin) rowMin = x;
    if (x > rowMax) rowMax = x;
  }
  if (rowMax < 0) continue;
  rowSpan.push({ y, rowMin, rowMax });
  if (rowMin < minX) minX = rowMin;
  if (rowMax > maxX) maxX = rowMax;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
}

const pct = (v, total) => ((v / total) * 100).toFixed(1);
console.log("land bbox (% of bitmap):");
console.log(`  x: ${pct(minX, W)} .. ${pct(maxX + 1, W)}`);
console.log(`  y: ${pct(minY, H)} .. ${pct(maxY + 1, H)}`);
console.log(`  left margin:  ${pct(minX, W)}%`);
console.log(`  right margin: ${pct(W - maxX - 1, W)}%`);
console.log(`  top margin:   ${pct(minY, H)}%`);
console.log(`  bottom margin:${pct(H - maxY - 1, H)}%`);

const widest = rowSpan.reduce((a, r) => (r.rowMax - r.rowMin > a.rowMax - a.rowMin ? r : a));
console.log(
  `  widest row at y=${pct(widest.y, H)}%: x ${pct(widest.rowMin, W)}..${pct(widest.rowMax + 1, W)}`,
);
