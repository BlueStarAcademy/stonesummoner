import express from "express";
import fs from "node:fs";
import path from "node:path";

const BUNDLE_PATH = "/app-bundle";

/**
 * Capacitor live update: serves dist-app files and a manifest the native
 * updater uses to fetch only files whose SHA-256 changed.
 */
export function mountAppUpdate(app, distApp) {
  const manifestFile = path.join(distApp, "app-manifest.json");
  let cached = null;
  let cachedMtime = 0;

  const readManifest = () => {
    try {
      const { mtimeMs } = fs.statSync(manifestFile);
      if (!cached || mtimeMs !== cachedMtime) {
        cached = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
        cachedMtime = mtimeMs;
      }
      return cached;
    } catch {
      return null;
    }
  };

  app.get("/api/app-update/latest", (req, res) => {
    const manifest = readManifest();
    if (!manifest?.version || !Array.isArray(manifest.files)) {
      res.status(404).json({ error: "no_app_bundle" });
      return;
    }
    const origin = `${req.protocol}://${req.get("host")}`;
    res.setHeader("Cache-Control", "no-store");
    res.json({
      version: manifest.version,
      manifest: manifest.files.map(([file, hash]) => ({
        file_name: file,
        file_hash: hash,
        download_url: `${origin}${BUNDLE_PATH}/${file
          .split("/")
          .map(encodeURIComponent)
          .join("/")}?h=${hash.slice(0, 16)}`,
      })),
    });
  });

  app.use(
    BUNDLE_PATH,
    express.static(distApp, {
      etag: true,
      index: false,
      setHeaders(res) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );
}
