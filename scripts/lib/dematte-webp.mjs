/**
 * Shared flood-fill dematte + WebP encode helpers.
 *
 * Battle stills: charcoal mats are flat near-black; dark costume often shares
 * #000 with the matte but has local luminance texture — require flatness so
 * flood cannot tunnel through the body.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 * @param {number} lim
 * @param {number} chromaMax
 */
/**
 * @param {object} [opts]
 * @param {boolean} [opts.allowBrightMatte=true] near-white plate (portraits: false)
 * @param {boolean} [opts.plateOnly=false] painted on #000 — flood only exact plate pixels
 * @param {number} [opts.plateMax=0] max(R,G,B) treated as plate when plateOnly
 */
export function isMatteColor(r, g, b, a, lim = 36, chromaMax = 8, opts = {}) {
  if (opts.plateOnly) {
    if (a < 8) return true;
    return Math.max(r, g, b) <= (opts.plateMax ?? 0);
  }
  if (opts.plateCheckerboard) {
    if (a < 8) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    return max - min <= 20 && lum >= (opts.checkerLumMin ?? 115);
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  if (chroma > chromaMax) return false;
  if (lum <= lim) return true;
  if (opts.allowBrightMatte !== false && lum >= 248 && chroma <= 8) return true;
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
  const plateOnly = opts.plateOnly ?? false;
  const plateCheckerboard = opts.plateCheckerboard ?? false;
  const matteOpts = {
    allowBrightMatte: opts.allowBrightMatte,
    plateOnly,
    plateMax: opts.plateMax,
    plateCheckerboard,
    checkerLumMin: opts.checkerLumMin,
  };
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
    if (!isMatteColor(r, g, b, a, lim, chromaMax, matteOpts)) return;
    // Painted #000 plate: every plate pixel can be punched (no tunneling through fur).
    if (!plateOnly && !plateCheckerboard && a >= 8) {
      const lum = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const brightMatteMin = opts.brightMatteLumMin ?? 248;
      const isBrightMatte =
        opts.allowBrightMatte !== false &&
        lum >= brightMatteMin &&
        chroma <= chromaMax;
      if (isBrightMatte) {
        // Near-white studio plate — flatness only (opaqueCap would reject #fff).
        if (!isFlat(x, y)) return;
      } else {
        const opaqueCap = opts.opaqueMatteLum ?? Math.min(lim, 28);
        if (lum > opaqueCap) return;
        if (!isFlat(x, y)) return;
      }
    }
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

/** Zero RGB on fully transparent pixels (avoids black fringe in WebP). */
export function zeroClearRgb(rgba, alphaCutoff = 12) {
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < alphaCutoff) {
      rgba[i] = 0;
      rgba[i + 1] = 0;
      rgba[i + 2] = 0;
      rgba[i + 3] = 0;
    }
  }
}

/**
 * Un-premultiply dark fringe on soft silhouette edges after resize.
 */
export function defringeSilhouetteRgb(rgba) {
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a <= 0 || a >= 250) continue;
    const af = a / 255;
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const lum = (r + g + b) / 3;
    if (lum > 72) continue;
    rgba[i] = Math.min(255, Math.round(r / af));
    rgba[i + 1] = Math.min(255, Math.round(g / af));
    rgba[i + 2] = Math.min(255, Math.round(b / af));
  }
}

/**
 * Remove semi-transparent near-black matte residue after dematte.
 */
export function defringeMatteResidue(rgba, lim = 40) {
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a === 0) continue;
    if (a >= 248) continue;
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const lum = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (lum <= lim && chroma <= 16) rgba[i + 3] = 0;
  }
}

/**
 * Punch edge-reachable and enclosed flat near-white plate regions.
 * Wing / limb gaps often keep studio #fff after outer dematte; textured pale
 * fur/armor fails the flatness gate and is left alone.
 *
 * @param {Uint8ClampedArray} rgba
 * @param {number} w
 * @param {number} h
 * @param {object} [opts]
 * @returns {{ edgePunched: number, enclosedPunched: number }}
 */
