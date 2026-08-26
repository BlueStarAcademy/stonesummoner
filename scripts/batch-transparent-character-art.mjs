/**
 * Batch transparent matting for all monster + summoner character art.
 *
 * CS6 Photoshop JSX color-range is unreliable — uses Node chroma pipeline
 * (same path as monster-art:photoshop on CS6).
 *
 * Usage:
 *   node scripts/batch-transparent-character-art.mjs
 *   node scripts/batch-transparent-character-art.mjs --skip-fix
 *   node scripts/batch-transparent-character-art.mjs --summoner-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import {
  imageToInstalledBattleWebp,
  processChromaBattleRgba,
  finishDematteRgba,
  featherAlphaEdges,
  zeroClearRgb,
  TRANSPARENT_BATTLE_INSTALL,
} from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const skipFix = args.includes("--skip-fix");
const summonerOnly = args.includes("--summoner-only");
const monsterOnly = args.includes("--monster-only");

const SUMMONER_ELEMENTS = ["fire", "water", "wind", "light", "dark"];
const monsterBattleAssets = path.join(root, "assets", "monster", "battle");
const summonerBattleDir = path.join(root, "apps/web/public/art/summoner/battle");

function log(msg) {
  const line = `[batch-transparent] ${msg}`;
  console.log(line);
}

async function fixPngInPlace(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  await processChromaBattleRgba(rgba, info.width, info.height, TRANSPARENT_BATTLE_INSTALL);
  await finishDematteRgba(rgba, info.width, info.height, TRANSPARENT_BATTLE_INSTALL);
  featherAlphaEdges(rgba, info.width, info.height, 2);
  zeroClearRgb(rgba);
  const tmp = `${src}.${process.pid}.tmp.png`;
  await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);
  await fs.promises.rename(tmp, src);
}

async function installBattlePng(srcPng, dstWebp) {
  await imageToInstalledBattleWebp(srcPng, dstWebp, TRANSPARENT_BATTLE_INSTALL);
}

async function fixBattleDirPngs(dir, pattern = /-(front|back)\.png$/i) {
  if (!fs.existsSync(dir)) {
    log(`skip missing dir ${dir}`);
    return 0;
  }
  const names = fs.readdirSync(dir).filter((f) => pattern.test(f));
  let n = 0;
  for (const name of names) {
    const src = path.join(dir, name);
    await fixPngInPlace(src);
    n += 1;
    if (n % 25 === 0) log(`fixed ${n}/${names.length} in ${path.basename(dir)}`);
  }
  log(`fixed ${n} PNG(s) in ${path.relative(root, dir)}`);
  return n;
}

async function installSummonerBattle() {
  let n = 0;
  for (const el of SUMMONER_ELEMENTS) {
    for (const facing of ["front", "back"]) {
      const png = path.join(summonerBattleDir, `${el}-${facing}.png`);
      const webp = path.join(summonerBattleDir, `${el}-${facing}.webp`);
      if (!fs.existsSync(png)) {
        log(`missing summoner ${el}-${facing}.png`);
        continue;
      }
      if (!skipFix) await fixPngInPlace(png);
      await installBattlePng(png, webp);
      n += 1;
      log(`summoner ${el}-${facing}.webp`);
    }
  }
  return n;
}

function runNodeScript(rel, extraArgs = []) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...extraArgs], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, CURSOR_ASSETS: path.join(root, "assets") },
  });
  if ((r.status ?? 1) !== 0) {
    log(`FAILED ${rel} exit=${r.status}`);
    return false;
  }
  return true;
}

async function main() {
  log("start");
  const started = Date.now();

  if (!summonerOnly) {
    if (!skipFix) {
      log("monster PNG chroma fix...");
      await fixBattleDirPngs(monsterBattleAssets);
    }
    log("monster sync (install WebP + portraits)...");
    if (!runNodeScript("scripts/sync-painted-monster-art.mjs", ["--all"])) {
      process.exit(1);
    }
  }

  if (!monsterOnly) {
    log("summoner battle transparent install...");
    const sn = await installSummonerBattle();
    log(`summoner battle webps=${sn}`);
    log("summoner + monster portraits...");
    if (!runNodeScript("scripts/process-all-portraits.mjs")) {
      process.exit(1);
    }
  }

  log("monster-art:check...");
  runNodeScript("scripts/check-monster-art.mjs", ["--strict"]);

  const min = ((Date.now() - started) / 60000).toFixed(1);
  log(`done in ${min} min`);
}

await main();
