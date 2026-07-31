/**
 * Shared flood-fill dematte + WebP encode helpers.
 */
import sharp from "sharp";

export function isMatte(r, g, b, a, lim = 36) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  if (lum <= lim && chroma <= 22) return true;
  if (r <= lim + 4 && g <= lim + 4 && b <= lim + 10 && chroma <= 28) return true;
  if (lum >= 245 && chroma <= 12) return true;
  return false;
}

export async function dematteBuffer(rgba, w, h, lim = 36) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isMatte(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3], lim)) return;
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

/** Punch rounded-rect hole (normalized 0..1 insets). */
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
    // corner tests
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
  const punchCenter = opts.punchCenter ?? false;
  const { data, info } = await sharp(srcPng)
    .resize(size, size, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const rgba = new Uint8ClampedArray(data);
  await dematteBuffer(rgba, w, h, lim);
  if (punchCenter) punchRoundedRect(rgba, w, h, opts.inset ?? 0.14, opts.radius ?? 0.07);
  await sharp(Buffer.from(rgba), { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: opts.quality ?? 88, alphaQuality: 95 })
    .toFile(dstWebp);
}
