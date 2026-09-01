/**
 * Alpha-aware bust crop for inventory / codex portraits.
 *
 * Anchors on the opaque silhouette of a battle still (not the canvas),
 * then frames head + upper torso so small slots read character shape.
 */
import sharp from "sharp";

/** @typedef {{ left: number, top: number, width: number, height: number }} BustRegion */

export const DEFAULT_BUST_CROP = Object.freeze({
  /** Fraction of silhouette height kept from the top (head → mid torso). */
  bustHeightRatio: 0.68,
  /** Extra margin around the bust band before clamping. */
  padRatio: 0.1,
  /** Crop side as fraction of min(canvas w,h). */
  minZoom: 0.4,
  maxZoom: 0.68,
  /** Headroom above silhouette top, as fraction of crop side. */
  headroomRatio: 0.06,
  alphaThreshold: 16,
});

/**
 * @param {Uint8Array|Buffer} data
 * @param {number} w
 * @param {number} h
 * @param {number} thr
 */
export function alphaBoundingBox(data, w, h, thr = 16) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > thr) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    bw: maxX - minX + 1,
    bh: maxY - minY + 1,
  };
}

/**
 * @param {{ bw: number, bh: number, minX: number, maxX: number, minY: number }} bb
 * @param {number} w
 * @param {number} h
 * @param {typeof DEFAULT_BUST_CROP} [opts]
 * @returns {BustRegion}
 */
export function bustRegionFromBBox(bb, w, h, opts = DEFAULT_BUST_CROP) {
  const base = { ...DEFAULT_BUST_CROP, ...opts };
  // Squat / blob silhouettes (slime, turtle, shell beasts): keep most of the body
  // so inventory slots show shape, not a face crop. Use aspect < 1 (wider than
  // tall) — broad humanoids with weapons can be ~1.1–1.2 and must stay bust-framed.
  const aspect = bb.bh / Math.max(1, bb.bw);
  const fillsHeight = bb.bh / Math.min(w, h);
  let bustHeightRatio = base.bustHeightRatio;
  let maxZoom = base.maxZoom;
  let minZoom = base.minZoom;
  let padRatio = base.padRatio;
  if (aspect < 0.95) {
    bustHeightRatio = Math.max(bustHeightRatio, 0.92);
    maxZoom = Math.max(maxZoom, 0.78);
    minZoom = Math.max(minZoom, 0.5);
    padRatio = Math.max(padRatio, 0.12);
  } else if (fillsHeight < 0.78) {
    // Character sits small/low in the still — pull more torso into frame.
    bustHeightRatio = Math.max(bustHeightRatio, 0.72);
    maxZoom = Math.max(maxZoom, 0.72);
  }
  const headroomRatio = base.headroomRatio;

  const bustH = Math.max(32, Math.round(bb.bh * bustHeightRatio));
  const bustTop = bb.minY;
  const cx = Math.round((bb.minX + bb.maxX) / 2);

  // Prefer a square sized to the bust band; widen slightly for broad silhouettes.
  let side = Math.round(bustH * (1 + padRatio));
  const widthNeed = Math.round(bb.bw * 0.72 * (1 + padRatio * 0.5));
  side = Math.max(side, Math.min(widthNeed, Math.round(bustH * 1.25)));

  const minSide = Math.round(Math.min(w, h) * minZoom);
  const maxSide = Math.round(Math.min(w, h) * maxZoom);
  side = Math.max(minSide, Math.min(maxSide, side));

  let left = Math.round(cx - side / 2);
  let top = Math.round(bustTop - side * headroomRatio);
  left = Math.max(0, Math.min(left, w - side));
  top = Math.max(0, Math.min(top, h - side));

  const needBot = bustTop + bustH;
  if (top + side < needBot) {
    const grow = needBot - (top + side);
    const newSide = Math.min(maxSide, side + grow);
    if (newSide > side) {
      side = newSide;
      left = Math.round(cx - side / 2);
      top = Math.round(bustTop - side * headroomRatio);
      left = Math.max(0, Math.min(left, w - side));
      top = Math.max(0, Math.min(top, h - side));
    }
    if (top + side < needBot) {
      top = Math.max(0, Math.min(needBot - side, h - side));
    }
  }

  return { left, top, width: side, height: side };
}

/**
 * Fallback when alpha is missing / fully opaque plates: legacy canvas zoom.
 * @param {number} w
 * @param {number} h
 * @param {{ zoom?: number, topRatio?: number }} [opts]
 * @returns {BustRegion}
 */
export function legacyCanvasBustRegion(
  w,
  h,
  { zoom = 0.5, topRatio = 0.03 } = {},
) {
  const crop = Math.round(Math.min(w, h) * zoom);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.min(Math.round(h * topRatio), h - crop));
  return { left, top, width: crop, height: crop };
}

/**
 * @param {string} srcPath
 * @param {typeof DEFAULT_BUST_CROP} [opts]
 * @returns {Promise<BustRegion>}
 */
export async function computeBustRegion(srcPath, opts = DEFAULT_BUST_CROP) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const thr = opts.alphaThreshold ?? DEFAULT_BUST_CROP.alphaThreshold;
  const bb = alphaBoundingBox(data, w, h, thr);
  if (!bb || bb.bw < 8 || bb.bh < 8) {
    return legacyCanvasBustRegion(w, h, {
      zoom: opts.maxZoom ?? DEFAULT_BUST_CROP.maxZoom,
    });
  }
  // Nearly full-frame opaque plate → treat as no useful alpha.
  if (bb.bw / w > 0.98 && bb.bh / h > 0.98) {
    return legacyCanvasBustRegion(w, h, {
      zoom: opts.maxZoom ?? DEFAULT_BUST_CROP.maxZoom,
    });
  }
  return bustRegionFromBBox(bb, w, h, opts);
}