export function punchEnclosedBrightMatte(rgba, w, h, opts = {}) {
  const lumMin = opts.lumMin ?? 228;
  const chromaMax = opts.chromaMax ?? 18;
  const flatRange = opts.flatRange ?? 8;
  const minSize = opts.minSize ?? 3;
  const minFlatPct = opts.minFlatPct ?? 0.25;
  const minAvgLum = opts.minAvgLum ?? 232;

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

  const isBright = (i) => {
    const o = i * 4;
    if (rgba[o + 3] < 8) return false;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const lum = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    return lum >= lumMin && chroma <= chromaMax;
  };

  const clearPixel = (i) => {
    const o = i * 4;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
  };

  // Flood from image edges through clear + flat bright plate.
  const edgeReach = new Uint8Array(w * h);
  const q = [];
  const pushEdge = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (edgeReach[i]) return;
    if (rgba[i * 4 + 3] < 8) {
      edgeReach[i] = 1;
      q.push(i);
      return;
    }
    if (!isBright(i) || !isFlat(x, y)) return;
    edgeReach[i] = 1;
    q.push(i);
  };

  for (let x = 0; x < w; x++) {
    pushEdge(x, 0);
    pushEdge(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushEdge(0, y);
    pushEdge(w - 1, y);
  }

  let edgePunched = 0;
  while (q.length) {
    const i = q.pop();
    if (rgba[i * 4 + 3] >= 8) {
      clearPixel(i);
      edgePunched += 1;
    }
    const x = i % w;
    const y = (i / w) | 0;
    pushEdge(x - 1, y);
    pushEdge(x + 1, y);
    pushEdge(x, y - 1);
    pushEdge(x, y + 1);
  }

  // Also flood from any interior transparent pocket into adjacent plate.
  for (let i = 0; i < w * h; i++) {
    if (edgeReach[i]) continue;
    if (rgba[i * 4 + 3] >= 8) continue;
    edgeReach[i] = 1;
    q.push(i);
  }
  while (q.length) {
    const i = q.pop();
    const x = i % w;
    const y = (i / w) | 0;
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (edgeReach[ni]) continue;
      if (rgba[ni * 4 + 3] < 8) {
        edgeReach[ni] = 1;
        q.push(ni);
        continue;
      }
      if (!isBright(ni) || !isFlat(nx, ny)) continue;
      edgeReach[ni] = 1;
      clearPixel(ni);
      edgePunched += 1;
      q.push(ni);
    }
  }

  // Label remaining flat bright components (fully enclosed plate pockets).
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  for (let i = 0; i < w * h; i++) {
    if (edgeReach[i] || label[i] >= 0 || !isBright(i)) continue;
    const x0 = i % w;
    const y0 = (i / w) | 0;
    if (!isFlat(x0, y0)) continue;
    const id = comps.length;
    const qq = [i];
    label[i] = id;
    let size = 0;
    let flatN = 0;
    let sumLum = 0;
    while (qq.length) {
      const cur = qq.pop();
      size += 1;
      const x = cur % w;
      const y = (cur / w) | 0;
      const o = cur * 4;
      sumLum += (rgba[o] + rgba[o + 1] + rgba[o + 2]) / 3;
      if (isFlat(x, y)) flatN += 1;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (edgeReach[ni] || label[ni] >= 0 || !isBright(ni)) continue;
        if (!isFlat(nx, ny)) continue;
        label[ni] = id;
        qq.push(ni);
      }
    }
    comps.push({
      id,
      size,
      flatPct: flatN / size,
      avgLum: sumLum / size,
    });
  }

  let enclosedPunched = 0;
  const punchIds = new Set();
  for (const c of comps) {
    if (c.size < minSize || c.flatPct < minFlatPct || c.avgLum < minAvgLum) {
      continue;
    }
    punchIds.add(c.id);
  }
  if (punchIds.size) {
    for (let i = 0; i < w * h; i++) {
      if (!punchIds.has(label[i])) continue;
      clearPixel(i);
      enclosedPunched += 1;
    }
  }

  // Second pass: tiny / soft-edged enclosed near-pure #fff pockets that fail
  // the flatness gate (anti-aliased wing gaps, energy-ring holes).
  if (opts.punchPureEnclosed !== false) {
    const pureLumMin = opts.pureLumMin ?? 238;
    const pureChromaMax = opts.pureChromaMax ?? 16;
    const pureMinSize = opts.pureMinSize ?? 2;
    const isPure = (i) => {
      const o = i * 4;
      if (rgba[o + 3] < 8) return false;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const lum = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      return lum >= pureLumMin && chroma <= pureChromaMax;
    };

    const reach = new Uint8Array(w * h);
    const rq = [];
    const pushReach = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = y * w + x;
      if (reach[i]) return;
      if (rgba[i * 4 + 3] < 8 || isPure(i)) {
        reach[i] = 1;
        rq.push(i);
      }
    };
    for (let x = 0; x < w; x++) {
      pushReach(x, 0);
      pushReach(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      pushReach(0, y);
      pushReach(w - 1, y);
    }
    while (rq.length) {
      const i = rq.pop();
      if (rgba[i * 4 + 3] >= 8 && isPure(i)) {
        clearPixel(i);
        enclosedPunched += 1;
      }
      const x = i % w;
      const y = (i / w) | 0;
      pushReach(x - 1, y);
      pushReach(x + 1, y);
      pushReach(x, y - 1);
      pushReach(x, y + 1);
    }

    const pureLabel = new Int32Array(w * h).fill(-1);
    const pureComps = [];
    for (let i = 0; i < w * h; i++) {
      if (reach[i] || pureLabel[i] >= 0 || !isPure(i)) continue;
      const id = pureComps.length;
      const qq = [i];
      pureLabel[i] = id;
      let size = 0;
      while (qq.length) {
        const cur = qq.pop();
        size += 1;
        const x = cur % w;
        const y = (cur / w) | 0;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (reach[ni] || pureLabel[ni] >= 0 || !isPure(ni)) continue;
          pureLabel[ni] = id;
          qq.push(ni);
        }
      }
      pureComps.push({ id, size });
    }
    const purePunch = new Set();
    for (const c of pureComps) {
      if (c.size >= pureMinSize) purePunch.add(c.id);
    }
    if (purePunch.size) {
      for (let i = 0; i < w * h; i++) {
        if (!purePunch.has(pureLabel[i])) continue;
        clearPixel(i);
        enclosedPunched += 1;
      }
    }
  }

  return { edgePunched, enclosedPunched };
}

/**
 * Fill small transparent holes surrounded by opaque silhouette (dematte punch-through).
 */
