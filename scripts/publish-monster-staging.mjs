/**
 * Copy dematted monster battle stills from staging → ship (no re-dematte).
 * Use when apps/web/public/art/_staging/monster-install/dematte/ is already ready.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MONSTER_ART_KEYS } from "./lib/monster-art-roster.mjs";
import { PORTRAIT_DEMATTE } from "./lib/dematte-webp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dematteDir = path.join(
  root,
  "apps/web/public/art/_staging/monster-install/dematte",
);
const battleOut = path.join(root, "apps/web/public/art/monster/battle");
const portraitOut = path.join(root, "apps/web/public/art/monster");

const BUST_ZOOM = 0.62;
const BUST_TOP_RATIO = 0.08;

if (!fs.existsSync(dematteDir)) {
  console.error(`missing staging dematte: ${dematteDir}`);
  process.exit(1);
}

fs.mkdirSync(battleOut, { recursive: true });
fs.mkdirSync(portraitOut, { recursive: true });

let battleCopied = 0;
for (const name of fs.readdirSync(dematteDir)) {
  if (!name.endsWith(".webp")) continue;
  if (!name.includes("-front") && !name.includes("-back")) continue;
  await fs.promises.copyFile(
    path.join(dematteDir, name),
    path.join(battleOut, name),
  );
  battleCopied += 1;
}

async function cropPortrait(frontWebp, destWebp) {
  const meta = await sharp(frontWebp).metadata();
  const w = meta.width ?? PORTRAIT_DEMATTE.size;
  const h = meta.height ?? PORTRAIT_DEMATTE.size;
  const crop = Math.round(Math.min(w, h) * BUST_ZOOM);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * BUST_TOP_RATIO), h - crop));
  await sharp(frontWebp)
    .extract({ left, top, width: crop, height: crop })
    .resize(PORTRAIT_DEMATTE.size, PORTRAIT_DEMATTE.size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: 92, effort: 4 })
    .toFile(destWebp);
}

let portraits = 0;
for (const artKey of MONSTER_ART_KEYS) {
  for (const tag of ["", "_awaken"]) {
    const awaken = tag === "_awaken";
    const frontName = `${artKey}${awaken ? "-awaken" : ""}-front.webp`;
    const frontSrc = path.join(dematteDir, frontName);
    const dest = path.join(portraitOut, `${artKey}${tag}.webp`);
    if (!fs.existsSync(frontSrc)) continue;
    await cropPortrait(frontSrc, dest);
    portraits += 1;
  }
}

console.log(
  `published staging → ship: battle=${battleCopied} portraits=${portraits}`,
);
