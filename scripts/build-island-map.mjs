/**
 * Export the hub map source PNG to the WebP sizes the client loads.
 * Usage: node scripts/build-island-map.mjs <source.png>
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/build-island-map.mjs <source.png>");

const outDir = path.join(root, "apps/web/public/art/home");

/** Keep 2:3 — must stay in sync with .island-world aspect-ratio. */
const SIZES = [
  { name: "home-island-tri@2x.webp", w: 2880, h: 4320, quality: 88 },
  { name: "home-island-tri.webp", w: 1440, h: 2160, quality: 86 },
  { name: "home-island-tri-720.webp", w: 720, h: 1080, quality: 84 },
];

for (const size of SIZES) {
  const out = path.join(outDir, size.name);
  await sharp(src)
    .resize(size.w, size.h, { fit: "fill", kernel: "lanczos3" })
    .webp({ quality: size.quality, effort: 6 })
    .toFile(out);
  console.log(`wrote ${size.name} ${size.w}x${size.h}`);
}