export function fillInteriorHoles(rgba, w, h, minNeighbors = 4, passes = 4) {
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const o = (y * w + x) * 4;
        if (rgba[o + 3] >= 20) continue;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumA = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const j = ((y + dy) * w + x + dx) * 4;
            const na = rgba[j + 3];
            if (na < 150) continue;
            sumR += rgba[j];
            sumG += rgba[j + 1];
            sumB += rgba[j + 2];
            sumA += na;
            n += 1;
          }
        }
        if (n < minNeighbors) continue;
        rgba[o] = Math.round(sumR / n);
        rgba[o + 1] = Math.round(sumG / n);
        rgba[o + 2] = Math.round(sumB / n);
        rgba[o + 3] = Math.min(255, Math.round(sumA / n));
      }
    }
  }
}

export async function finishDematteRgba(rgba, w, h, opts = {}) {
  // Clear residual flat white plate pockets (wing gaps etc.) before seal/fill.
  if (opts.punchEnclosedWhite) {
    punchEnclosedBrightMatte(rgba, w, h, {
      lumMin: opts.whiteLumMin,
      chromaMax: opts.whiteChromaMax,
      flatRange: opts.whiteFlatRange,
      minSize: opts.whiteMinSize,
      minFlatPct: opts.whiteMinFlatPct,
      minAvgLum: opts.whiteMinAvgLum,
    });
  }
  if (opts.defringe) {
    defringeMatteResidue(rgba, opts.defringeLim ?? 40);
  }
  if (opts.defringeSilhouette) defringeSilhouetteRgb(rgba);
  if (opts.sealInterior) {
    sealPortraitInterior(rgba, w, h, {
      yStartRatio: opts.sealYStartRatio ?? 0.06,
      yEndRatio: opts.sealYEndRatio ?? 0.42,
      sealGrid: opts.sealGrid,
      sealGridSpread: opts.sealGridSpread,
    });
  }
  if (opts.fillHoles) {
    fillInteriorHoles(
      rgba,
      w,
      h,
      opts.fillHoleNeighbors ?? 4,
      opts.fillHolePasses ?? 4,
    );
  }
  zeroClearRgb(rgba);
}

/**
 * Flood-fill from bust-center seeds, then restore alpha inside the silhouette.
 * Fixes dematte holes (e.g. bright belt / overlay fringe at portrait bottom).
 */
export function sealPortraitInterior(rgba, w, h, opts = {}) {
  const yStart = opts.yStartRatio ?? 0.06;
  const yEnd = opts.yEndRatio ?? 0.42;
  const inside = new Uint8Array(w * h);
  const q = [];
  const cx = Math.floor(w * 0.5);

  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0;
    return rgba[(y * w + x) * 4 + 3];
  };

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (inside[i]) return;
    if (alphaAt(x, y) < 12) return;
    inside[i] = 1;
    q.push(i);
  };

  for (let y = Math.floor(h * yStart); y <= Math.floor(h * yEnd); y += 4) {
    push(cx, y);
    push(cx - 2, y);
    push(cx + 2, y);
    if (opts.sealGrid) {
      const spread = Math.floor(w * (opts.sealGridSpread ?? 0.14));
      push(cx - spread, y);
      push(cx + spread, y);
    }
  }

  while (q.length) {
    const i = q.pop();
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!inside[i]) continue;
      const o = i * 4;
      if (rgba[o + 3] >= 220) continue;
      let sumA = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = (yy * w + xx) * 4;
          const na = rgba[j + 3];
          if (na < 160) continue;
          sumA += na;
          sumR += rgba[j];
          sumG += rgba[j + 1];
          sumB += rgba[j + 2];
          n += 1;
        }
      }
      if (n < 3) continue;
      rgba[o] = Math.round(sumR / n);
      rgba[o + 1] = Math.round(sumG / n);
      rgba[o + 2] = Math.round(sumB / n);
      rgba[o + 3] = Math.min(255, Math.round(sumA / n));
    }
  }
}

/**
 * Copy opaque pixels downward in the lower bust to close dematte gaps at the waist.
 */
export function repairPortraitBottomFringe(rgba, w, h, startRatio = 0.52) {
  const y0 = Math.max(1, Math.floor(h * startRatio));
  for (let pass = 0; pass < 3; pass++) {
    for (let y = y0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (rgba[o + 3] >= 200) continue;
        const ao = ((y - 1) * w + x) * 4;
        if (rgba[ao + 3] >= 200) {
          rgba[o] = rgba[ao];
          rgba[o + 1] = rgba[ao + 1];
          rgba[o + 2] = rgba[ao + 2];
          rgba[o + 3] = rgba[ao + 3];
          continue;
        }
        if (x > 0 && x < w - 1) {
          const lo = (y * w + x - 1) * 4;
          const ro = (y * w + x + 1) * 4;
          if (rgba[lo + 3] >= 200 && rgba[ro + 3] >= 200) {
            rgba[o] = Math.round((rgba[lo] + rgba[ro]) / 2);
            rgba[o + 1] = Math.round((rgba[lo + 1] + rgba[ro + 1]) / 2);
            rgba[o + 2] = Math.round((rgba[lo + 2] + rgba[ro + 2]) / 2);
            rgba[o + 3] = Math.round((rgba[lo + 3] + rgba[ro + 3]) / 2);
          }
        }
      }
    }
  }
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

/**
 * Detect near-white opaque delivery plates (#fff / light gray studio backdrop).
 * @param {import("sharp").Sharp|string|Buffer} srcImage
 * @param {object} [opts]
 */
