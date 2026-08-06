/** Punch outer near-black matte pixels to alpha so monster art sits on transparent UI. */

const cache = new Map<string, string>();

function isMatte(r: number, g: number, b: number, a: number, lim = 28): boolean {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;
  if (lum <= lim && chroma <= 18) return true;
  if (r <= lim && g <= lim && b <= lim + 8 && chroma <= 22) return true;
  return false;
}

/**
 * Load an image URL, convert outer black/dark backdrop to transparency, return a blob URL.
 * Falls back to the original src on failure / already-transparent assets.
 */
export async function dematteBlackSrc(src: string): Promise<string> {
  if (!src || src.startsWith("blob:") || src.startsWith("data:")) return src;
  const hit = cache.get(src);
  if (hit) return hit;

  try {
    const img = await loadImage(src);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (w < 2 || h < 2) return src;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0);
    const image = ctx.getImageData(0, 0, w, h);
    const d = image.data;

    const visited = new Uint8Array(w * h);
    const q: number[] = [];
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = y * w + x;
      if (visited[i]) return;
      const o = i * 4;
      if (!isMatte(d[o]!, d[o + 1]!, d[o + 2]!, d[o + 3]!)) return;
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
      const i = q.pop()!;
      d[i * 4 + 3] = 0;
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
        const r = d[o]!;
        const g = d[o + 1]!;
        const b = d[o + 2]!;
        const a = d[o + 3]!;
        if (a < 8) continue;
        if (!(r < 48 && g < 48 && b < 48)) continue;
        let near = false;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          if (visited[(y + dy) * w + (x + dx)]) {
            near = true;
            break;
          }
        }
        if (!near) continue;
        const lum = (r + g + b) / 3;
        d[o + 3] = Math.round(a * Math.min(1, lum / 40));
        punched += 1;
      }
    }

    // Skip rewrite if almost nothing was punched (true alpha art).
    if (punched < (w * h) / 100) {
      cache.set(src, src);
      return src;
    }

    ctx.putImageData(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.92),
    );
    if (!blob) {
      cache.set(src, src);
      return src;
    }
    const url = URL.createObjectURL(blob);
    cache.set(src, url);
    return url;
  } catch {
    return src;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img load failed"));
    img.src = src;
  });
}

/** Apply dematte to a single img (re-runs when src path changes). */
export function dematteArtImg(img: HTMLImageElement): void {
  const src = img.getAttribute("src") || img.currentSrc || img.src;
  if (!src || src.startsWith("blob:") || src.startsWith("data:")) return;
  // Battle stills ship with real alpha; dematte eats dark costume holes.
  if (
    img.hasAttribute("data-still-front") ||
    /\/art\/(?:monster|summoner)\/battle\//.test(src)
  ) {
    return;
  }
  if (img.dataset.dematteSrc === src) return;
  img.dataset.dematteSrc = src;
  void dematteBlackSrc(src).then((next) => {
    if (!next || next === src) return;
    // Only swap if this img still wants the same logical source.
    if (img.dataset.dematteSrc === src) img.src = next;
  });
}

/** Apply dematte to all matching imgs under root (in place). */
export function dematteArtInTree(
  root: ParentNode,
  selector = "img.mon-preview-img, img.mon-inspect-art-img, img.mon-slot-img, img.battle-unit-img, img.party-slot-art, img.party-card-img, img.summon-multi-img, img.summon-reveal-img, img.stage-prep-inv-img, img.stage-prep-slot-img, img.codex-cell-img, img.codex-detail-img",
): void {
  root.querySelectorAll<HTMLImageElement>(selector).forEach(dematteArtImg);
}
