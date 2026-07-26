/**
 * Build unique Hangul string inventory from HEAD main.ts for i18n migration.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  cwd: root,
}).replace(/\r\n/g, "\n");

const cur = fs
  .readFileSync(path.join(root, "apps/web/src/main.ts"), "utf8")
  .replace(/\r\n/g, "\n");

/** Extract "..." and '...' and simple `...` without ${} that contain Hangul */
function extractHangulStrings(src) {
  const out = new Map();
  const re = /(["'])((?:\\.|(?!\1).)*?)\1|`((?:\\`|\\\$|[^`$]|\$(?!\{))*)`/gs;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[2] ?? m[3];
    if (!raw || !/[\uac00-\ud7a3]/.test(raw)) continue;
    if (raw.includes("${")) continue;
    let decoded;
    try {
      decoded = JSON.parse(`"${raw.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`);
    } catch {
      decoded = raw
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");
    }
    if (!/[\uac00-\ud7a3]/.test(decoded)) continue;
    if (decoded.length > 200) continue;
    out.set(decoded, (out.get(decoded) || 0) + 1);
  }
  return out;
}

function extractUnicodeHangul(src) {
  const out = new Map();
  const re = /"((?:\\u[0-9A-Fa-f]{4}|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(src))) {
    if (!/\\u/i.test(m[1])) continue;
    try {
      const decoded = JSON.parse(`"${m[1]}"`);
      if (/[\uac00-\ud7a3]/.test(decoded) && decoded.length <= 200) {
        out.set(decoded, (out.get(decoded) || 0) + 1);
      }
    } catch {
      /* skip */
    }
  }
  return out;
}

const fromHead = extractHangulStrings(head);
const fromCurU = extractUnicodeHangul(cur);

const all = new Map([...fromHead, ...fromCurU]);

function slug(s) {
  const h = crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
  return h;
}

const catalog = [...all.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
  .map(([ko, n]) => ({
    key: `ui.${slug(ko)}`,
    ko,
    n,
  }));

fs.writeFileSync(
  path.join(root, "scripts/_hangul-catalog.json"),
  JSON.stringify({ count: catalog.length, catalog }, null, 2),
  "utf8",
);
console.log("unique hangul strings:", catalog.length);
console.log("sample:", catalog.slice(0, 15).map((c) => c.ko));