export async function detectWhitePlate(srcImage, opts = {}) {
  const probe = opts.probeSize ?? 256;
  const lumMin = opts.lumMin ?? 235;
  const chromaMax = opts.chromaMax ?? 12;
  const { data, info } = await sharp(srcImage)
    .resize(probe, probe, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let borderBright = 0;
  let borderTotal = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const onEdge = y === 0 || y === h - 1 || x === 0 || x === w - 1;
      if (!onEdge) continue;
      borderTotal += 1;
      const o = (y * w + x) * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const a = data[o + 3];
      if (a < 200) continue;
      const lum = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum >= lumMin && chroma <= chromaMax) borderBright += 1;
    }
  }
  return borderTotal > 0 && borderBright / borderTotal >= 0.55;
}

export async function detectPreAlpha(srcImage, opts = {}) {
  const probe = opts.probeSize ?? 256;
  const { data, info } = await sharp(srcImage)
    .resize(probe, probe, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let soft = 0;
  let borderSoft = 0;
  const border = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a < 220) soft += 1;
      const onEdge = y === 0 || y === h - 1 || x === 0 || x === w - 1;
      if (onEdge) {
        border.push(a);
        if (a < 128) borderSoft += 1;
      }
    }
  }
  const total = w * h;
  const borderTotal = border.length;
  const borderMean = border.reduce((s, a) => s + a, 0) / borderTotal;
  return (
    borderSoft >= borderTotal * 0.35 &&
    soft >= total * 0.12 &&
    borderMean < 160
  );
}

export async function imageToTransparentWebp(srcImage, dstWebp, opts = {}) {
  const size = opts.size ?? 1024;
  const fit = opts.fit ?? "contain";
  const resizeOpts = {
    fit,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };
  if (sharp.kernel?.lanczos3) resizeOpts.kernel = sharp.kernel.lanczos3;
  const { data, info } = await sharp(srcImage)
    .resize(size, size, resizeOpts)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const rgba = new Uint8ClampedArray(data);
  cleanTransparentBattleRgba(rgba, w, h);
  await finishDematteRgba(rgba, w, h, {
    defringe: opts.defringe ?? true,
    defringeLim: opts.defringeLim ?? 28,
    defringeSilhouette: opts.defringeSilhouette ?? true,
    fillHoles: opts.fillHoles ?? true,
    fillHoleNeighbors: opts.fillHoleNeighbors ?? 4,
    fillHolePasses: opts.fillHolePasses ?? 3,
    punchEnclosedWhite: opts.punchEnclosedWhite ?? true,
    whiteLumMin: opts.whiteLumMin,
    whiteChromaMax: opts.whiteChromaMax,
    whiteFlatRange: opts.whiteFlatRange,
    whiteMinSize: opts.whiteMinSize,
    whiteMinFlatPct: opts.whiteMinFlatPct,
    whiteMinAvgLum: opts.whiteMinAvgLum,
  });
  featherAlphaEdges(rgba, w, h, 2);
  zeroClearRgb(rgba);
  await rawRgbaToWebp(rgba, w, h, dstWebp, opts);
}

/**
 * Chroma-key plate (magenta/green) → alpha for AI delivery when true PNG alpha is missing.
 */
export function chromaSpillSuppress(rgba, w, h) {
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const o = (y * w + x) * 4;
        if (rgba[o + 3] < 8) continue;
        let nearTrans = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            if (rgba[((y + dy) * w + x + dx) * 4 + 3] < 24) nearTrans += 1;
          }
        }
        if (nearTrans < 2) continue;
        const r = rgba[o];
        const g = rgba[o + 1];
        const b = rgba[o + 2];
        if (r >= 150 && b >= 150 && g <= 130) {
          rgba[o] = 0;
          rgba[o + 1] = 0;
          rgba[o + 2] = 0;
          rgba[o + 3] = 0;
        }
      }
    }
  }
}

/** Pixel reads as magenta/purple plate, black matte, or already cleared. */
export function isChromaPlatePixel(r, g, b, a = 255) {
  if (a < 12) return true;
  if (r + g + b < 28) return true;
  if (r >= 200 && b >= 200 && g <= 100) return true;
  if (r >= 40 && b >= 40 && g <= 125 && r + b > g + 55) return true;
  return false;
}

