/**
 * Live-update manifest for the Capacitor app bundle (dist-app).
 * Writes app-version.json (read by the running bundle) and app-manifest.json
 * (served by /api/app-update/latest). Version is a content hash, so identical
 * builds never trigger an update.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, process.argv[2] ?? "dist-app");
const MANIFEST = "app-manifest.json";
const VERSION_FILE = "app-version.json";

function walk(dir, base = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

if (!fs.existsSync(outDir)) {
  console.error(`write-app-manifest: missing ${outDir}`);
  process.exit(1);
}

const files = walk(outDir)
  .filter((rel) => rel !== MANIFEST && rel !== VERSION_FILE)
  .sort()
  .map((rel) => [rel, sha256(path.join(outDir, rel))]);

const version = crypto
  .createHash("sha256")
  .update(files.map(([rel, hash]) => `${rel}:${hash}`).join("\n"))
  .digest("hex")
  .slice(0, 16);

fs.writeFileSync(path.join(outDir, VERSION_FILE), `${JSON.stringify({ version })}\n`, "utf8");
files.push([VERSION_FILE, sha256(path.join(outDir, VERSION_FILE))]);

fs.writeFileSync(
  path.join(outDir, MANIFEST),
  `${JSON.stringify({ version, builtAt: new Date().toISOString(), files })}\n`,
  "utf8",
);
console.log(`app manifest ${version}: ${files.length} files`);
