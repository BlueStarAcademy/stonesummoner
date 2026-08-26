/**
 * FALLBACK: synthesize per-element variants from one family master still.
 * Prefer painted per-element WebP install: npm run monster-art:install
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  FAMILY_IDS,
  ELEMENTS,
  PILOT_FAMILIES,
} from "./lib/monster-art-roster.mjs";
import {
  BATTLE_STILL_DEMATTE,
  PORTRAIT_DEMATTE,
  dematteBuffer,
  rawRgbaToDematteWebp,
  rawRgbaToWebp,
} from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const familiesArg = argVal("--families");
const skipAwaken = args.includes("--skip-awaken");
const families = familiesArg
  ? familiesArg.split(",").map((s) => s.trim()).filter(Boolean)
  : FAMILY_IDS;

const battleDir = path.join(root, "apps/web/public/art/monster/battle");
const portraitDir = path.join(root, "apps/web/public/art/monster");

/** Legacy family aliases share one bust crop. */
const MONSTER_ALIAS = {
  fire_fang: "wolf_fighter_fire",
  ash_archer: "magic_archer_fire",
  gale_scout: "scout_sniper_wind",
  shield_tortoise: "steel_armor_water",
  mist_shaman: "lotus_dancer_wind",
  seal_scholar: "seal_elder_light",
  thunder_lancer: "thunder_spear_light",
};

const ELEMENT_GRADE = {
  fire: { overlay: [255, 96, 40, 0.42] },
  water: { overlay: [56, 176, 255, 0.4] },
  wind: { overlay: [104, 228, 136, 0.38] },
  light: { overlay: [255, 244, 176, 0.36] },
  dark: { overlay: [116, 64, 176, 0.4] },
};

/** Matte plate pixels — never element-tint (keeps dematte / transparency clean). */
function isMattePixel(r, g, b, a, lim = 32) {
  if (a < 8) return true;
  const lum = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return lum <= lim && chroma <= 12;
}

/**
 * Vivid magic accents only — glow, flame, gems. Not gold/bronze armor or white cloth.
 */
function isAccentPixel(r, g, b, a) {
  if (a < 12) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  if (lum < 48 || lum > 248) return false;
  if (chroma < 44) return false;

  // Warm gold / bronze plate (keep metal paint)
  if (r > 145 && g > 95 && b < 130 && chroma < 78 && lum < 215) return false;
  // Near-white fabric
  if (lum > 215 && chroma < 38) return false;
  // Brown fur / leather neutrals
  if (chroma < 52 && lum < 140) return false;

  const vivid = chroma >= 58;
  const glow = lum >= 185 && chroma >= 48;
  return vivid || glow;
}