export function floodBlackPlateFromEdges(rgba, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const isBg = (r, g, b, a) => a < 12 || r + g + b < 28;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isBg(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
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
    const o = i * 4;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

export function stripChromaOutsideMask(rgba, w, h, inside) {
  for (let i = 0; i < w * h; i++) {
    if (inside[i]) continue;
    const o = i * 4;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const a = rgba[o + 3];
    if (a < 8) continue;
    if (!isChromaPlatePixel(r, g, b, a)) continue;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
  }
}

/** Strip purple floor glow in the lower band (keeps orange fire). */
export function stripLowerChromaFloor(rgba, w, h, opts = {}) {
  const yCut = Math.floor(h * (opts.floorRatio ?? 0.74));
  for (let y = yCut; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (rgba[o + 3] < 8) continue;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const fire = r >= 120 && g >= 45 && b <= 140 && r > b + 20;
      if (fire) continue;
      if (isChromaPlatePixel(r, g, b, rgba[o + 3])) {
        rgba[o] = 0;
        rgba[o + 1] = 0;
        rgba[o + 2] = 0;
        rgba[o + 3] = 0;
      }
    }
  }
}

export function stripBottomChromaWedge(rgba, w, h, opts = {}) {
  const ratio = opts.ratio ?? 0.08;
  const yStart = h - Math.max(1, Math.floor(h * ratio));
  for (let y = yStart; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (rgba[o + 3] < 8) continue;
      if (isChromaPlatePixel(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) {
        rgba[o] = 0;
        rgba[o + 1] = 0;
        rgba[o + 2] = 0;
        rgba[o + 3] = 0;
      }
    }
  }
}

/** Flood-remove magenta plate pixels connected to image border. */
export function floodChromaPlateFromEdges(rgba, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const isPlate = (r, g, b) => r >= 195 && b >= 195 && g <= 105;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isPlate(rgba[o], rgba[o + 1], rgba[o + 2])) return;
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
    const o = i * 4;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

/** Full chroma-key pass for magenta/black AI battle plates. */
export async function processChromaBattleRgba(rgba, w, h, opts = {}) {
  chromaKeyRgba(rgba, opts.chroma ?? { tolerance: 95 });
  floodChromaPlateFromEdges(rgba, w, h);
  floodPurplePlateFromEdges(rgba, w, h);
  floodBlackPlateFromEdges(rgba, w, h);
  await dematteBuffer(rgba, w, h, 36, { plateOnly: true, plateMax: 0 });
  chromaSpillSuppress(rgba, w, h);
  const inside = buildSubjectInsideMask(rgba, w, h, {
    yEndRatio: opts.yEndRatio ?? 0.88,
    sealGrid: true,
    sealGridSpread: opts.sealGridSpread ?? 0.2,
    excludeChroma: true,
  });
  stripChromaOutsideMask(rgba, w, h, inside);
  stripExteriorChromaGlow(rgba, w, h, inside, { bottomRatio: 0.55 });
  stripInteriorFloorGlow(rgba, w, h, { floorRatio: 0.72 });
  stripLowerChromaFloor(rgba, w, h, { floorRatio: 0.74 });
  stripBottomChromaWedge(rgba, w, h);
  stripBottomChromaBand(rgba, w, h);
  return inside;
}

/** Remove chroma plate in the lowest band (feet floor glow), keep orange fire. */
export function stripBottomChromaBand(rgba, w, h, opts = {}) {
  const ratio = opts.ratio ?? 0.14;
  const yStart = h - Math.max(1, Math.floor(h * ratio));
  for (let y = yStart; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (rgba[o + 3] < 8) continue;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const fire = r >= 115 && g >= 40 && b <= 145 && r > b + 15;
      if (fire) continue;
      if (isChromaPlatePixel(r, g, b, rgba[o + 3])) {
        rgba[o] = 0;
        rgba[o + 1] = 0;
        rgba[o + 2] = 0;
        rgba[o + 3] = 0;
      }
    }
  }
}

/** Subject silhouette mask via center-column flood (opaque pixels). */
export function buildSubjectInsideMask(rgba, w, h, opts = {}) {
  const inside = new Uint8Array(w * h);
  const yStart = opts.yStartRatio ?? 0.05;
  const yEnd = opts.yEndRatio ?? 0.88;
  const cx = Math.floor(w * 0.5);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (inside[i]) return;
    if (rgba[i * 4 + 3] < 12) return;
    if (opts.excludeChroma) {
      const o = i * 4;
      if (isChromaPlatePixel(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
    }
    inside[i] = 1;
    q.push(i);
  };
  for (let y = Math.floor(h * yStart); y <= Math.floor(h * yEnd); y += 3) {
    push(cx, y);
    push(cx - 2, y);
    push(cx + 2, y);
    if (opts.sealGrid) {
      const spread = Math.floor(w * (opts.sealGridSpread ?? 0.18));
      push(cx - spread, y);
      push(cx + spread, y);
    }
  }
  while (q.length) {
    const i = q.pop();
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return inside;
}

/** Remove magenta/purple floor glow outside the subject (below waist). */
export function stripExteriorChromaGlow(rgba, w, h, inside, opts = {}) {
  const yCut = Math.floor(h * (opts.bottomRatio ?? 0.76));
  for (let y = yCut; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (inside[i]) continue;
      const o = i * 4;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      if (rgba[o + 3] < 8) continue;
      const plate = r >= 170 && b >= 170 && g <= 130;
      const floorGlow = r >= 80 && b >= 80 && g <= 110;
      if (plate || floorGlow) {
        rgba[o] = 0;
        rgba[o + 1] = 0;
        rgba[o + 2] = 0;
        rgba[o + 3] = 0;
      }
    }
  }
}

/** Remove purple/magenta floor glow below the waist (inside silhouette). */
export function stripInteriorFloorGlow(rgba, w, h, opts = {}) {
  const yCut = Math.floor(h * (opts.floorRatio ?? 0.8));
  for (let y = yCut; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (rgba[o + 3] < 8) continue;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const isOrangeFire = r >= 140 && g >= 60 && b <= 120;
      if (isOrangeFire) continue;
      const floorGlow = r >= 70 && b >= 70 && g <= 95;
      if (floorGlow) {
        rgba[o] = 0;
        rgba[o + 1] = 0;
        rgba[o + 2] = 0;
        rgba[o + 3] = 0;
      }
    }
  }
}

/** Flood-remove purple/magenta plate connected to image edges. */
export function floodPurplePlateFromEdges(rgba, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const isPurplePlate = (r, g, b, a) => {
    if (a < 12) return true;
    if (r >= 130 && g >= 35 && g <= 140) return false;
    return r >= 45 && b >= 45 && g <= 120 && r + b > g + 70;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isPurplePlate(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3])) return;
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
    const o = i * 4;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

