/**
 * Generate painted-style skill icon PNGs from HQ battle stills → staging.
 * Then run: npm run skill-art:install (all kinds)
 *
 *   node scripts/generate-skill-art-from-battle.mjs
 *   node scripts/generate-skill-art-from-battle.mjs --families wolf_fighter,cinder_imp
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  ELEMENTS,
  FAMILY_IDS,
  MONSTER_ART_KEYS,
  familyIdFromArtKey,
} from "./lib/monster-art-roster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const familiesArg = argVal("--families");
const rosterFamilies = familiesArg
  ? familiesArg.split(",").map((s) => s.trim()).filter(Boolean)
  : FAMILY_IDS;

const battleDir = path.join(root, "apps/web/public/art/monster/battle");
const monsterStaging = path.join(
  root,
  "apps/web/public/art/_staging/monster/skill",
);
const uiStaging = path.join(root, "apps/web/public/art/_staging/ui/skill");
const summonerStaging = path.join(
  root,
  "apps/web/public/art/_staging/summoner/skill",
);
const summonerProc = path.join(
  root,
  "apps/web/public/art/summoner/skill/_procedural",
);
const uiProc = path.join(root, "apps/web/public/art/ui/skill/_procedural");

const SIZE = 512;
const OUT = 256;

const EL = {
  fire: { bg0: "#180806", bg1: "#4a1c12", glow: "#FF5828", frame: "#FF7030" },
  water: { bg0: "#061018", bg1: "#0c3048", glow: "#28C8FF", frame: "#40D0FF" },
  wind: { bg0: "#081408", bg1: "#143020", glow: "#48E888", frame: "#60F098" },
  light: { bg0: "#141008", bg1: "#342810", glow: "#FFE838", frame: "#FFE850" },
  dark: { bg0: "#0c0814", bg1: "#281438", glow: "#9878F8", frame: "#C098FF" },
};

const SLOT = {
  1: { zoom: 0.4, top: 0.06, char: 0.74, glow: 0.28 },
  2: { zoom: 0.48, top: 0.03, char: 0.8, glow: 0.42 },
  3: { zoom: 0.54, top: 0.0, char: 0.86, glow: 0.56 },
};

function frameSvg(el, slot, pal) {
  const g = SLOT[slot];
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="46%" r="62%">
      <stop offset="0%" stop-color="${pal.bg1}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${pal.bg0}"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="48%" r="44%">
      <stop offset="0%" stop-color="${pal.glow}" stop-opacity="${g.glow}"/>
      <stop offset="100%" stop-color="${pal.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
    </filter>
  <circle cx="128" cy="118" r="78" fill="url(#glow)"/>
  <rect x="7" y="7" width="242" height="242" rx="15" fill="none" stroke="${pal.frame}" stroke-width="5" opacity="0.9"/>
  <rect x="12" y="12" width="232" height="232" rx="12" fill="none" stroke="${pal.frame}" stroke-width="2" opacity="0.45"/>
</svg>`,
  );
}

async function composeMonsterIcon(battlePath, element, slot) {
  const pal = EL[element] ?? EL.light;
  const cfg = SLOT[slot];
  const meta = await sharp(battlePath).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;
  const crop = Math.round(Math.min(w, h) * cfg.zoom);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * cfg.top), h - crop));
  const charSize = Math.round(SIZE * cfg.char);
  const offset = Math.round((SIZE - charSize) / 2);

  const subject = await sharp(battlePath)
    .extract({ left, top, width: crop, height: crop })
    .resize(charSize, charSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  return sharp(frameSvg(element, slot, pal))
    .resize(SIZE, SIZE)
    .composite([{ input: subject, left: offset, top: offset - 6 }])
    .png()
    .toBuffer();
}

async function svgToPng(svgPath) {
  const buf = fs.readFileSync(svgPath);
  return sharp(buf, { density: 300 })
    .resize(SIZE, SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

for (const dir of [monsterStaging, uiStaging, summonerStaging]) {
  fs.mkdirSync(dir, { recursive: true });
}

const artKeys = MONSTER_ART_KEYS.filter((k) =>
  rosterFamilies.includes(familyIdFromArtKey(k)),
);

let monsterIcons = 0;
let monsterMissing = 0;

for (const artKey of artKeys) {
  const familyId = familyIdFromArtKey(artKey);
  const element = artKey.slice(familyId.length + 1);
  const battlePath = path.join(battleDir, `${artKey}-front.webp`);
  if (!fs.existsSync(battlePath)) {
    monsterMissing += 1;
    continue;
  }
  for (let slot = 1; slot <= 3; slot++) {
    const png = await composeMonsterIcon(battlePath, element, slot);
    const name = `${familyId}-${element}-s${slot}.png`;
    fs.writeFileSync(path.join(monsterStaging, name), png);
    monsterIcons += 1;
  }
}

for (const familyId of rosterFamilies) {
  const refKey = `${familyId}_fire`;
  const battlePath = path.join(battleDir, `${refKey}-front.webp`);
  if (!fs.existsSync(battlePath)) continue;
  for (let slot = 1; slot <= 3; slot++) {
    const png = await composeMonsterIcon(battlePath, "light", slot);
    fs.writeFileSync(
      path.join(monsterStaging, `${familyId}-s${slot}.png`),
      png,
    );
    monsterIcons += 1;
  }
}

let uiIcons = 0;
if (fs.existsSync(uiProc)) {
  for (const name of fs.readdirSync(uiProc)) {
    if (!name.endsWith(".svg")) continue;
    const stem = name.replace(/\.svg$/i, "");
    const png = await svgToPng(path.join(uiProc, name));
    fs.writeFileSync(path.join(uiStaging, `${stem}.png`), png);
    uiIcons += 1;
  }
}

let summonerIcons = 0;
if (fs.existsSync(summonerProc)) {
  for (const name of fs.readdirSync(summonerProc)) {
    if (!name.endsWith(".svg")) continue;
    const stem = name.replace(/\.svg$/i, "");
    const png = await svgToPng(path.join(summonerProc, name));
    fs.writeFileSync(path.join(summonerStaging, `${stem}.png`), png);
    summonerIcons += 1;
  }
}

console.log(
  `generated staging PNG: monster=${monsterIcons} missingBattle=${monsterMissing} ui=${uiIcons} summoner=${summonerIcons}`,
);
console.log(`monster staging: ${monsterStaging}`);
console.log("next: npm run skill-art:install:all");
