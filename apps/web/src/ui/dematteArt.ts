/** Punch near-black matte pixels to alpha so monster WebPs sit on transparent UI. */

const cache = new Map<string, string>();

function isNearBlack(r: number, g: number, b: number, lim = 18): boolean {
  return r <= lim && g <= lim && b <= lim;
}

/**
 * Load an image URL, convert near-black backdrop to transparency, return a blob URL.
 * Falls back to the original src on failure / CORS / already-transparent assets.
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

    let punched = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] ?? 255;
      if (a < 8) continue;
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;
      if (isNearBlack(r, g, b)) {
        d[i + 3] = 0;
        punched += 1;
      } else if (r < 34 && g < 34 && b < 34) {
        // Soft edge: fade dark fringe instead of hard cut.
        const lum = (r + g + b) / 3;
        d[i + 3] = Math.round(a * (lum / 34));
        punched += 1;
      }
    }

    // Skip rewrite if almost nothing was punched (true alpha art).
    if (punched < (w * h) / 80) {
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

/** Apply dematte to all matching imgs under root (in place). */
export function dematteArtInTree(
  root: ParentNode,
  selector = "img.mon-preview-img, img.mon-inspect-art-img, img.mon-slot-img, img.battle-unit-img",
): void {
  root.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!src || img.dataset.dematte === "1") return;
    img.dataset.dematte = "1";
    void dematteBlackSrc(src).then((next) => {
      if (next && next !== src) img.src = next;
    });
  });
}
