/**
 * Build a Spine 4.2 pilot pack for fire_fang from front/back full-body PNGs.
 *
 * Usage:
 *   node apps/web/scripts/build-fire-fang-spine.mjs
 *   node apps/web/scripts/build-fire-fang-spine.mjs --front path --back path
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(WEB_ROOT, "public", "art", "spine", "fire_fang");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function defaultAsset(name) {
  const cursorAssets = path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".cursor",
    "projects",
    "c-project-StoneSummoner",
    "assets",
    name,
  );
  const local = path.join(WEB_ROOT, "scripts", "_spine_src", name);
  if (fs.existsSync(cursorAssets)) return cursorAssets;
  if (fs.existsSync(local)) return local;
  return cursorAssets;
}

const FRONT_SRC = argValue("--front") || defaultAsset("fire_fang_front_raw.png");
const BACK_SRC = argValue("--back") || defaultAsset("fire_fang_back_raw.png");

const TARGET_H = 512;
const PAD = 4;

/** Punch checkerboard / near-black mattes to alpha (keep charcoal body + fire chroma). */
function dematteFringe(rgba, _w, _h) {
  const d = Buffer.from(rgba);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 8) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = (r + g + b) / 3;
    // Baked gray/white checkerboard (fake transparency)
    if (lum >= 225 && chroma <= 14) {
      d[i + 3] = 0;
      continue;
    }
    if (lum >= 200 && chroma <= 18) {
      const t = Math.max(0, Math.min(1, (lum - 200) / 40));
      d[i + 3] = Math.round(a * (1 - t * 0.9));
      continue;
    }
    // Pure black matte — keep dark rock (has color variance).
    if (r <= 6 && g <= 6 && b <= 6 && a > 200) {
      d[i + 3] = 0;
    } else if (r < 20 && g < 20 && b < 20 && Math.abs(r - g) < 3 && Math.abs(g - b) < 3) {
      d[i + 3] = Math.round(a * (lum / 20));
    }
  }
  return d;
}

function premultiply(rgba) {
  const d = Buffer.from(rgba);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] = Math.round(d[i] * a);
    d[i + 1] = Math.round(d[i + 1] * a);
    d[i + 2] = Math.round(d[i + 2] * a);
  }
  return d;
}

