/**
 * Generate Play Store listing graphics from logo + SVG.
 *   node scripts/gen-play-store-graphics.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps/web/public/store");
const logoPath = path.join(
  root,
  "apps/web/public/art/auth/logo-title-lockup.webp",
);

fs.mkdirSync(outDir, { recursive: true });

const featureSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#120c1c"/>
      <stop offset="45%" stop-color="#1a1230"/>
      <stop offset="100%" stop-color="#0a0810"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="48%" r="42%">
      <stop offset="0%" stop-color="#c9a22755"/>
      <stop offset="100%" stop-color="#c9a22700"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <circle cx="760" cy="240" r="220" fill="url(#glow)"/>
  <circle cx="180" cy="90" r="3" fill="#e8d9a8" opacity="0.55"/>
  <circle cx="260" cy="160" r="2" fill="#e8d9a8" opacity="0.4"/>
  <circle cx="120" cy="280" r="2.5" fill="#b8a0d8" opacity="0.45"/>
  <circle cx="340" cy="70" r="2" fill="#b8a0d8" opacity="0.35"/>
  <text x="64" y="210" fill="#e8d9a8" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700">StoneSummoner</text>
  <text x="64" y="268" fill="#c4bcd4" font-family="Segoe UI, sans-serif" font-size="26">Raise symbols. Fight on the magic circle.</text>
  <text x="64" y="312" fill="#8a7f9c" font-family="Segoe UI, sans-serif" font-size="18">상징으로 키우고, 마법진에서 싸운다</text>
</svg>`;

const featurePng = path.join(outDir, "feature-graphic-1024x500.png");
const featureTmp = path.join(outDir, "feature-graphic.tmp.png");
await sharp(Buffer.from(featureSvg)).png({ compressionLevel: 9 }).toFile(featureTmp);

if (fs.existsSync(logoPath)) {
  const logo = await sharp(logoPath)
    .resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(featureTmp)
    .composite([{ input: logo, left: 560, top: 40 }])
    .png({ compressionLevel: 9 })
    .toFile(featurePng);
  fs.unlinkSync(featureTmp);
} else {
  fs.renameSync(featureTmp, featurePng);
}

const iconsDir = path.join(root, "apps/web/public/icons");
const iconSvg = path.join(iconsDir, "icon-512.svg");
if (fs.existsSync(iconSvg)) {
  await sharp(iconSvg)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, "icon-512.png"));
  await sharp(iconSvg)
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, "icon-192.png"));
}

console.log("Wrote", path.relative(root, featurePng));
console.log("Wrote icons PNG under apps/web/public/icons/");

const shotsDir = path.join(outDir, "screenshots");
fs.mkdirSync(shotsDir, { recursive: true });

async function phoneShot(name, title, subtitle, artPath) {
  const w = 1080;
  const h = 1920;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#120c1c"/>
      <stop offset="100%" stop-color="#0a0810"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <text x="64" y="160" fill="#e8d9a8" font-family="Georgia, serif" font-size="64" font-weight="700">${title}</text>
  <text x="64" y="230" fill="#c4bcd4" font-family="Segoe UI, sans-serif" font-size="32">${subtitle}</text>
</svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const out = path.join(shotsDir, name);
  if (artPath && fs.existsSync(artPath)) {
    const art = await sharp(artPath)
      .resize(w, Math.floor(h * 0.72), { fit: "cover" })
      .png()
      .toBuffer();
    await sharp(base)
      .composite([{ input: art, top: Math.floor(h * 0.26), left: 0 }])
      .png({ compressionLevel: 9 })
      .toFile(out);
  } else {
    await sharp(base).png({ compressionLevel: 9 }).toFile(out);
  }
  console.log("Wrote", path.relative(root, out));
}

const authHero = path.join(
  root,
  "apps/web/public/art/auth/auth-hero-master.webp",
);
const battleStill = path.join(
  root,
  "apps/web/public/art/monster/battle/wolf_fighter-front.webp",
);
await phoneShot(
  "01-home-island.png",
  "StoneSummoner",
  "Island · summon · grow",
  authHero,
);
await phoneShot(
  "02-battle-circle.png",
  "Magic Circle",
  "ATB battle · stone summon",
  fs.existsSync(battleStill) ? battleStill : featurePng,
);
console.log(
  "Screenshots: replace with emulator captures when ready (Play prefers real gameplay).",
);
