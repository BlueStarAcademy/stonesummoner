import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mountApi } from "./server/api.mjs";
import { createStore } from "./server/store.mjs";
import {
  PUBLIC_FILE_CACHE_CONTROL,
  cacheControlForAssetPath,
} from "./server/staticCache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load KEY=VALUE from .env without overriding existing process.env. */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, "../../.env"));

const dist = path.join(__dirname, "dist");
const port = Number(process.env.PORT) || 8080;

const store = await createStore();
if (
  store.mode === "memory" &&
  (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production")
) {
  console.error(
    "[store] DATABASE_URL missing — sessions/saves are ephemeral. " +
      "On Railway: add PostgreSQL and link DATABASE_URL to this service.",
  );
}
const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
mountApi(app, store);

app.use(
  express.static(dist, {
    etag: true,
    lastModified: true,
    index: false,
    setHeaders(res, filePath) {
      if (process.env.NODE_ENV !== "production") {
        res.setHeader("Cache-Control", "no-store");
        return;
      }
      res.setHeader(
        "Cache-Control",
        cacheControlForAssetPath(filePath) ?? PUBLIC_FILE_CACHE_CONTROL,
      );
    },
  }),
);
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.setHeader("Cache-Control", cacheControlForAssetPath("/index.html"));
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`StoneSummoner PWA+API on :${port} (store=${store.mode})`);
});
