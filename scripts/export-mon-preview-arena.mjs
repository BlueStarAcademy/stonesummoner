/**
 * Export mon-inspect preview battle-stage art.
 * Usage: node scripts/export-mon-preview-arena.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-project-StoneSummoner/assets/mon-preview-arena-raw.png",
);
const outDir = path.join(root, "apps/web/public/art/hub");
const docsDir = path.join(root, "docs/art/hub");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

if (!fs.existsSync(src)) {
  console.error("Missing source:", src);
  process.exit(1);
}

const W = 1080;
const H = 608;

const buf = await sharp(src)
  .rotate()
  .resize(W, H, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();

const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="r" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stop-color="#0e0b16" stop-opacity="0"/>
      <stop offset="55%" stop-color="#0e0b16" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0e0b16" stop-opacity="0.38"/>
    </radialGradient>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e0b16" stop-opacity="0.12"/>
      <stop offset="45%" stop-color="#0e0b16" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0e0b16" stop-opacity="0.28"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#r)"/>
  <rect width="100%" height="100%" fill="url(#b)"/>
</svg>`);

const vignetted = await sharp(buf)
  .composite([{ input: svg, blend: "over" }])
  .toBuffer();

const master = path.join(outDir, "mon-preview-arena.webp");
const master720 = path.join(outDir, "mon-preview-arena-720.webp");

await sharp(vignetted).webp({ quality: 78, effort: 6 }).toFile(master);
await sharp(vignetted)
  .resize(720, 405, { fit: "cover" })
  .webp({ quality: 76, effort: 6 })
  .toFile(master720);
await sharp(vignetted)
  .png({ compressionLevel: 9 })
  .toFile(path.join(docsDir, "mon-preview-arena.png"));

const meta = await sharp(master).metadata();
console.log("wrote", master, fs.statSync(master).size, `${meta.width}x${meta.height}`);
console.log("wrote", master720, fs.statSync(master720).size);