/** Pre-alpha PNG cleanup — strip leftover plate glow before WebP encode. */
export function cleanTransparentBattleRgba(rgba, w, h) {
  const inside = buildSubjectInsideMask(rgba, w, h, {
    yEndRatio: 0.9,
    sealGrid: true,
    sealGridSpread: 0.2,
  });
  floodPurplePlateFromEdges(rgba, w, h);
  stripExteriorChromaGlow(rgba, w, h, inside, { bottomRatio: 0.65 });
  stripInteriorFloorGlow(rgba, w, h, { floorRatio: 0.72 });
  chromaSpillSuppress(rgba, w, h);
}

/** Soft alpha on silhouette boundary (after hard chroma key). */
export function featherAlphaEdges(rgba, w, h, radius = 2) {
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = rgba[i * 4 + 3];
  const tmp = new Float32Array(w * h);
  for (let pass = 0; pass < radius; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const yy = y + dy;
            const xx = x + dx;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            sum += alpha[yy * w + xx];
            n += 1;
          }
        }
        tmp[y * w + x] = sum / n;
      }
    }
    alpha.set(tmp);
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const orig = rgba[i * 4 + 3];
      if (orig === 0 && alpha[i] < 1) continue;
      let onEdge = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const na = rgba[(yy * w + xx) * 4 + 3];
          if ((orig < 20 && na > 200) || (orig > 200 && na < 20)) onEdge = true;
        }
      }
      if (onEdge) rgba[i * 4 + 3] = Math.round(alpha[i]);
    }
  }
}

export function chromaKeyRgba(rgba, opts = {}) {
  const keyR = opts.keyR ?? 255;
  const keyG = opts.keyG ?? 0;
  const keyB = opts.keyB ?? 255;
  const tol = opts.tolerance ?? 72;
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const dr = r - keyR;
    const dg = g - keyG;
    const db = b - keyB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    const plateMagenta =
      r >= 210 && b >= 210 && g <= 95 && dist <= tol;
    if (plateMagenta) {
      rgba[i] = 0;
      rgba[i + 1] = 0;
      rgba[i + 2] = 0;
      rgba[i + 3] = 0;
    }
  }
}

export async function detectInteriorChromaPlate(srcImage, opts = {}) {
  const probe = opts.probeSize ?? 256;
  const { data, info } = await sharp(srcImage)
    .resize(probe, probe, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let chromaOpaque = 0;
  let opaque = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const a = data[o + 3];
      if (a < 200) continue;
      opaque += 1;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      if (isChromaPlatePixel(r, g, b, a)) chromaOpaque += 1;
    }
  }
  return opaque > 0 && chromaOpaque >= opaque * 0.06;
}

export async function detectChromaPlate(srcImage, opts = {}) {
  const probe = opts.probeSize ?? 256;
  const { data, info } = await sharp(srcImage)
    .resize(probe, probe, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let borderChroma = 0;
  let border = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y !== 0 && y !== h - 1 && x !== 0 && x !== w - 1) continue;
      border += 1;
      const o = (y * w + x) * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      if (r >= 200 && b >= 200 && g <= 100) borderChroma += 1;
      if (g >= 200 && r <= 100 && b <= 100) borderChroma += 1;
    }
  }
  return borderChroma >= border * 0.25;
}

export async function detectCheckerboardPlate(srcImage, opts = {}) {
  const probe = opts.probeSize ?? 256;
  const { data, info } = await sharp(srcImage)
    .resize(probe, probe, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let borderLight = 0;
  let border = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y !== 0 && y !== h - 1 && x !== 0 && x !== w - 1) continue;
      border += 1;
      const o = (y * w + x) * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const lum = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (chroma <= 20 && lum >= 115) borderLight += 1;
    }
  }
  return borderLight >= border * 0.4;
}

export async function imageToChromaBattleWebp(srcImage, dstWebp, opts = {}) {
  const size = opts.size ?? 1024;
  const fit = opts.fit ?? "contain";
  const resizeOpts = {
    fit,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };
  if (sharp.kernel?.lanczos3) resizeOpts.kernel = sharp.kernel.lanczos3;
  const { data, info } = await sharp(srcImage)
    .resize(size, size, resizeOpts)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data);
  await processChromaBattleRgba(rgba, info.width, info.height, opts);
  await finishDematteRgba(rgba, info.width, info.height, opts);
  featherAlphaEdges(rgba, info.width, info.height, 2);
  zeroClearRgb(rgba);
  await rawRgbaToWebp(rgba, info.width, info.height, dstWebp, opts);
}

