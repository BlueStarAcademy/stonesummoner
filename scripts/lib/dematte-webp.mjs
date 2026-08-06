/**
 * Shared flood-fill dematte + WebP encode helpers.
 *
 * Battle stills: charcoal mats are flat near-black; dark costume often shares
 * #000 with the matte but has local luminance texture — require flatness so
 * flood cannot tunnel through the body.
 */
import fs from "node:fs";
import sharp from "sharp";

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 * @param {number} lim
 * @param {number} chromaMax
 */
export function isMatteColor(r, g, b, a, lim = 36, chromaMax = 8) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  if (chroma > chromaMax) return false;
  if (lum <= lim) return true;
  if (lum >= 248 && chroma <= 8) return true;
  return false;
}

/** @deprecated use isMatteColor — kept for callers expecting (r,g,b,a,lim) */
export function isMatte(r, g, b, a, lim = 36) {
  return isMatteColor(r, g, b, a, lim, 8);
}

/**
 * @param {Uint8ClampedArray} rgba
 * @param {number} w
 * @param {number} h
 * @param {number} lim
 * @param {object} [opts]
 * @param {number} [opts.chromaMax=8]
 * @param {number} [opts.flatRange=6] max lum spread in 3×3 (flat matte plate)
 */
export async function dematteBuffer(rgba, w, h, lim = 36, opts = {}) {
  const chromaMax = opts.chromaMax ?? 8;
  const flatRange = opts.flatRange ?? 6;
  const visited = new Uint8Array(w * h);
  const q = [];

  const lumAt = (x, y) => {
    const o = (y * w + x) * 4;
    return (rgba[o] + rgba[o + 1] + rgba[o + 2]) / 3;
  };

  const isFlat = (x, y) => {
    let lo = 255;
    let hi = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const L = lumAt(xx, yy);
        if (L < lo) lo = L;
        if (L > hi) hi = L;
      }
    }
    return hi - lo <= flatRange;
  };

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const a = rgba[o + 3];
    if (!isMatteColor(r, g, b, a, lim, chromaMax)) return;
    // Already-transparent: always continue. Opaque matte must look flat.
    if (a >= 8 && !isFlat(x, y)) return;
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
  while (q.length) {
    const i = q.pop();
    rgba[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return rgba;
}

export function punchRoundedRect(rgba, w, h, inset = 0.12, radius = 0.08) {
  const ix0 = Math.floor(w * inset);
  const iy0 = Math.floor(h * inset);
  const ix1 = Math.ceil(w * (1 - inset));
  const iy1 = Math.ceil(h * (1 - inset));
  const rr = Math.floor(Math.min(w, h) * radius);
  const insideRound = (x, y) => {
    if (x < ix0 || x >= ix1 || y < iy0 || y >= iy1) return false;
    const lx = x - ix0;
    const ly = y - iy0;
    const rw = ix1 - ix0;
    const rh = iy1 - iy0;
    const cx = lx < rr ? rr - lx : lx > rw - rr ? lx - (rw - rr) : 0;
    const cy = ly < rr ? rr - ly : ly > rh - rr ? ly - (rh - rr) : 0;
    if (cx === 0 || cy === 0) return true;
    return cx * cx + cy * cy <= rr * rr;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (insideRound(x, y)) rgba[(y * w + x) * 4 + 3] = 0;
    }
  }
}

export async function pngToDematteWebp(srcPng, dstWebp, opts = {}) {
  const size = opts.size ?? 256;
  const lim = opts.lim ?? 36;
  const fit = opts.fit ?? "cover";
  const punchCenter = opts.punchCenter ?? false;
  const chromaMax = opts.chromaMax;
  const flatRange = opts.flatRange;
  const { data, info } = await sharp(srcPng)
    .resize(size, size, {
      fit,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const rgba = new Uint8ClampedArray(data);
  await dematteBuffer(rgba, w, h, lim, { chromaMax, flatRange });
  if (punchCenter) punchRoundedRect(rgba, w, h, opts.inset ?? 0.14, opts.radius ?? 0.07);
  const buf = await sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  })
    .webp({ quality: opts.quality ?? 88, alphaQuality: 100 })
    .toBuffer();
  const tmp = `${dstWebp}.${process.pid}.tmp`;
  await fs.promises.writeFile(tmp, buf);
  try {
    await fs.promises.unlink(dstWebp).catch(() => {});
    await fs.promises.rename(tmp, dstWebp);
  } catch {
    await fs.promises.copyFile(tmp, dstWebp);
    await fs.promises.unlink(tmp).catch(() => {});
  }
  await fs.promises.unlink(tmp).catch(() => {});
}

/** Preset for full-body battle stills (flat charcoal mats, protect textured cloth). */
export const BATTLE_STILL_DEMATTE = {
  size: 768,
  lim: 44,
  chromaMax: 8,
  flatRange: 6,
  fit: "contain",
  quality: 90,
};
