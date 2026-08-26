/**
 * Node fallback for plate → transparent PNG (CS6 JSX color range is unreliable).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  chromaKeyRgba,
  chromaSpillSuppress,
  processChromaBattleRgba,
  finishDematteRgba,
  featherAlphaEdges,
  zeroClearRgb,
  dematteBuffer,
  TRANSPARENT_BATTLE_INSTALL,
} from "../lib/dematte-webp.mjs";

export async function nodePlateToTransparentPng(inputDir, outputDir, plateMode = "magenta") {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => /\.(png|jpg|jpeg|tif|tiff)$/i.test(f));
  const log = [];
  for (const name of files) {
    const src = path.join(inputDir, name);
    const outName = name.replace(/\.(jpg|jpeg|tif|tiff)$/i, ".png");
    const dst = path.join(outputDir, outName);
    const { data, info } = await sharp(src)
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel?.lanczos3,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const rgba = new Uint8ClampedArray(data);
    const w = info.width;
    const h = info.height;
    if (plateMode === "magenta") {
      chromaKeyRgba(rgba);
      chromaSpillSuppress(rgba, w, h);
    } else if (plateMode === "black") {
      await dematteBuffer(rgba, w, h, 36, { plateOnly: true, plateMax: 0 });
    }
    await processChromaBattleRgba(rgba, w, h, TRANSPARENT_BATTLE_INSTALL);
    await finishDematteRgba(rgba, w, h, TRANSPARENT_BATTLE_INSTALL);
    featherAlphaEdges(rgba, w, h, 2);
    zeroClearRgb(rgba);
    await sharp(Buffer.from(rgba), {
      raw: { width: w, height: h, channels: 4 },
    })
      .png({ compressionLevel: 6 })
      .toFile(dst);
    log.push(`${src} -> ${dst}`);
  }
  return log;
}
