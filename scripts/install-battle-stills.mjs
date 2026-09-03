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
 *   portrait-cards/{artKey}.webp | .png (opaque, painted background)
 *   portrait-cards/{artKey}_awaken.webp | .png
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
 *   node scripts/install-battle-stills.mjs --portraits-only
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
  WHITE_PLATE_PORTRAIT_DEMATTE,
  TRANSPARENT_PORTRAIT_INSTALL,
  featherAlphaEdges,
  detectPreAlpha,
  detectWhitePlate,
  imageToInstalledBattleWebp,
  imageToDematteWebp,
  imageToTransparentWebp,
  rawRgbaToDematteWebp,
  rawRgbaToTransparentWebp,
  writeWebpAtomic,
} from "./lib/dematte-webp.mjs";
import { writePortraitDerivatives } from "./lib/portrait-derivatives.mjs";
import { computeBustRegion, DEFAULT_BUST_CROP } from "./lib/bust-crop.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const assetsRoot =
  process.env.CURSOR_ASSETS ||
  path.join(root, "assets");
const transparentBattleAssetsDir = path.join(
  assetsRoot,
  "monster",
  "battle-transparent",
);
const battleAssetsDir = path.join(assetsRoot, "monster", "battle");
const portraitCardAssetsDir = path.join(
  assetsRoot,
  "monster",
  "portrait-cards",
);
const portraitAssetsDir = path.join(assetsRoot, "monster", "portraits");
const battleOutDir = path.join(root, "apps/web/public/art/monster/battle");
const portraitOutDir = path.join(root, "apps/web/public/art/monster");
const usePad = args.includes("--pad");
const portraitsOnly = args.includes("--portraits-only");

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

/** Match process-all-portraits inventory bust (head + upper torso). */
const BUST_OPTS = {
  ...DEFAULT_BUST_CROP,
  bustHeightRatio: 0.68,
  padRatio: 0.1,
  minZoom: 0.4,
  maxZoom: 0.68,
};

function resolveImageSrc(name, kind = "battle") {
  const dirs =
    kind === "portrait-card"
      ? [portraitCardAssetsDir]
      : kind === "portrait"
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
  const region = await computeBustRegion(frontWebp, BUST_OPTS);
  const { data, info } = await sharp(frontWebp)
    .extract({
      left: region.left,
      top: region.top,
      width: region.width,
      height: region.height,
    })
    .resize(PORTRAIT_DEMATTE.size, PORTRAIT_DEMATTE.size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  /* Cropped battle fronts are already dematted — do not re-chroma / punch. */
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
  if (await detectWhitePlate(src)) {
    await imageToDematteWebp(src, dest, WHITE_PLATE_PORTRAIT_DEMATTE);
    return "white-plate";
  }
  await imageToDematteWebp(src, dest, PORTRAIT_DEMATTE);
  return "painted";
}

async function installPortraitCardSource(src, dest) {
  const buffer = await sharp(src)
    .resize(PORTRAIT_DEMATTE.size, PORTRAIT_DEMATTE.size, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    })
    .removeAlpha()
    .webp({ quality: 96, smartSubsample: true, effort: 6 })
    .toBuffer();
  await writeWebpAtomic(dest, buffer);
}

async function installPortrait(artKey, awaken = false) {
  const suffix = awaken ? "_awaken" : "";
  const cardSrc = resolveImageSrc(`${artKey}${suffix}`, "portrait-card");
  const src = cardSrc ?? resolveImageSrc(`${artKey}${suffix}`, "portrait");
  const dest = path.join(portraitOutDir, `${artKey}${suffix}.webp`);
  let result;
  if (cardSrc) {
    await installPortraitCardSource(cardSrc, dest);
    result = "card";
  } else if (src) {
    result = await installPortraitSource(src, dest);
  } else {
    const battleFront = path.join(
      dematteDir,
      `${artKey}${awaken ? "-awaken" : ""}-front.webp`,
    );
    if (!fs.existsSync(battleFront)) return "missing";
    await bustPortraitFromBattleFront(battleFront, dest);
    result = "cropped";
  }
  await writePortraitDerivatives(dest, portraitOutDir, `${artKey}${suffix}`);
  return result;
}

fs.mkdirSync(battleOutDir, { recursive: true });
fs.mkdirSync(portraitOutDir, { recursive: true });

let fronts = 0;
let dedicatedBacks = 0;
let fallbackBacks = 0;
let awakenFronts = 0;
let awakenBacks = 0;
let portraitCards = 0;
let portraitsPainted = 0;
let portraitsCropped = 0;
let portraitsMissing = 0;
let portraitDerivatives = 0;

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

  for (const { tag, countFront, countBack } of portraitsOnly ? [] : variants) {
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
  if (pr === "card") portraitCards += 1;
  else if (pr === "painted") portraitsPainted += 1;
  else if (pr === "cropped") portraitsCropped += 1;
  else portraitsMissing += 1;
  if (pr !== "missing") portraitDerivatives += 2;

  const pra = await installPortrait(artKey, true);
  if (pra === "card") portraitCards += 1;
  else if (pra === "painted") portraitsPainted += 1;
  else if (pra === "cropped") portraitsCropped += 1;
  else portraitsMissing += 1;
  if (pra !== "missing") portraitDerivatives += 2;
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

/** Windows can throw UNKNOWN on copyFile when dest is open elsewhere. */
async function safeCopyFile(src, dest) {
  try {
    await fs.promises.copyFile(src, dest);
  } catch (err) {
    if (err?.code !== "UNKNOWN" && err?.code !== "EBUSY") throw err;
    const data = await fs.promises.readFile(src);
    await fs.promises.writeFile(dest, data);
  }
}

for (const f of fs
  .readdirSync(copyFrom)
  .filter((x) => x.endsWith(".webp") && !x.startsWith("_"))) {
  await safeCopyFile(path.join(copyFrom, f), path.join(battleOutDir, f));
}

for (const [alias, target] of Object.entries(MONSTER_ALIAS)) {
  const src = path.join(portraitOutDir, `${target}.webp`);
  const dest = path.join(portraitOutDir, `${alias}.webp`);
  if (!fs.existsSync(src)) continue;
  await safeCopyFile(src, dest);
  await writePortraitDerivatives(dest, portraitOutDir, alias);
  portraitDerivatives += 2;
}

console.log(
  `installed roster=${roster.length}/${MONSTER_ART_KEYS.length} families=${FAMILY_IDS.length}`,
);
console.log(
  `battle fronts=${fronts} backs=${dedicatedBacks} fallbackBacks=${fallbackBacks} awakenFronts=${awakenFronts} awakenBacks=${awakenBacks}`,
);
console.log(
  `portraits cards=${portraitCards} painted=${portraitsPainted} cropped=${portraitsCropped} missing=${portraitsMissing} derivatives=${portraitDerivatives}`,
);
console.log(`assets=${assetsRoot} -> battle=${battleOutDir} portraits=${portraitOutDir}`);
if (!portraitsOnly && fronts === 0) {
  console.warn(
    "no battle stills found — place WebP (preferred) or PNG under assets/monster/battle/",
  );
}
