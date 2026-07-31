/**
 * Punch outer black/dark mattes on monster portrait & battle stills → alpha.
 * Edge flood-fill keeps dark body pixels that are not connected to the border.
 *
 * Usage: node scripts/dematte-monster-art.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../apps/web/public/art/monster");
const LIM = 28;

function isMatte(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  // Near-black / charcoal plate (low chroma)
  if (lum <= LIM && chroma <= 18) return true;
  // Slightly tinted dark navy/brown mattes
  if (r <= LIM && g <= LIM && b <= LIM + 8 && chroma <= 22) return true;
  return false;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(png|webp)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

async function dematteFile(src) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const rgba = new Uint8ClampedArray(data);
  const visited = new Uint8Array(w * h);
  const q = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isMatte(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
    visited[i] = 1;
    q.push(i);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  let punched = 0;
  while (q.length) {
    const i = q.pop();
    rgba[i * 4 + 3] = 0;
    punched += 1;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  // Soft fringe next to punched matte
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (visited[i]) continue;
      const o = i * 4;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const a = rgba[o + 3];
      if (a < 8) continue;
      if (!(r < 48 && g < 48 && b < 48)) continue;
      let near = false;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        if (visited[(y + dy) * w + (x + dx)]) {
          near = true;
          break;
        }
      }
      if (!near) continue;
      const lum = (r + g + b) / 3;
      rgba[o + 3] = Math.round(a * Math.min(1, lum / 40));
    }
  }

  const pct = punched / (w * h);
  // Skip rewrite if almost nothing touched (already transparent).
  if (pct < 0.01) return { punched: 0, skipped: true };

  const img = sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  });
  // Windows often locks the source — write temp, then replace via copy+unlink.
  const tmp = `${src}.dematte-tmp`;
  try {
    if (src.toLowerCase().endsWith(".png")) {
      await img.png({ compressionLevel: 9, effort: 8 }).toFile(tmp);
    } else {
      await img.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(tmp);
    }
    fs.copyFileSync(tmp, src);
    fs.unlinkSync(tmp);
  } catch (e) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw e;
  }
  return { punched, skipped: false, pct };
}

// Root webps + battle stills (skill icons optional via --all).
const all = process.argv.includes("--all");
const files = walk(root).filter((f) => {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  if (all) return true;
  if (rel.startsWith("battle/")) return true;
  if (!rel.includes("/")) return true; // root-level portraits
  return false;
});
let changed = 0;
let skipped = 0;
for (const f of files) {
  try {
    const r = await dematteFile(f);
    if (r.skipped) {
      skipped += 1;
      continue;
    }
    changed += 1;
    console.log(
      `${path.relative(root, f)}: punched ${r.punched} (${Math.round(r.pct * 100)}%)`,
    );
  } catch (e) {
    console.warn("fail", path.relative(root, f), e.message);
  }
}
console.log(`done: changed ${changed}, skipped ${skipped}, total ${files.length}`);