export async function imageToInstalledBattleWebp(srcImage, dstWebp, opts = {}) {
  const transparentOpts = opts.transparent ?? TRANSPARENT_BATTLE_INSTALL;
  const paintedOpts = opts.painted ?? PAINTED_BATTLE_DEMATTE;
  if (await detectChromaPlate(srcImage)) {
    await imageToChromaBattleWebp(srcImage, dstWebp, transparentOpts);
    return "chroma";
  }
  if (await detectPreAlpha(srcImage)) {
    await imageToTransparentWebp(srcImage, dstWebp, transparentOpts);
    return "transparent";
  }
  if (await detectCheckerboardPlate(srcImage)) {
    const size = transparentOpts.size ?? 1024;
    const fit = transparentOpts.fit ?? "contain";
    const resizeOpts = {
      fit,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    };
    if (sharp.kernel?.lanczos3) resizeOpts.kernel = sharp.kernel.lanczos3;
    const { data, info } = await sharp(srcImage)
      .resize(size, size, resizeOpts)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const rgba = new Uint8ClampedArray(data);
    await dematteBuffer(rgba, info.width, info.height, 36, {
      plateCheckerboard: true,
      checkerLumMin: 115,
    });
    await finishDematteRgba(rgba, info.width, info.height, {
      ...transparentOpts,
      // Checkerboard plates contain large connected transparent regions.
      // Generic hole filling mistakes those regions for silhouette holes.
      fillHoles: false,
      sealInterior: false,
    });
    featherAlphaEdges(rgba, info.width, info.height, 2);
    zeroClearRgb(rgba);
    await rawRgbaToWebp(rgba, info.width, info.height, dstWebp, transparentOpts);
    return "checkerboard";
  }
  if (await detectInteriorChromaPlate(srcImage)) {
    await imageToChromaBattleWebp(srcImage, dstWebp, transparentOpts);
    return "chroma";
  }
  if (await detectWhitePlate(srcImage)) {
    await imageToDematteWebp(
      srcImage,
      dstWebp,
      opts.whitePlate ?? WHITE_PLATE_BATTLE_DEMATTE,
    );
    return "white-plate";
  }
  await imageToDematteWebp(srcImage, dstWebp, paintedOpts);
  return "dematte";
}

export async function rawRgbaToTransparentWebp(rgba, w, h, dstWebp, opts = {}) {
  await finishDematteRgba(rgba, w, h, opts);
  zeroClearRgb(rgba);
  await rawRgbaToWebp(rgba, w, h, dstWebp, opts);
}

export async function imageToDematteWebp(srcImage, dstWebp, opts = {}) {
  const size = opts.size ?? 256;
  const lim = opts.lim ?? 36;
  const fit = opts.fit ?? "cover";
  const punchCenter = opts.punchCenter ?? false;
  const chromaMax = opts.chromaMax;
  const flatRange = opts.flatRange;
  const opaqueMatteLum = opts.opaqueMatteLum;
  const resizeOpts = {
    fit,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };
  if (sharp.kernel?.lanczos3) resizeOpts.kernel = sharp.kernel.lanczos3;
  const { data, info } = await sharp(srcImage)
    .resize(size, size, resizeOpts)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const rgba = new Uint8ClampedArray(data);
  await dematteBuffer(rgba, w, h, lim, {
    chromaMax,
    flatRange,
    allowBrightMatte: opts.allowBrightMatte,
    brightMatteLumMin: opts.brightMatteLumMin,
    opaqueMatteLum,
    plateOnly: opts.plateOnly,
    plateMax: opts.plateMax,
  });
  await finishDematteRgba(rgba, w, h, opts);
  if (punchCenter) punchRoundedRect(rgba, w, h, opts.inset ?? 0.14, opts.radius ?? 0.07);
  zeroClearRgb(rgba);
  const webpOpts = {
    quality: opts.quality ?? 88,
    alphaQuality: 100,
    effort: 6,
  };
  if (opts.lossless) webpOpts.lossless = true;
  else if (opts.nearLossless) webpOpts.nearLossless = true;
  let buf = await sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  })
    .webp(webpOpts)
    .toBuffer();
  if (opts.lossless || opts.nearLossless) {
    const decoded = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const clean = new Uint8ClampedArray(decoded.data);
    zeroClearRgb(clean, 1);
    buf = await sharp(Buffer.from(clean), {
      raw: { width: decoded.info.width, height: decoded.info.height, channels: 4 },
    })
      .webp(webpOpts)
      .toBuffer();
  }
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

/** @deprecated alias — accepts PNG, WebP, or any sharp-readable source */
export const pngToDematteWebp = imageToDematteWebp;

/** Preset for full-body battle stills (flat charcoal mats, protect textured cloth). */
export const BATTLE_STILL_DEMATTE = {
  size: 1024,
  lim: 44,
  opaqueMatteLum: 26,
  chromaMax: 8,
  flatRange: 4,
  fit: "contain",
  quality: 95,
  allowBrightMatte: false,
  defringe: true,
  defringeLim: 38,
};

/** Pre-alpha painted battle still — resize + light edge cleanup only. */
export const TRANSPARENT_BATTLE_INSTALL = {
  size: 1024,
  fit: "contain",
  quality: 95,
  lossless: true,
  defringe: true,
  defringeLim: 28,
  defringeSilhouette: true,
  punchEnclosedWhite: true,
  fillHoles: true,
  fillHolePasses: 3,
};

/** Pre-alpha portrait — encode only (crop pipeline passes raw RGBA). */
export const TRANSPARENT_PORTRAIT_INSTALL = {
  size: 768,
  quality: 95,
  lossless: true,
  defringe: true,
  defringeLim: 28,
  defringeSilhouette: true,
  punchEnclosedWhite: true,
  sealInterior: true,
  sealGrid: true,
  sealGridSpread: 0.14,
  sealYEndRatio: 0.55,
  fillHoles: true,
  fillHolePasses: 6,
};

/** Near-white studio plate — edge + enclosed flat plate punch. */
export const WHITE_PLATE_BATTLE_DEMATTE = {
  ...BATTLE_STILL_DEMATTE,
  allowBrightMatte: true,
  brightMatteLumMin: 240,
  flatRange: 4,
  defringe: true,
  defringeLim: 248,
  defringeSilhouette: true,
  punchEnclosedWhite: true,
  fillHoles: false,
  sealInterior: false,
  nearLossless: true,
  lossless: true,
};

