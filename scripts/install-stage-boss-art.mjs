/**
 * Install manifest-driven boss, arena, circle, and elemental essence art.
 *
 * Usage:
 *   node scripts/install-stage-boss-art.mjs <sourceDir> [manifest]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { imageToDematteWebp } from "./lib/dematte-webp.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.resolve(process.argv[2] ?? "");
const manifestPath = path.resolve(
  process.argv[3] ?? path.join(root, "scripts/awaken-art-manifest.json"),
);

if (!process.argv[2] || !fs.existsSync(sourceDir)) {
  console.error(
    "Usage: node scripts/install-stage-boss-art.mjs <sourceDir> [manifest]",
  );
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const bosses = Array.isArray(manifest.bosses) ? manifest.bosses : [];
const grades = Array.isArray(manifest.essenceGrades)
  ? manifest.essenceGrades
  : [];
const bossDir = path.join(root, "apps/web/public/art/battle/boss");
const bgDir = path.join(root, "apps/web/public/art/battle/bg");
const circleDir = path.join(root, "apps/web/public/art/battle/circle");
const essenceDir = path.join(root, "apps/web/public/art/ui/res/essence");
for (const dir of [bossDir, bgDir, circleDir, essenceDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function input(name) {
  const file = path.join(sourceDir, `${name}.png`);
  if (!fs.existsSync(file)) throw new Error(`Missing source: ${file}`);
  return file;
}

async function installTransparent(src, dst, size, lim = 52) {
  await imageToDematteWebp(src, dst, {
    size,
    lim,
    opaqueMatteLum: lim,
    flatRange: 10,
    fit: "contain",
    quality: 92,
    allowBrightMatte: false,
    defringe: true,
    fillHoles: true,
  });
}

for (const boss of bosses) {
  const id = String(boss.id);
  const element = String(boss.element);
  for (const facing of ["front", "back"]) {
    await installTransparent(
      input(`${id}-${facing}`),
      path.join(bossDir, `${id}-${facing}.webp`),
      1024,
      element === "dark" ? 96 : 52,
    );
  }
  await sharp(input(`${id}-bg`))
    .resize(1080, 1920, { fit: "cover", position: "bottom" })
    .webp({ quality: 84 })
    .toFile(path.join(bgDir, `${id}.webp`));
  await sharp(input(`${id}-bg`))
    .resize(720, 1280, { fit: "cover", position: "bottom" })
    .webp({ quality: 80 })
    .toFile(path.join(bgDir, `${id}-720.webp`));
  await installTransparent(
    input(`${id}-circle`),
    path.join(circleDir, `${id}.webp`),
    1024,
    element === "dark" ? 96 : 52,
  );
  for (const grade of grades) {
    await installTransparent(
      input(`essence-${element}-${grade}`),
      path.join(essenceDir, `${element}-${grade}.webp`),
      256,
      element === "dark" ? 96 : 52,
    );
  }
  console.log(`installed ${id}`);
}

const checks = [];
for (const boss of bosses) {
  const id = String(boss.id);
  const element = String(boss.element);
  checks.push(
    [path.join(bossDir, `${id}-front.webp`), 1024, 1024, true],
    [path.join(bossDir, `${id}-back.webp`), 1024, 1024, true],
    [path.join(bgDir, `${id}.webp`), 1080, 1920, false],
    [path.join(bgDir, `${id}-720.webp`), 720, 1280, false],
    [path.join(circleDir, `${id}.webp`), 1024, 1024, true],
    ...grades.map((grade) => [
      path.join(essenceDir, `${element}-${grade}.webp`),
      256,
      256,
      true,
    ]),
  );
}

for (const [file, width, height, alphaRequired] of checks) {
  const metadata = await sharp(file).metadata();
  if (metadata.width !== width || metadata.height !== height) {
    throw new Error(
      `Bad dimensions: ${file} ${metadata.width}x${metadata.height}`,
    );
  }
  if (alphaRequired && !metadata.hasAlpha) {
    throw new Error(`Missing alpha: ${file}`);
  }
  if (alphaRequired) {
    const stats = await sharp(file).ensureAlpha().stats();
    if ((stats.channels[3]?.min ?? 255) >= 250) {
      throw new Error(`Opaque matte remains: ${file}`);
    }
  }
}
console.log(`verified ${checks.length} installed files`);

