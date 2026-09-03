import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { writeWebpAtomic } from "./dematte-webp.mjs";

export const PORTRAIT_DERIVATIVE_SIZES = [128, 256];
export const PORTRAIT_DERIVATIVE_DIR = "inventory";

export function portraitDerivativePath(portraitDir, portraitName, size) {
  return path.join(
    portraitDir,
    PORTRAIT_DERIVATIVE_DIR,
    String(size),
    `${portraitName}.webp`,
  );
}

export async function writePortraitDerivatives(
  srcWebp,
  portraitDir,
  portraitName,
  sizes = PORTRAIT_DERIVATIVE_SIZES,
) {
  const written = [];
  for (const size of sizes) {
    const buffer = await sharp(srcWebp)
      .resize(size, size, {
        fit: "contain",
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toBuffer();
    const dest = portraitDerivativePath(portraitDir, portraitName, size);
    await writeWebpAtomic(dest, buffer);
    written.push(dest);
  }
  return written;
}

export async function inspectPortraitDerivative(filePath, expectedSize, opts = {}) {
  if (!fs.existsSync(filePath)) return { ok: false, issue: "missing" };
  try {
    const meta = await sharp(filePath).metadata();
    if (
      meta.format !== "webp" ||
      meta.width !== expectedSize ||
      meta.height !== expectedSize
    ) {
      return {
        ok: false,
        issue: `size/format=${meta.width ?? "?"}x${meta.height ?? "?"}/${meta.format ?? "?"}`,
      };
    }
    if (!meta.hasAlpha && !opts.allowOpaque) {
      return { ok: false, issue: "missing-alpha" };
    }
    return { ok: true, issue: null };
  } catch (error) {
    return { ok: false, issue: `unreadable=${error.message}` };
  }
}
