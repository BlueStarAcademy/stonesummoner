import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mountApi } from "./server/api.mjs";
import { createStore } from "./server/store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");
const port = Number(process.env.PORT) || 8080;

const store = await createStore();
const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
mountApi(app, store);

app.use(express.static(dist, { maxAge: "1h", index: false }));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`StoneSummoner PWA+API on :${port} (store=${store.mode})`);
});
