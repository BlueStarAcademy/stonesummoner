/**
 * Encoding / Hangul corruption gate.
 *
 * Rules (post i18n migration):
 * 1. apps/web/src/main.ts must have ZERO Hangul and ZERO suspicious ??? UI strings
 * 2. apps/web/src/i18n/messages/ko.ts must retain Hangul (message source of truth)
 * 3. Scan apps/ and packages/ TS sources; fail if a file looks wiped to ??? 
 *
 * Run: node scripts/check-hangul.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function hangulCount(s) {
  return (s.match(/[\uac00-\ud7a3]/g) || []).length;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

function suspiciousUiLines(src) {
  return src
    .split(/\r?\n/)
    .map((l, i) => [i + 1, l])
    .filter(([, l]) => {
      // Proper "..." / '...' literals only (not spanning between t('a') ... t('b'))
      const re = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
      let m;
      while ((m = re.exec(l))) {
        const body = m[1] ?? m[2] ?? "";
        if (body.length < 2) continue;
        const q = (body.match(/\?/g) || []).length;
        if (q < 2) continue;
        if (/[\uac00-\ud7a3]/.test(body)) continue;
        // Corrupted Hangul → ??? : mostly question marks / spaces / middots
        if (/^[\s?·.….,!+\-0-9]*$/.test(body) && q >= 2) return true;
        if (q >= 3 && q / body.length >= 0.35) return true;
      }
      // HTML text that is only ???
      if (/>\s*\?{2,}[\s?·.…]*\s*</.test(l)) return true;
      return false;
    });
}

let failed = false;

const mainPath = path.join(root, "apps/web/src/main.ts");
const main = fs.readFileSync(mainPath, "utf8");
const mainHangul = hangulCount(main);
const mainBad = suspiciousUiLines(main);
console.log("main.ts hangul:", mainHangul);
console.log("main.ts suspicious ??? UI lines:", mainBad.length);
if (mainHangul > 0) {
  console.error("FAIL: apps/web/src/main.ts must not contain Hangul literals (use t() / i18n)");
  failed = true;
}
if (mainBad.length > 0) {
  console.error("FAIL: apps/web/src/main.ts has corrupted ??? UI strings");
  mainBad.slice(0, 15).forEach(([n, l]) =>
    console.error(n + ":", l.trim().slice(0, 120)),
  );
  failed = true;
}

const koPath = path.join(root, "apps/web/src/i18n/messages/ko.ts");
const ko = fs.readFileSync(koPath, "utf8");
const koHangul = hangulCount(ko);
console.log("ko.ts hangul:", koHangul);
if (koHangul < 200) {
  console.error(
    "FAIL: apps/web/src/i18n/messages/ko.ts Hangul too low — message pack likely corrupted",
  );
  failed = true;
}

const scanRoots = [path.join(root, "apps"), path.join(root, "packages")];
const skip = new Set([
  path.normalize(mainPath),
  // generated verify dumps etc. under scripts not scanned
]);
let repoBad = 0;
for (const r of scanRoots) {
  for (const file of walk(r)) {
    if (skip.has(path.normalize(file))) continue;
    if (file.includes(`${path.sep}dist${path.sep}`)) continue;
    if (file.includes(`${path.sep}scripts${path.sep}_`)) continue;
    const src = fs.readFileSync(file, "utf8");
    // Only flag files that look like Hangul was wiped (many ??? strings, almost no Hangul)
    const h = hangulCount(src);
    const bad = suspiciousUiLines(src);
    if (bad.length >= 8 && h < 20) {
      console.error(
        `FAIL: likely encoding corruption in ${path.relative(root, file)} (???=${bad.length}, hangul=${h})`,
      );
      bad.slice(0, 5).forEach(([n, l]) =>
        console.error(" ", n + ":", l.trim().slice(0, 100)),
      );
      repoBad++;
      failed = true;
    }
  }
}
console.log("repo corruption hits:", repoBad);

if (failed) process.exit(1);
console.log("OK");