function resolvePaintedFront(familyId, element, awaken = false) {
  const artKey = `${familyId}_${element}`;
  const mid = awaken ? "-awaken" : "";
  const candidates = [
    path.join(battleDir, `${artKey}${mid}-front.png`),
    path.join(battleDir, `${artKey}${mid}-front.webp`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolvePaintedBack(familyId, element, awaken = false) {
  const artKey = `${familyId}_${element}`;
  const mid = awaken ? "-awaken" : "";
  const candidates = [
    path.join(battleDir, `${artKey}${mid}-back.png`),
    path.join(battleDir, `${artKey}${mid}-back.webp`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  const front = resolvePaintedFront(familyId, element, awaken);
  return front;
}

function resolveFamilyFront(familyId) {
  const familyCandidates = [
    path.join(battleDir, `${familyId}-front.webp`),
    path.join(battleDir, `${familyId}-front.png`),
  ];
  for (const p of familyCandidates) {
    if (fs.existsSync(p)) return p;
  }
  for (const el of ELEMENTS) {
    const keyed = path.join(battleDir, `${familyId}_${el}-front.webp`);
    if (fs.existsSync(keyed)) return keyed;
  }
  const candidates = [path.join(portraitDir, `${familyId}.webp`)];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolveFamilyBack(familyId) {
  for (const el of ELEMENTS) {
    const keyed = path.join(battleDir, `${familyId}_${el}-back.webp`);
    if (fs.existsSync(keyed)) return keyed;
  }
  const candidates = [
    path.join(battleDir, `${familyId}-back.webp`),
    path.join(battleDir, `${familyId}-back.png`),
    path.join(battleDir, `${familyId}-front.webp`),
    path.join(battleDir, `${familyId}-front.png`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return resolveFamilyFront(familyId);
}

async function loadSourceBuf(filePath) {
  const buf = await fs.promises.readFile(filePath);
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  await dematteBuffer(rgba, info.width, info.height, 44, {
    chromaMax: 8,
    flatRange: 6,
    allowBrightMatte: false,
  });
  return sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function gradeBuffer(inputBuf, element, awaken = false) {
  // Fire anchor keeps master paint; other elements shift magic accents only.
  if (!awaken && element === "fire") {
    return inputBuf;
  }

  const g = ELEMENT_GRADE[element];
  const { data, info } = await sharp(inputBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  const [or, og, ob, oa] = g.overlay;
  const blend = awaken ? Math.min(0.55, oa * 1.15) : oa;

  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    const pr = rgba[i];
    const pg = rgba[i + 1];
    const pb = rgba[i + 2];
    if (isMattePixel(pr, pg, pb, a)) continue;
    if (!isAccentPixel(pr, pg, pb, a)) continue;
    let r = pr;
    let gch = pg;
    let b = pb;
    if (awaken) {
      r = Math.min(255, r * 1.05 + 6);
      gch = Math.min(255, gch * 1.04 + 5);
      b = Math.min(255, b * 1.04 + 6);
    }
    rgba[i] = Math.min(255, Math.round(r * (1 - blend) + or * blend));
    rgba[i + 1] = Math.min(255, Math.round(gch * (1 - blend) + og * blend));
    rgba[i + 2] = Math.min(255, Math.round(b * (1 - blend) + ob * blend));
  }

  return sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function writeBattleStill(gradedPngBuf, destWebp) {
  const meta = await sharp(gradedPngBuf).metadata();
  const w = meta.width ?? BATTLE_STILL_DEMATTE.size;
  const h = meta.height ?? BATTLE_STILL_DEMATTE.size;
  const target = BATTLE_STILL_DEMATTE.size;
  let pipeline = sharp(gradedPngBuf).ensureAlpha();
  if (w !== target || h !== target) {
    pipeline = pipeline.resize(target, target, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    });
  }
  const sized = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });
  await rawRgbaToDematteWebp(
    new Uint8ClampedArray(sized.data),
    sized.info.width,
    sized.info.height,
    destWebp,
    BATTLE_STILL_DEMATTE,
  );
}

async function bustPortraitFromFront(frontBuf, destWebp) {
  const meta = await sharp(frontBuf).metadata();
  const w = meta.width ?? PORTRAIT_DEMATTE.size;
  const h = meta.height ?? PORTRAIT_DEMATTE.size;
  const BUST_ZOOM = 0.52;
  const BUST_TOP_RATIO = 0.06;
  const crop = Math.round(Math.min(w, h) * BUST_ZOOM);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * BUST_TOP_RATIO), h - crop));
  const { data, info } = await sharp(frontBuf)
    .extract({ left, top, width: crop, height: crop })
    .resize(PORTRAIT_DEMATTE.size, PORTRAIT_DEMATTE.size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  await rawRgbaToWebp(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    destWebp,
    PORTRAIT_DEMATTE,
  );
}

async function bakeFromPainted(familyId, element, awaken = false) {
  const artKey = `${familyId}_${element}`;
  const frontPath = resolvePaintedFront(familyId, element, awaken);
  if (!frontPath) return false;
  const backPath = resolvePaintedBack(familyId, element, awaken);
  const frontBuf = await loadSourceBuf(frontPath);
  const backBuf = backPath ? await loadSourceBuf(backPath) : frontBuf;
  const mid = awaken ? "-awaken" : "";

  await writeBattleStill(frontBuf, path.join(battleDir, `${artKey}${mid}-front.webp`));
  await writeBattleStill(backBuf, path.join(battleDir, `${artKey}${mid}-back.webp`));
  await bustPortraitFromFront(frontBuf, path.join(portraitDir, `${artKey}${awaken ? "_awaken" : ""}.webp`));
  return true;
}

async function bakeFamilyElement(familyId, element, frontBuf, backBuf) {
  const artKey = `${familyId}_${element}`;
  const frontGr = await gradeBuffer(frontBuf, element, false);
  const backGr = await gradeBuffer(backBuf, element, false);

  await writeBattleStill(frontGr, path.join(battleDir, `${artKey}-front.webp`));
  await writeBattleStill(backGr, path.join(battleDir, `${artKey}-back.webp`));

  if (!skipAwaken) {
    const frontAw = await gradeBuffer(frontBuf, element, true);
    const backAw = await gradeBuffer(backBuf, element, true);
    await writeBattleStill(
      frontAw,
      path.join(battleDir, `${artKey}-awaken-front.webp`),
    );
    await writeBattleStill(
      backAw,
      path.join(battleDir, `${artKey}-awaken-back.webp`),
    );
  }

  await bustPortraitFromFront(frontGr, path.join(portraitDir, `${artKey}.webp`));
  if (!skipAwaken) {
    const frontAw = await gradeBuffer(frontBuf, element, true);
    await bustPortraitFromFront(
      frontAw,
      path.join(portraitDir, `${artKey}_awaken.webp`),
    );
  }
}

let baked = 0;
for (const familyId of families) {
  const frontPath = resolveFamilyFront(familyId);
  if (!frontPath) {
    console.warn("skip (no master)", familyId);
    continue;
  }
  const backPath = resolveFamilyBack(familyId);
  const frontBuf = await loadSourceBuf(frontPath);
  const backBuf = backPath ? await loadSourceBuf(backPath) : frontBuf;

  for (const element of ELEMENTS) {
    const paintedBase = resolvePaintedFront(familyId, element, false);
    if (paintedBase && paintedBase.endsWith(".png")) {
      await bakeFromPainted(familyId, element, false);
      if (!skipAwaken) await bakeFromPainted(familyId, element, true);
      baked += 1;
      console.log("painted", `${familyId}_${element}`);
      continue;
    }

    await bakeFamilyElement(familyId, element, frontBuf, backBuf);
    baked += 1;
    console.log("baked", `${familyId}_${element}`);
  }
}

console.log(
  `bake done families=${families.length} variants=${baked} pilots=${PILOT_FAMILIES.join(",")}`,
);

for (const [alias, target] of Object.entries(MONSTER_ALIAS)) {
  const src = path.join(portraitDir, `${target}.webp`);
  const dest = path.join(portraitDir, `${alias}.webp`);
  if (!fs.existsSync(src)) {
    console.warn("alias missing target", alias, "<-", target);
    continue;
  }
  await fs.promises.copyFile(src, dest);
  console.log("alias", alias, "<-", target);
}