/** Hand-painted battle stills on pure black — strict #000 plate-only dematte. */
export const PAINTED_BATTLE_DEMATTE = {
  ...BATTLE_STILL_DEMATTE,
  plateOnly: true,
  plateMax: 0,
  defringe: true,
  defringeLim: 32,
  defringeSilhouette: true,
  punchEnclosedWhite: true,
  sealInterior: true,
  sealGrid: true,
  sealGridSpread: 0.16,
  sealYEndRatio: 0.82,
  fillHoles: true,
  fillHolePasses: 5,
  nearLossless: true,
  lossless: true,
};

/** Preset for bust-cropped inventory / codex portraits (same matte rules as stills). */
export const PORTRAIT_DEMATTE = {
  size: 768,
  plateOnly: true,
  plateMax: 0,
  quality: 95,
  allowBrightMatte: false,
  defringe: true,
  defringeLim: 32,
  defringeSilhouette: true,
  punchEnclosedWhite: true,
  sealInterior: true,
  sealGrid: true,
  sealGridSpread: 0.14,
  sealYEndRatio: 0.55,
  fillHoles: true,
  fillHolePasses: 5,
  nearLossless: true,
  lossless: true,
};

/** Portrait bust on near-white plate (same bright-matte rules as battle). */
export const WHITE_PLATE_PORTRAIT_DEMATTE = {
  ...PORTRAIT_DEMATTE,
  plateOnly: false,
  allowBrightMatte: true,
  brightMatteLumMin: 240,
  flatRange: 4,
  fillHoles: false,
  sealInterior: false,
  punchEnclosedWhite: true,
};

export async function writeWebpAtomic(dstWebp, buf) {
  const dir = path.dirname(dstWebp);
  await fs.promises.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(dstWebp)}.${process.pid}.tmp`);
  await fs.promises.writeFile(tmp, buf);
  try {
    // Windows does not replace an existing destination during rename.
    // Remove it first so rebuilds do not fall through to a less reliable
    // in-place write when the old WebP already exists.
    await fs.promises.unlink(dstWebp).catch(() => {});
    await fs.promises.rename(tmp, dstWebp);
  } catch {
    await fs.promises.copyFile(tmp, dstWebp);
  }
  await fs.promises.unlink(tmp).catch(() => {});
}

/**
 * Encode raw RGBA to WebP (no dematte pass).
 * @param {Uint8ClampedArray} rgba
 * @param {number} w
 * @param {number} h
 * @param {string} dstWebp
 * @param {object} [opts]
 */
export async function rawRgbaToWebp(rgba, w, h, dstWebp, opts = {}) {
  const webpOpts = {
    quality: opts.quality ?? PORTRAIT_DEMATTE.quality,
    alphaQuality: 100,
    effort: 6,
  };
  if (opts.lossless) webpOpts.lossless = true;
  else if (opts.nearLossless) webpOpts.nearLossless = true;
  let buf = await sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  })
    .webp(webpOpts)
    .toBuffer();
  if (opts.lossless || opts.nearLossless) {
    for (let pass = 0; pass < 3; pass++) {
      const decoded = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const clean = new Uint8ClampedArray(decoded.data);
      let ghosts = 0;
      for (let i = 0; i < clean.length; i += 4) {
        if (clean[i + 3] === 0 && (clean[i] | clean[i + 1] | clean[i + 2])) ghosts += 1;
        if (clean[i + 3] < 8) {
          clean[i] = 0;
          clean[i + 1] = 0;
          clean[i + 2] = 0;
          clean[i + 3] = 0;
        }
      }
      zeroClearRgb(clean, 1);
      if (ghosts === 0 && pass > 0) break;
      buf = await sharp(Buffer.from(clean), {
        raw: { width: decoded.info.width, height: decoded.info.height, channels: 4 },
      })
        .webp(webpOpts)
        .toBuffer();
      if (ghosts === 0) break;
    }
  }
  await writeWebpAtomic(dstWebp, buf);
}

/**
 * Dematte raw RGBA and write WebP (for custom crop pipelines).
 * @param {Uint8ClampedArray} rgba
 * @param {number} w
 * @param {number} h
 * @param {string} dstWebp
 * @param {object} [opts]
 */
export async function rawRgbaToDematteWebp(rgba, w, h, dstWebp, opts = {}) {
  const lim = opts.lim ?? PORTRAIT_DEMATTE.lim;
  const chromaMax = opts.chromaMax ?? PORTRAIT_DEMATTE.chromaMax;
  const flatRange = opts.flatRange ?? PORTRAIT_DEMATTE.flatRange;
  const allowBrightMatte = opts.allowBrightMatte ?? PORTRAIT_DEMATTE.allowBrightMatte;
  await dematteBuffer(rgba, w, h, lim, {
    chromaMax,
    flatRange,
    allowBrightMatte,
    brightMatteLumMin: opts.brightMatteLumMin,
    opaqueMatteLum: opts.opaqueMatteLum,
    plateOnly: opts.plateOnly,
    plateMax: opts.plateMax,
  });
  await finishDematteRgba(rgba, w, h, opts);
  zeroClearRgb(rgba);
  await rawRgbaToWebp(rgba, w, h, dstWebp, opts);
}
