/**
 * Rebuild inventory / codex portrait icons with transparent mats.
 *
 * Crops a bust from battle still fronts, then flood-fills only flat outer
 * charcoal (flatRange protects dark armor / hair on the character).
 *
 * Usage:
 *   node scripts/process-all-portraits.mjs
 *   node scripts/process-all-portraits.mjs --qa
 *   node scripts/process-all-portraits.mjs --only wolf_fighter_fire,wolf_fighter_water
 *   node scripts/process-all-portraits.mjs --summoner-only
 *   node scripts/process-all-portraits.mjs --awaken-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  PORTRAIT_DEMATTE,
  TRANSPARENT_PORTRAIT_INSTALL,
  detectChromaPlate,
  detectCheckerboardPlate,
  detectInteriorChromaPlate,
  dematteBuffer,
  processChromaBattleRgba,
  rawRgbaToTransparentWebp,
  rawRgbaToDematteWebp,
} from "./lib/dematte-webp.mjs";
import {
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

const qa = args.includes("--qa");
const summonerOnly = args.includes("--summoner-only");
const monsterOnly = args.includes("--monster-only");
const awakenOnly = args.includes("--awaken-only");
const only = argVal("--only")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ZOOM = 0.44;
const BUST_TOP_RATIO = 0.03;
const SIZE = PORTRAIT_DEMATTE.size;

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

const SUMMONER_ELEMENTS = ["fire", "water", "wind", "light", "dark"];

async function bustCropRaw(srcPath) {
  const meta = await sharp(srcPath).metadata();
  const w = meta.width ?? SIZE;
  const h = meta.height ?? SIZE;
  const crop = Math.round(Math.min(w, h) * ZOOM);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * BUST_TOP_RATIO), h - crop));
  return sharp(srcPath)
    .extract({ left, top, width: crop, height: crop })
    .resize(SIZE - 96, SIZE - 96, { fit: "fill" })
    .extend({
      top: 48,
      bottom: 48,
      left: 48,
      right: 48,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function edgeClearRatio(webpPath) {
  const { data, info } = await sharp(webpPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let edge = 0;
  let clear = 0;
  const sample = (x, y) => {
    edge += 1;
    if (data[(y * w + x) * 4 + 3] < 8) clear += 1;
  };
  for (let x = 0; x < w; x++) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    sample(0, y);
    sample(w - 1, y);
  }
  return edge > 0 ? clear / edge : 0;
}

function resolveStillSrc(battleDir, key, awaken = false) {
  const mid = awaken ? "-awaken" : "";
  const png = path.join(battleDir, `${key}${mid}-front.png`);
  if (fs.existsSync(png)) return png;
  const webp = path.join(battleDir, `${key}${mid}-front.webp`);
  if (fs.existsSync(webp)) return webp;
  if (awaken) return resolveStillSrc(battleDir, key, false);
  const family = familyIdFromArtKey(key);
  if (family !== key) {
    const famPng = path.join(battleDir, `${family}-front.png`);
    if (fs.existsSync(famPng)) return famPng;
    const famWebp = path.join(battleDir, `${family}-front.webp`);
    if (fs.existsSync(famWebp)) return famWebp;
  }
  return null;
}

async function writePortrait(srcPath, destWebp) {
  const { data, info } = await bustCropRaw(srcPath);
  const rgba = new Uint8ClampedArray(data);
  const hasChromaPlate =
    (await detectChromaPlate(srcPath)) ||
    (await detectInteriorChromaPlate(srcPath));
  if (hasChromaPlate) {
    await processChromaBattleRgba(
      rgba,
      info.width,
      info.height,
      TRANSPARENT_PORTRAIT_INSTALL,
    );
    await rawRgbaToTransparentWebp(
      rgba,
      info.width,
      info.height,
      destWebp,
      TRANSPARENT_PORTRAIT_INSTALL,
    );
    return;
  }
  if (await detectCheckerboardPlate(srcPath)) {
    await dematteBuffer(rgba, info.width, info.height, 36, {
      plateCheckerboard: true,
      checkerLumMin: 115,
    });
    await rawRgbaToTransparentWebp(
      rgba,
      info.width,
      info.height,
      destWebp,
      TRANSPARENT_PORTRAIT_INSTALL,
    );
    return;
  }
  await rawRgbaToDematteWebp(
    rgba,
    info.width,
    info.height,
    destWebp,
    {
      ...PORTRAIT_DEMATTE,
      // Battle stills can carry a near-black (not exact #000) plate.
      // Keep the flatness gate, but allow the portrait dematte to remove it.
      lim: 44,
      plateOnly: false,
      chromaMax: 8,
      flatRange: 4,
    },
  );
}

async function processMonsterArtKey(key, battleDir, outDir, awaken = false) {
  const onlyKey = awaken ? `${key}_awaken` : key;
  if (only && !only.includes(onlyKey) && !only.includes(key)) return "skip";
  const src = resolveStillSrc(battleDir, key, awaken);
  if (!src) {
    console.warn("missing still", onlyKey);
    return "missing";
  }
  const dest = path.join(outDir, `${onlyKey}.webp`);
  if (qa) {
    if (!fs.existsSync(dest)) return "missing-out";
    const ratio = await edgeClearRatio(dest);
    console.log("qa", onlyKey, `${Math.round(ratio * 100)}% edge clear`);
    return ratio >= 0.25 ? "ok" : "bad-matte";
  }
  await writePortrait(src, dest);
  const ratio = await edgeClearRatio(dest);
  console.log("portrait", onlyKey, `${Math.round(ratio * 100)}% edge clear`);
  return ratio >= 0.25 ? "ok" : "warn-matte";
}

async function processSummonerElement(el, battleDir, outDir) {
  if (only && !only.includes(el)) return "skip";
  const src = resolveStillSrc(battleDir, el, false);
  if (!src) {
    console.warn("missing summoner still", el);
    return "missing";
  }
  const dest = path.join(outDir, `${el}.webp`);
  if (qa) {
    if (!fs.existsSync(dest)) return "missing-out";
    const ratio = await edgeClearRatio(dest);
    console.log("qa summoner", el, `${Math.round(ratio * 100)}% edge clear`);
    return ratio >= 0.25 ? "ok" : "bad-matte";
  }
  await writePortrait(src, dest);
  const ratio = await edgeClearRatio(dest);
  console.log("summoner", el, `${Math.round(ratio * 100)}% edge clear`);
  return ratio >= 0.25 ? "ok" : "warn-matte";
}

const stats = { ok: 0, warn: 0, missing: 0, skip: 0 };

if (!summonerOnly) {
  const battleDir = path.join(root, "apps/web/public/art/monster/battle");
  const outDir = path.join(root, "apps/web/public/art/monster");

  // Process catalog art keys only. Generic family files are legacy fallbacks
  // and can produce tight, opaque portraits that are never selected in-game.
  const keys = [...MONSTER_ART_KEYS];

  for (const key of keys) {
    if (!awakenOnly) {
      const r = await processMonsterArtKey(key, battleDir, outDir, false);
      if (r === "ok") stats.ok += 1;
      else if (r === "warn-matte" || r === "bad-matte") stats.warn += 1;
      else if (r === "missing" || r === "missing-out") stats.missing += 1;
      else stats.skip += 1;
    }
    const ra = await processMonsterArtKey(key, battleDir, outDir, true);
    if (ra === "ok") stats.ok += 1;
    else if (ra === "warn-matte" || ra === "bad-matte") stats.warn += 1;
    else if (ra === "missing" || ra === "missing-out") stats.missing += 1;
    else stats.skip += 1;
  }

  if (!qa && !awakenOnly) {
    for (const [alias, target] of Object.entries(MONSTER_ALIAS)) {
      if (only && !only.includes(alias)) continue;
      const src = path.join(outDir, `${target}.webp`);
      const dest = path.join(outDir, `${alias}.webp`);
      if (!fs.existsSync(src)) {
        console.warn("alias missing target", alias, "<-", target);
        stats.missing += 1;
        continue;
      }
      await fs.promises.copyFile(src, dest);
      console.log("alias", alias, "<-", target);
      stats.ok += 1;
    }
  }
}

if (!monsterOnly) {
  const battleDir = path.join(root, "apps/web/public/art/summoner/battle");
  const outDir = path.join(root, "apps/web/public/art/summoner");
  for (const el of SUMMONER_ELEMENTS) {
    const r = await processSummonerElement(el, battleDir, outDir);
    if (r === "ok") stats.ok += 1;
    else if (r === "warn-matte" || r === "bad-matte") stats.warn += 1;
    else if (r === "missing" || r === "missing-out") stats.missing += 1;
    else stats.skip += 1;
  }
}

console.log(
  qa ? "qa done" : "processed",
  stats.ok,
  "ok",
  stats.warn,
  "warn",
  stats.missing,
  "missing",
  stats.skip,
  "skip",
);
if (stats.warn > 0 && qa) process.exit(1);
