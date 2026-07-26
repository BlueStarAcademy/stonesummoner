/**
 * Fix nested-quote breakage from t("ui...") inside "...", and
 * restore remaining ??? HTML text from HEAD then migrate again.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { transformSync } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const extraPath = path.join(root, "apps/web/src/i18n/ui-extra.json");

let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));

function keyFor(ko) {
  return `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
}
function ensureKey(ko, en = ko) {
  const key = keyFor(ko);
  if (!extra[key]) extra[key] = { ko, en };
  return key;
}

// 1) Use single quotes for t('ui...') keys everywhere to avoid nested " breaks
cur = cur.replace(/t\("ui\.([a-f0-9]+)"\)/g, "t('ui.$1')");
cur = cur.replace(/t\("ui\.([a-f0-9]+)",/g, "t('ui.$1',");

// 2) Fix specific broken aria-label pattern
cur = cur.replace(
  /aria-label="\$\{r\.name\}\$\{prog\.unlocked \? "" : " · \$\{t\('ui\.([a-f0-9]+)'\)\}"\}"/g,
  (_m, id) =>
    `aria-label="\${r.name}\${prog.unlocked ? \"\" : \` · \${t('ui.${id}')}\`}"`,
);

// 3) Restore ??? lines from HEAD by ascii key (again, for HTML leftovers)
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  cwd: root,
}).replace(/\r\n/g, "\n");

function asciiKey(s) {
  return s.replace(/[\uac00-\ud7a3\u0080-\uffff?·—–…\uFFFD]/g, "");
}

const headMap = new Map();
for (const line of head.split("\n")) {
  if (!/[\uac00-\ud7a3]/.test(line)) continue;
  const k = asciiKey(line);
  if (k.length < 8) continue;
  if (!headMap.has(k)) headMap.set(k, line);
}

const lines = cur.split("\n");
let restored = 0;
for (let i = 0; i < lines.length; i++) {
  if (!/\?{2,}/.test(lines[i])) continue;
  const k = asciiKey(lines[i]);
  const h = headMap.get(k);
  if (!h) continue;
  const indent = lines[i].match(/^\s*/)[0];
  lines[i] = indent + h.trimStart();
  restored++;
}
cur = lines.join("\n");
console.log("restored ??? lines from HEAD:", restored);

// 4) Migrate any newly restored Hangul phrases (same as pass2)
const PHRASE_RE =
  /[\uac00-\ud7a3][\uac00-\ud7a3A-Za-z0-9\s·./+\-%°I×〜~、，]*[\uac00-\ud7a3]|[\uac00-\ud7a3]+/g;

function hangulCount(s) {
  return (s.match(/[\uac00-\ud7a3]/g) || []).length;
}

const phrases = new Set();
let m;
const re = new RegExp(PHRASE_RE.source, "g");
while ((m = re.exec(cur))) phrases.add(m[0]);
const sorted = [...phrases].sort((a, b) => b.length - a.length);
let n = 0;
for (const phrase of sorted) {
  let idx = 0;
  while ((idx = cur.indexOf(phrase, idx)) !== -1) {
    const slice = cur.slice(Math.max(0, idx - 30), idx);
    if (/t\('ui\.[a-f0-9]*$/.test(slice) || /t\("ui\.[a-f0-9]*$/.test(slice)) {
      idx += phrase.length;
      continue;
    }
    const lineStart = cur.lastIndexOf("\n", idx) + 1;
    if (cur.slice(lineStart, idx).trimStart().startsWith("//")) {
      idx += phrase.length;
      continue;
    }
    const key = ensureKey(phrase.trim());
    const head = cur.slice(0, idx);
    const inTemplate = ((head.match(/`/g) || []).length) % 2 === 1;
    const prev = cur[idx - 1] || "";
    const next = cur[idx + phrase.length] || "";
    let repl;
    if (inTemplate) {
      repl = `\${t('${key}')}`;
    } else if ((prev === '"' && next === '"') || (prev === "'" && next === "'")) {
      repl = `t('${key}')`;
      cur = cur.slice(0, idx - 1) + repl + cur.slice(idx + phrase.length + 1);
      n++;
      idx += repl.length;
      continue;
    } else {
      repl = `t('${key}')`;
    }
    cur = cur.slice(0, idx) + repl + cur.slice(idx + phrase.length);
    n++;
    idx += repl.length;
  }
}
console.log("new phrase replacements:", n);

// Cleanup doubles
cur = cur.replace(/\$\{\$\{t\('ui\.([a-f0-9]+)'\)\}\}/g, "${t('ui.$1')}");
cur = cur.replace(/t\(t\('ui\.([a-f0-9]+)'\)\)/g, "t('ui.$1')");
// Normalize any remaining double-quoted ui keys
cur = cur.replace(/t\("ui\.([a-f0-9]+)"\)/g, "t('ui.$1')");

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
fs.writeFileSync(mainPath, cur, "utf8");

try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild: OK");
} catch (e) {
  const err = e.errors?.[0];
  console.log("esbuild FAIL", err?.text, err?.location);
  if (err?.location) {
    const ls = cur.split("\n");
    const ln = err.location.line;
    for (let i = ln - 2; i <= ln + 1; i++) console.log(`${i}: ${ls[i - 1]}`);
  }
}

console.log({
  hangul: hangulCount(cur),
  qLines: cur.split("\n").filter((l) => /\?\?\?/.test(l)).length,
  extras: Object.keys(extra).length,
});
