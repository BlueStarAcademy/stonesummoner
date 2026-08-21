/**
 * Export PWA + Android launcher icons from the painted mark.
 *
 *   node scripts/export-app-icons.mjs
 *
 * Requires `sharp` (npm i sharp). Source: docs/art/auth/final/logo-mark-1024.png
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "node_modules_sharp_tmp/package.json"));
const sharp = require("sharp");

const root = path.resolve(here, "..");
const BG = { r: 14, g: 11, b: 22, alpha: 1 }; // #0e0b16
const src =
  process.env.ICON_SRC ||
  path.join(root, "docs/art/auth/final/logo-mark-1024.png");

const iconsDir = path.join(root, "apps/web/public/icons");
const authDir = path.join(root, "apps/web/public/art/auth");
const finalDir = path.join(root, "docs/art/auth/final");
const androidRes = path.join(root, "apps/web/android/app/src/main/res");

if (!fs.existsSync(src)) {
  console.error("Missing icon source:", src);
  process.exit(1);
}

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(authDir, { recursive: true });
fs.mkdirSync(finalDir, { recursive: true });

/** Opaque 1024 square on brand obsidian. */
async function flattenMaster() {
  return sharp(src)
    .rotate()
    .ensureAlpha()
    .flatten({ background: BG })
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Shrink onto brand field so circular / maskable crops keep the ring. */
async function inset(buf, scale) {
  const size = 1024;
  const inner = Math.round(size * scale);
  const innerBuf = await sharp(buf).resize(inner, inner).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: innerBuf, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function writePng(buf, outPath, size) {
  await sharp(buf)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function writeCircle(buf, outPath, size) {
  const r = size / 2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>
    </svg>`,
  );
  await sharp(buf)
    .resize(size, size)
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

const master = await flattenMaster();
// Master already keeps the ring inside the inner ~70% — enough for maskable's 80% safe zone.
const adaptiveFg = await inset(master, 0.86);

await writePng(master, path.join(finalDir, "logo-mark-1024.png"), 1024);
await writePng(master, path.join(finalDir, "logo-mark-512.png"), 512);
await writePng(master, path.join(finalDir, "logo-mark-192.png"), 192);
await writePng(master, path.join(authDir, "logo-mark-192.png"), 192);

await writePng(master, path.join(iconsDir, "icon-512.png"), 512);
await writePng(master, path.join(iconsDir, "icon-192.png"), 192);
await writePng(master, path.join(iconsDir, "apple-touch-icon.png"), 180);

const densities = [
  { dir: "mipmap-mdpi", launcher: 48, foreground: 108 },
  { dir: "mipmap-hdpi", launcher: 72, foreground: 162 },
  { dir: "mipmap-xhdpi", launcher: 96, foreground: 216 },
  { dir: "mipmap-xxhdpi", launcher: 144, foreground: 324 },
  { dir: "mipmap-xxxhdpi", launcher: 192, foreground: 432 },
];

for (const d of densities) {
  const dir = path.join(androidRes, d.dir);
  fs.mkdirSync(dir, { recursive: true });
  await writePng(master, path.join(dir, "ic_launcher.png"), d.launcher);
  await writeCircle(master, path.join(dir, "ic_launcher_round.png"), d.launcher);
  await writePng(adaptiveFg, path.join(dir, "ic_launcher_foreground.png"), d.foreground);
}

function kb(p) {
  return `${(fs.statSync(p).size / 1024).toFixed(1)} KB`;
}

console.log("PWA icon-192", kb(path.join(iconsDir, "icon-192.png")));
console.log("PWA icon-512", kb(path.join(iconsDir, "icon-512.png")));
console.log("Android mipmaps updated under", path.relative(root, androidRes));
console.log("done");