async function prepareSprite(srcPath) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source image: ${srcPath}`);
  }
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const punched = dematteFringe(data, info.width, info.height);
  let img = sharp(punched, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  const trimmed = await img
    .trim({ threshold: 8 })
    .resize({ height: TARGET_H, fit: "inside", withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: trimmed.data,
    width: trimmed.info.width,
    height: trimmed.info.height,
  };
}

function regionAttachment(name, w, h) {
  return {
    name,
    width: w,
    height: h,
    x: 0,
    y: h * 0.5,
  };
}

function buildSkeleton(frontW, frontH, backW, backH) {
  const maxH = Math.max(frontH, backH);
  const events = {
    "attack.hit": { int: 1, float: 0, string: "hit" },
  };

  const frontAtt = regionAttachment("body_front", frontW, frontH);
  const backAtt = regionAttachment("body_back", backW, backH);

  return {
    skeleton: {
      hash: "fire_fang_pilot",
      spine: "4.2.33",
      x: -Math.max(frontW, backW) * 0.5,
      y: 0,
      width: Math.max(frontW, backW),
      height: maxH,
      images: "./",
      audio: "",
    },
    bones: [
      { name: "root" },
      { name: "hip", parent: "root", y: maxH * 0.28 },
      { name: "torso", parent: "hip", length: maxH * 0.18, y: maxH * 0.08 },
      { name: "neck", parent: "torso", length: maxH * 0.06, y: maxH * 0.16 },
      { name: "head", parent: "neck", length: maxH * 0.08, y: maxH * 0.04 },
      { name: "body", parent: "hip", y: 0 },
      {
        name: "arm_l",
        parent: "torso",
        length: maxH * 0.16,
        rotation: 110,
        x: -maxH * 0.08,
        y: maxH * 0.1,
      },
      {
        name: "arm_r",
        parent: "torso",
        length: maxH * 0.16,
        rotation: 70,
        x: maxH * 0.08,
        y: maxH * 0.1,
      },
      {
        name: "leg_l",
        parent: "hip",
        length: maxH * 0.18,
        rotation: -95,
        x: -maxH * 0.05,
        y: -maxH * 0.02,
      },
      {
        name: "leg_r",
        parent: "hip",
        length: maxH * 0.18,
        rotation: -85,
        x: maxH * 0.05,
        y: -maxH * 0.02,
      },
      {
        name: "tail",
        parent: "hip",
        length: maxH * 0.2,
        rotation: 200,
        x: 0,
        y: maxH * 0.02,
      },
      { name: "ember", parent: "head", y: maxH * 0.06 },
    ],
    slots: [
      { name: "body", bone: "body", attachment: "body" },
      { name: "ember_glow", bone: "ember", blend: "additive" },
    ],
    skins: [
      {
        name: "default",
        attachments: {
          body: { body: frontAtt },
        },
      },
      {
        name: "front",
        attachments: {
          body: { body: { ...frontAtt } },
        },
      },
      {
        name: "back",
        attachments: {
          body: { body: { ...backAtt, name: "body_back" } },
        },
      },
    ],
    events,
    animations: {
      idle: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 1.25, x: 0, y: 4, curve: "sine" },
              { time: 2.5, x: 0, y: 0 },
            ],
          },
          torso: {
            rotate: [
              { value: 0 },
              { time: 1.25, value: 2, curve: "sine" },
              { time: 2.5, value: 0 },
            ],
          },
          head: {
            rotate: [
              { value: 0 },
              { time: 1.25, value: -2, curve: "sine" },
              { time: 2.5, value: 0 },
            ],
          },
          tail: {
            rotate: [
              { value: 0 },
              { time: 0.8, value: 6, curve: "sine" },
              { time: 1.6, value: -4, curve: "sine" },
              { time: 2.5, value: 0 },
            ],
          },
          ember: {
            scale: [
              { x: 1, y: 1 },
              { time: 0.9, x: 1.08, y: 1.08, curve: "sine" },
              { time: 1.8, x: 1, y: 1 },
            ],
          },
        },
      },
      walk: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 0.25, x: 0, y: 6 },
              { time: 0.5, x: 0, y: 0 },
              { time: 0.75, x: 0, y: 6 },
              { time: 1.0, x: 0, y: 0 },
            ],
            rotate: [
              { value: -3 },
              { time: 0.5, value: 3 },
              { time: 1.0, value: -3 },
            ],
          },
          torso: {
            rotate: [
              { value: 2 },
              { time: 0.5, value: -2 },
              { time: 1.0, value: 2 },
            ],
          },
        },
      },
      run: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 0.18, x: 0, y: 10 },
              { time: 0.36, x: 0, y: 0 },
              { time: 0.54, x: 0, y: 10 },
              { time: 0.72, x: 0, y: 0 },
            ],
            rotate: [
              { value: -6 },
              { time: 0.36, value: 6 },
              { time: 0.72, value: -6 },
            ],
          },
          torso: {
            rotate: [
              { value: 6 },
              { time: 0.36, value: -4 },
              { time: 0.72, value: 6 },
            ],
          },
        },
      },
      attack: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 0.15, x: -8, y: 2 },
              { time: 0.35, x: 18, y: 4 },
              { time: 0.65, x: 0, y: 0 },
            ],
            rotate: [
              { value: 0 },
              { time: 0.15, value: -8 },
              { time: 0.35, value: 12 },
              { time: 0.65, value: 0 },
            ],
          },
          torso: {
            rotate: [
              { value: 0 },
              { time: 0.15, value: -10 },
              { time: 0.35, value: 16 },
              { time: 0.65, value: 0 },
            ],
          },
          arm_r: {
            rotate: [
              { value: 0 },
              { time: 0.15, value: -40 },
              { time: 0.35, value: 50 },
              { time: 0.65, value: 0 },
            ],
          },
          head: {
            rotate: [
              { value: 0 },
              { time: 0.35, value: 8 },
              { time: 0.65, value: 0 },
            ],
          },
        },
        events: [{ time: 0.35, name: "attack.hit" }],
      },
      cast: {
        bones: {
          torso: {
            rotate: [
              { value: 0 },
              { time: 0.25, value: -6 },
              { time: 0.7, value: 4 },
              { time: 0.95, value: 0 },
            ],
          },
          arm_l: {
            rotate: [
              { value: 0 },
              { time: 0.4, value: -35 },
              { time: 0.95, value: 0 },
            ],
          },
          arm_r: {
            rotate: [
              { value: 0 },
              { time: 0.4, value: 35 },
              { time: 0.95, value: 0 },
            ],
          },
          ember: {
            scale: [
              { x: 1, y: 1 },
              { time: 0.5, x: 1.25, y: 1.25 },
              { time: 0.95, x: 1, y: 1 },
            ],
          },
        },
      },
      ult: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 0.2, x: 0, y: 12 },
              { time: 0.55, x: 0, y: -4 },
              { time: 1.1, x: 0, y: 0 },
            ],
            scale: [
              { x: 1, y: 1 },
              { time: 0.55, x: 1.12, y: 1.12 },
              { time: 1.1, x: 1, y: 1 },
            ],
          },
          torso: {
            rotate: [
              { value: 0 },
              { time: 0.35, value: -12 },
              { time: 0.7, value: 18 },
              { time: 1.1, value: 0 },
            ],
          },
          ember: {
            scale: [
              { x: 1, y: 1 },
              { time: 0.55, x: 1.4, y: 1.4 },
              { time: 1.1, x: 1, y: 1 },
            ],
          },
        },
        events: [{ time: 0.55, name: "attack.hit" }],
      },
      hit: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 0.08, x: -10, y: 2 },
              { time: 0.3, x: 0, y: 0 },
            ],
            rotate: [
              { value: 0 },
              { time: 0.08, value: -8 },
              { time: 0.3, value: 0 },
            ],
          },
        },
      },
      death: {
        bones: {
          hip: {
            translate: [
              { x: 0, y: 0 },
              { time: 0.35, x: -6, y: -20 },
              { time: 0.9, x: -10, y: -maxH * 0.15 },
            ],
            rotate: [
              { value: 0 },
              { time: 0.35, value: -25 },
              { time: 0.9, value: -70 },
            ],
            scale: [
              { x: 1, y: 1 },
              { time: 0.9, x: 1, y: 0.85 },
            ],
          },
          torso: {
            rotate: [
              { value: 0 },
              { time: 0.5, value: -20 },
              { time: 0.9, value: -35 },
            ],
          },
        },
      },
    },
  };
}

function atlasText(pageW, pageH, regions) {
  const lines = [
    "fire_fang-pma.png",
    `\tsize: ${pageW}, ${pageH}`,
    "\tfilter: Linear, Linear",
    "\tpma: true",
  ];
  for (const r of regions) {
    lines.push(r.name);
    lines.push(`\tbounds: ${r.x}, ${r.y}, ${r.w}, ${r.h}`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  console.log("[fire_fang] front:", FRONT_SRC);
  console.log("[fire_fang] back:", BACK_SRC);

  const front = await prepareSprite(FRONT_SRC);
  const back = await prepareSprite(BACK_SRC);

  const pageW = front.width + back.width + PAD * 3;
  const pageH = Math.max(front.height, back.height) + PAD * 2;

  const page = Buffer.alloc(pageW * pageH * 4, 0);
  const blit = (sprite, ox, oy) => {
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const si = (y * sprite.width + x) * 4;
        const di = ((oy + y) * pageW + (ox + x)) * 4;
        page[di] = sprite.data[si];
        page[di + 1] = sprite.data[si + 1];
        page[di + 2] = sprite.data[si + 2];
        page[di + 3] = sprite.data[si + 3];
      }
    }
  };

  const frontX = PAD;
  const frontY = PAD + (pageH - PAD * 2 - front.height);
  const backX = PAD * 2 + front.width;
  const backY = PAD + (pageH - PAD * 2 - back.height);
  blit(front, frontX, frontY);
  blit(back, backX, backY);

  const pma = premultiply(page);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await sharp(pma, {
    raw: { width: pageW, height: pageH, channels: 4 },
  })
    .png()
    .toFile(path.join(OUT_DIR, "fire_fang-pma.png"));

  // Keep non-PMA references for art review (optional)
  await sharp(page, {
    raw: { width: pageW, height: pageH, channels: 4 },
  })
    .png()
    .toFile(path.join(OUT_DIR, "fire_fang-sheet.png"));

  const atlas = atlasText(pageW, pageH, [
    { name: "body_front", x: frontX, y: frontY, w: front.width, h: front.height },
    { name: "body_back", x: backX, y: backY, w: back.width, h: back.height },
  ]);
  fs.writeFileSync(path.join(OUT_DIR, "fire_fang-pma.atlas"), atlas, "utf8");

  const skel = buildSkeleton(front.width, front.height, back.width, back.height);
  fs.writeFileSync(
    path.join(OUT_DIR, "fire_fang.json"),
    `${JSON.stringify(skel, null, "\t")}\n`,
    "utf8",
  );

  // Transparent stills for book UI (same art as battle skins; no checker matte)
  const srcDir = path.join(OUT_DIR, "src");
  fs.mkdirSync(srcDir, { recursive: true });
  for (const [srcPath, outName] of [
    [FRONT_SRC, "front.png"],
    [BACK_SRC, "back.png"],
  ]) {
    const { data, info } = await sharp(srcPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const punched = dematteFringe(data, info.width, info.height);
    await sharp(punched, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png({ compressionLevel: 9 })
      .toFile(path.join(srcDir, outName));
  }

  console.log("[fire_fang] wrote", OUT_DIR);
  console.log(
    JSON.stringify(
      {
        page: [pageW, pageH],
        front: [front.width, front.height],
        back: [back.width, back.height],
        clips: Object.keys(skel.animations),
        skins: skel.skins.map((s) => s.name),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
