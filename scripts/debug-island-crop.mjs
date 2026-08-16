/**
 * Debug helper: crop a percentage region of the hub map and overlay a fine grid
 * labelled in whole-map percentages.
 * Usage: node scripts/debug-island-crop.mjs <x0> <y0> <x1> <y1> <out.png>
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "apps/web/public/art/home/home-island-tri@2x.webp");

const [x0, y0, x1, y1] = process.argv.slice(2, 6).map(Number);
const out = process.argv[6] ?? path.join(root, "tmp-island-crop.png");

const BASE_W = 900;
const BASE_H = 1350;
const left = Math.round((BASE_W * x0) / 100);
const top = Math.round((BASE_H * y0) / 100);
const width = Math.round((BASE_W * (x1 - x0)) / 100);
const height = Math.round((BASE_H * (y1 - y0)) / 100);

const SCALE = Math.min(3, Math.max(1, Math.floor(1100 / width)));
const outW = width * SCALE;
const outH = height * SCALE;

const lines = [];
for (let p = Math.ceil(x0); p <= x1; p += 1) {
  const px = Math.round(((p - x0) / (x1 - x0)) * outW);
  const major = p % 5 === 0;
  lines.push(
    `<line x1="${px}" y1="0" x2="${px}" y2="${outH}" stroke="#ff2020" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.95 : 0.4}"/>`,
  );
  if (major) {
    lines.push(
      `<text x="${px + 3}" y="24" font-size="22" font-family="Arial" font-weight="bold" fill="#ff2020">${p}</text>`,
    );
  }
}
for (let p = Math.ceil(y0); p <= y1; p += 1) {
  const py = Math.round(((p - y0) / (y1 - y0)) * outH);
  const major = p % 5 === 0;
  lines.push(
    `<line x1="0" y1="${py}" x2="${outW}" y2="${py}" stroke="#2040ff" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.95 : 0.4}"/>`,
  );
  if (major) {
    lines.push(
      `<text x="4" y="${py - 5}" font-size="22" font-family="Arial" font-weight="bold" fill="#2040ff">${p}</text>`,
    );
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}">${lines.join("")}</svg>`;

const based = await sharp(src).resize(BASE_W, BASE_H, { fit: "fill" }).png().toBuffer();
const cropped = await sharp(based).extract({ left, top, width, height }).png().toBuffer();

await sharp(cropped)
  .resize(outW, outH, { fit: "fill" })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile(out);

console.log(`wrote ${out} (${outW}x${outH})`);
