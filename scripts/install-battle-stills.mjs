/**
 * Install painted per-element monster art from Cursor assets → public WebP.
 *
 * **Preferred delivery: WebP** (smaller than PNG). PNG is still accepted and
 * converted to WebP on install — nothing raw is copied into public/.
 *
 * Battle stills (1024² after dematte):
 *   {artKey}-front.webp | .png
 *   {artKey}-back.webp | .png
 *   {artKey}-awaken-front.webp | .png
 *   {artKey}-awaken-back.webp | .png
 *
 * Optional portraits (768² bust — skip auto crop when present):
 *   portraits/{artKey}.webp | .png
 *   portraits/{artKey}_awaken.webp | .png
 *
 * Search roots (first match wins):
 *   $CURSOR_ASSETS/monster/battle/
 *   $CURSOR_ASSETS/monster/portraits/
 *   $CURSOR_ASSETS/
 *
 * Usage:
 *   node scripts/install-battle-stills.mjs
 *   node scripts/install-battle-stills.mjs --families wolf_fighter,holy_judge
 *   node scripts/install-battle-stills.mjs --pad   # safe-margin pad (768² legacy)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import {
  MONSTER_ART_KEYS,
  artKeysForFamilies,
  FAMILY_IDS,
  familyIdFromArtKey,
} from "./lib/monster-art-roster.mjs";
import {
  PAINTED_BATTLE_DEMATTE,
  PORTRAIT_DEMATTE,
  TRANSPARENT_PORTRAIT_INSTALL,
  processChromaBattleRgba,
  featherAlphaEdges,
  detectPreAlpha,
  imageToInstalledBattleWebp,
  imageToDematteWebp,
  imageToTransparentWebp,
  rawRgbaToDematteWebp,
  rawRgbaToTransparentWebp,
} from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const assetsRoot =
  process.env.CURSOR_ASSETS ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-project-StoneSummoner/assets",
  );
const transparentBattleAssetsDir = path.join(
  assetsRoot,
  "monster",
  "battle-transparent",
);
const battleAssetsDir = path.join(assetsRoot, "monster", "battle");
const portraitAssetsDir = path.join(assetsRoot, "monster", "portraits");
const battleOutDir = path.join(root, "apps/web/public/art/monster/battle");
const portraitOutDir = path.join(root, "apps/web/public/art/monster");
const usePad = args.includes("--pad");

const familiesArg = argVal("--families");
const roster = familiesArg
  ? artKeysForFamilies(
      familiesArg.split(",").map((s) => s.trim()).filter(Boolean),
    )
  : MONSTER_ART_KEYS;

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

const BUST_ZOOM = 0.44;
const BUST_TOP_RATIO = 0.03;

function resolveImageSrc(name, kind = "battle") {
  const dirs =
    kind === "portrait"
      ? [portraitAssetsDir, assetsRoot]
      : [
          transparentBattleAssetsDir,
          path.join(
            transparentBattleAssetsDir,
            familyIdFromArtKey(name.replace(/-(?:awaken-)?(?:front|back)$/, "")),
          ),
          battleAssetsDir,
          assetsRoot,
        ];
  for (const dir of dirs) {
    const webp = path.join(dir, `${name}.webp`);
    if (fs.existsSync(webp)) return webp;
    const png = path.join(dir, `${name}.png`);
    if (fs.existsSync(png)) return png;
  }
  return null;
}

async function bustPortraitFromBattleFront(frontWebp, destWebp) {
  const meta = await sharp(frontWebp).metadata();
  const w = meta.width ?? PORTRAIT_DEMATTE.size;
  const h = meta.height ?? PORTRAIT_DEMATTE.size;
  const crop = Math.round(Math.min(w, h) * BUST_ZOOM);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * BUST_TOP_RATIO), h - crop));
  const { data, info } = await sharp(frontWebp)
    .extract({ left, top, width: crop, height: crop })
    .resize(PORTRAIT_DEMATTE.size, PORTRAIT_DEMATTE.size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  await processChromaBattleRgba(rgba, info.width, info.height, TRANSPARENT_PORTRAIT_INSTALL);
  featherAlphaEdges(rgba, info.width, info.height, 2);
  await rawRgbaToTransparentWebp(
    rgba,
    info.width,
    info.height,
    destWebp,
    TRANSPARENT_PORTRAIT_INSTALL,
  );
}

async function installPortraitSource(src, dest) {
  if (await detectPreAlpha(src)) {
    await imageToTransparentWebp(src, dest, TRANSPARENT_PORTRAIT_INSTALL);
    return "painted";
  }
  await imageToDematteWebp(src, dest, PORTRAIT_DEMATTE);
  return "painted";
}

async function installPortrait(artKey, awaken = false) {
  const suffix = awaken ? "_awaken" : "";
  const src = resolveImageSrc(`${artKey}${suffix}`, "portrait");
  const dest = path.join(portraitOutDir, `${artKey}${suffix}.webp`);
  if (src) {
    return await installPortraitSource(src, dest);
  }
  const battleFront = path.join(
    dematteDir,
    `${artKey}${awaken ? "-awaken" : ""}-front.webp`,
  );
  if (!fs.existsSync(battleFront)) return "missing";
  await bustPortraitFromBattleFront(battleFront, dest);
  return "cropped";
}

fs.mkdirSync(battleOutDir, { recursive: true });
fs.mkdirSync(portraitOutDir, { recursive: true });

let fronts = 0;
let dedicatedBacks = 0;
let fallbackBacks = 0;
let awakenFronts = 0;
let awakenBacks = 0;
let portraitsPainted = 0;
let portraitsCropped = 0;
let portraitsMissing = 0;

const stagingDir = path.join(
  root,
  "apps/web/public/art/_staging/monster-install",
);
const dematteDir = path.join(stagingDir, "dematte");
fs.mkdirSync(dematteDir, { recursive: true });

for (const artKey of roster) {
  const variants = [
    { tag: "", countFront: () => fronts++, countBack: () => dedicatedBacks++ },
    {
      tag: "-awaken",
      countFront: () => awakenFronts++,
      countBack: () => awakenBacks++,
    },
  ];

  for (const { tag, countFront, countBack } of variants) {
    const frontName = `${artKey}${tag}-front`;
    const backName = `${artKey}${tag}-back`;
    const frontSrc = resolveImageSrc(frontName, "battle");
    const backSrc = resolveImageSrc(backName, "battle");
    const frontOut = path.join(dematteDir, `${frontName}.webp`);
    const backOut = path.join(dematteDir, `${backName}.webp`);

    if (frontSrc) {
      await imageToInstalledBattleWebp(frontSrc, frontOut);
      countFront();
    }

    if (backSrc) {
      await imageToInstalledBattleWebp(backSrc, backOut);
      countBack();
    } else if (fs.existsSync(frontOut)) {
      await fs.promises.copyFile(frontOut, backOut);
      if (!tag) fallbackBacks += 1;
    }
  }

  const pr = await installPortrait(artKey, false);
  if (pr === "painted") portraitsPainted += 1;
  else if (pr === "cropped") portraitsCropped += 1;
  else portraitsMissing += 1;

  const pra = await installPortrait(artKey, true);
  if (pra === "painted") portraitsPainted += 1;
  else if (pra === "cropped") portraitsCropped += 1;
  else portraitsMissing += 1;
}

let copyFrom = dematteDir;
if (usePad) {
  const paddedDir = path.join(stagingDir, "padded");
  const dematteRel = path.relative(root, dematteDir).replace(/\\/g, "/");
  const paddedRel = path.relative(root, paddedDir).replace(/\\/g, "/");
  const r = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts/pad-battle-stills.mjs"),
      "--dir",
      dematteRel,
      "--staging",
      paddedRel,
      "--force",
    ],
    { cwd: root, stdio: "inherit" },
  );
  if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1);
  copyFrom = paddedDir;
}

for (const f of fs
  .readdirSync(copyFrom)
  .filter((x) => x.endsWith(".webp") && !x.startsWith("_"))) {
  await fs.promises.copyFile(path.join(copyFrom, f), path.join(battleOutDir, f));
}

for (const [alias, target] of Object.entries(MONSTER_ALIAS)) {
  const src = path.join(portraitOutDir, `${target}.webp`);
  const dest = path.join(portraitOutDir, `${alias}.webp`);
  if (!fs.existsSync(src)) continue;
  await fs.promises.copyFile(src, dest);
}

console.log(
  `installed roster=${roster.length}/${MONSTER_ART_KEYS.length} families=${FAMILY_IDS.length}`,
);
console.log(
  `battle fronts=${fronts} backs=${dedicatedBacks} fallbackBacks=${fallbackBacks} awakenFronts=${awakenFronts} awakenBacks=${awakenBacks}`,
);
console.log(
  `portraits painted=${portraitsPainted} cropped=${portraitsCropped} missing=${portraitsMissing}`,
);
console.log(`assets=${assetsRoot} -> battle=${battleOutDir} portraits=${portraitOutDir}`);
if (fronts === 0) {
  console.warn(
    "no battle stills found — place WebP (preferred) or PNG under assets/monster/battle/",
  );
}
