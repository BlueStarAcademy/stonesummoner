/**
 * Run Photoshop JSX to export transparent PNGs from plate-painted sources.
 *
 * Requires Adobe Photoshop + PHOTOSHOP_EXE or auto-detect under Program Files.
 *
 * Usage:
 *   node scripts/run-photoshop-transparent.mjs --families wolf_fighter
 *   node scripts/run-photoshop-transparent.mjs --families wolf_fighter --plate magenta
 *   node scripts/run-photoshop-transparent.mjs --input assets/monster/battle --output assets/monster/battle-transparent
 *
 * After export, install:
 *   npm run monster-art:sync -- --families wolf_fighter
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { artKeysForFamilies } from "./lib/monster-art-roster.mjs";
import { nodePlateToTransparentPng } from "./photoshop/node-plate-to-transparent.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const familiesArg = argVal("--families");
const inputArg = argVal("--input");
const outputArg = argVal("--output");
const plateMode = argVal("--plate") || "magenta";

function findPhotoshopExe() {
  if (process.env.PHOTOSHOP_EXE && fs.existsSync(process.env.PHOTOSHOP_EXE)) {
    return process.env.PHOTOSHOP_EXE;
  }
  const roots = [
    process.env["ProgramFiles"],
    process.env["ProgramFiles(x86)"],
    path.join(process.env.LOCALAPPDATA || "", "Programs"),
  ].filter(Boolean);
  const cs6 = path.join(
    process.env["ProgramFiles"] || "C:\\Program Files",
    "Adobe",
    "Adobe Photoshop CS6 (64 Bit)",
    "Photoshop.exe",
  );
  if (fs.existsSync(cs6)) return cs6;
  const years = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];
  for (const base of roots) {
    for (const year of years) {
      const p = path.join(base, "Adobe", `Adobe Photoshop ${year}`, "Photoshop.exe");
      if (fs.existsSync(p)) return p;
    }
    const adobe = path.join(base, "Adobe");
    if (fs.existsSync(adobe)) {
      for (const name of fs.readdirSync(adobe)) {
        if (!/Photoshop/i.test(name)) continue;
        const p = path.join(adobe, name, "Photoshop.exe");
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null;
}

async function copyFamilySources(artKeys, srcDir, stagingDir) {
  fs.mkdirSync(stagingDir, { recursive: true });
  let n = 0;
  for (const artKey of artKeys) {
    for (const tag of ["", "-awaken"]) {
      const base = `${artKey}${tag}-front`;
      let copied = false;
      for (const ext of [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".psd"]) {
        const src = path.join(srcDir, base + ext);
        if (!fs.existsSync(src)) continue;
        const dest = path.join(stagingDir, base + ".png");
        fs.copyFileSync(src, dest);
        n += 1;
        copied = true;
        break;
      }
      if (!copied) {
        const webp = path.join(srcDir, base + ".webp");
        if (fs.existsSync(webp)) {
          const dest = path.join(stagingDir, base + ".png");
          await sharp(webp).png().toFile(dest);
          n += 1;
        }
      }
    }
  }
  return n;
}

function photoshopSpawnArgs(psExe, jsxPath) {
  if (/CS\d/i.test(psExe) || /CS6/i.test(path.dirname(psExe))) {
    return [jsxPath];
  }
  return ["-r", jsxPath];
}

function isCs6Photoshop(psExe) {
  return /CS\d/i.test(psExe) || /CS6/i.test(path.dirname(psExe));
}

const psExe = findPhotoshopExe();
if (!psExe) {
  console.error(
    "Photoshop not found. Install Adobe Photoshop or set PHOTOSHOP_EXE to Photoshop.exe",
  );
  process.exit(1);
}

const defaultBattleDir = path.join(root, "assets/monster/battle");
const stagingRoot = path.join(root, "apps/web/public/art/_staging/photoshop-input");
const outputRoot = path.join(root, "assets/monster/battle-transparent");
const logFile = path.join(root, "apps/web/public/art/_staging/photoshop-export.log");
const jsxPath = path.join(root, "scripts/photoshop/export-transparent-batch.jsx");
const configPath = path.join(root, "scripts/photoshop/job-config.json");

let inputDir = inputArg ? path.resolve(root, inputArg) : null;
let outputDir = outputArg ? path.resolve(root, outputArg) : outputRoot;

if (familiesArg) {
  const artKeys = artKeysForFamilies(
    familiesArg.split(",").map((s) => s.trim()).filter(Boolean),
  );
  const stagingDir = path.join(stagingRoot, familiesArg.replace(/,/g, "_"));
  const copied = await copyFamilySources(artKeys, defaultBattleDir, stagingDir);
  if (copied === 0) {
    console.error("no source files in", defaultBattleDir);
    process.exit(1);
  }
  inputDir = stagingDir;
  outputDir = path.join(outputRoot, familiesArg.replace(/,/g, "_"));
}

if (!inputDir || !fs.existsSync(inputDir)) {
  console.error("usage: --families wolf_fighter  OR  --input dir --output dir");
  process.exit(1);
}

fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  configPath,
  JSON.stringify({
    inputDir: inputDir.replace(/\\/g, "/"),
    outputDir: outputDir.replace(/\\/g, "/"),
    plateMode,
    logFile: logFile.replace(/\\/g, "/"),
  }),
  "utf8",
);

console.log("photoshop", psExe);
console.log("input", inputDir);
console.log("output", outputDir);
console.log("plate", plateMode);

if (isCs6Photoshop(psExe)) {
  console.log("CS6: batch plate removal via Node (CS6 JSX color range unsupported)");
  const log = await nodePlateToTransparentPng(inputDir, outputDir, plateMode);
  fs.writeFileSync(logFile, log.join("\n"), "utf8");
  console.log(log.join("\n"));
  if (familiesArg && outputDir.includes("battle-transparent")) {
    for (const line of log) {
      const parts = line.split(" -> ");
      if (parts.length !== 2) continue;
      const srcOut = parts[1].trim();
      const base = path.basename(srcOut);
      const dest = path.join(defaultBattleDir, base);
      fs.copyFileSync(srcOut, dest);
      console.log("installed source", dest);
    }
  }
  console.log("syncing webp...");
  const sync = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts/sync-painted-monster-art.mjs"),
      "--families",
      familiesArg || "",
    ],
    { cwd: root, stdio: "inherit", env: { ...process.env, CURSOR_ASSETS: path.join(root, "assets") } },
  );
  process.exit(sync.status ?? 0);
}

const r = spawnSync(psExe, photoshopSpawnArgs(psExe, jsxPath), {
  cwd: root,
  stdio: "inherit",
});

if (r.status !== 0) {
  console.error("Photoshop JSX failed", r.status);
  process.exit(r.status ?? 1);
}

if (fs.existsSync(logFile)) {
  console.log(fs.readFileSync(logFile, "utf8"));
}

console.log("done. Copy transparent PNGs to assets/monster/battle/ then:");
console.log("  npm run monster-art:sync -- --families", familiesArg || "<family>");
