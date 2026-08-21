/**
 * Auth art export for StoneSummoner.
 * Usage (from repo, with sharp available):
 *   node path/to/export-auth-art.mjs
 * Or: ROOT=C:\project\StoneSummoner node export-auth-art.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root =
  process.env.ROOT ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const assets = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-project-StoneSummoner/assets",
);
const finalDir = path.join(root, "docs/art/auth/final");
const publicDir = path.join(root, "apps/web/public/art/auth");
const selects = path.join(root, "docs/art/auth/selects");

fs.mkdirSync(finalDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

console.log("ROOT", root);

async function bottomVignette(buf, w, h) {
  const svg = Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e0b16" stop-opacity="0"/>
      <stop offset="55%" stop-color="#0e0b16" stop-opacity="0"/>
      <stop offset="72%" stop-color="#0e0b16" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#0e0b16" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);
  return sharp(buf)
    .composite([{ input: svg, blend: "over" }])
    .toBuffer();
}

async function exportHero(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const resized = await sharp(srcPath)
    .rotate()
    .resize(1080, 1920, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const vignetted = await bottomVignette(resized, 1080, 1920);

  const masterPng = path.join(finalDir, "auth-hero-master.png");
  const masterWebp = path.join(finalDir, "auth-hero-master.webp");
  await sharp(vignetted).png({ compressionLevel: 9 }).toFile(masterPng);
  await sharp(vignetted).webp({ quality: 78, effort: 6 }).toFile(masterWebp);

  const hi = await sharp(srcPath)
    .resize(1440, 2560, { fit: "cover" })
    .toBuffer();
  const hiV = await bottomVignette(hi, 1440, 2560);
  await sharp(hiV)
    .webp({ quality: 80 })
    .toFile(path.join(finalDir, "auth-hero-master@2x.webp"));

  // CSS-vignette twin (lighter) as auth-hero-safe = same master for now
  fs.copyFileSync(masterWebp, path.join(finalDir, "auth-hero-safe.webp"));
  fs.copyFileSync(masterPng, path.join(finalDir, "auth-hero-safe.png"));

  for (const f of [
    "auth-hero-master.png",
    "auth-hero-master.webp",
    "auth-hero-master@2x.webp",
    "auth-hero-safe.webp",
    "auth-hero-safe.png",
  ]) {
    fs.copyFileSync(path.join(finalDir, f), path.join(publicDir, f));
  }
  console.log(
    `hero webp ${(fs.statSync(masterWebp).size / 1024).toFixed(1)} KB (≤350) from ${meta.width}x${meta.height}`,
  );
}

async function exportMark(srcPath) {
  const out1024 = path.join(finalDir, "logo-mark-1024.png");
  await sharp(srcPath).resize(1024, 1024, { fit: "cover" }).png().toFile(out1024);
  await sharp(out1024).resize(512, 512).png().toFile(path.join(finalDir, "logo-mark-512.png"));
  await sharp(out1024).resize(192, 192).png().toFile(path.join(finalDir, "logo-mark-192.png"));
  for (const f of ["logo-mark-1024.png", "logo-mark-512.png", "logo-mark-192.png"]) {
    fs.copyFileSync(path.join(finalDir, f), path.join(publicDir, f));
  }
  console.log("logo-mark ok (PWA/Android icons: node scripts/export-app-icons.mjs)");
}

async function exportOg(srcPath) {
  const out = path.join(finalDir, "auth-og.webp");
  const png = path.join(finalDir, "auth-og.png");
  await sharp(srcPath).resize(1200, 630, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
  await sharp(srcPath).resize(1200, 630, { fit: "cover" }).png().toFile(png);
  fs.copyFileSync(out, path.join(publicDir, "auth-og.webp"));
  fs.copyFileSync(png, path.join(publicDir, "auth-og.png"));
  console.log(`og ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
}

const heroSrc = fs.existsSync(path.join(assets, "auth-hero-master-raw.png"))
  ? path.join(assets, "auth-hero-master-raw.png")
  : path.join(selects, "top1-epic-wide.png");
const markSrc = path.join(assets, "logo-mark-raw.png");
const ogSrc = path.join(assets, "auth-og-raw.png");

await exportHero(heroSrc);
if (fs.existsSync(markSrc)) await exportMark(markSrc);
if (fs.existsSync(ogSrc)) await exportOg(ogSrc);

// wordmark already authored as SVG in final/
const wm = path.join(finalDir, "logo-wordmark.svg");
if (fs.existsSync(wm)) {
  fs.copyFileSync(wm, path.join(publicDir, "logo-wordmark.svg"));
  // PNG preview @2x width ~1024
  // rasterize via SVG is limited in sharp without font — skip or simple
}
console.log("done");
