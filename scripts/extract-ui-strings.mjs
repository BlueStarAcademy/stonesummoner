/**
 * Extract corrupted ??? UI strings from main.ts and recover Hangul from HEAD.
 * Writes scripts/_ui-string-map.json for migration planning.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const outPath = path.join(root, "scripts/_ui-string-map.json");

const cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  cwd: root,
}).replace(/\r\n/g, "\n");

function asciiKey(s) {
  return s.replace(/[\uac00-\ud7a3\u0080-\uffff?·—–…\uFFFD\s]/g, "");
}

function hangulCount(s) {
  return (s.match(/[\uac00-\ud7a3]/g) || []).length;
}

const headMap = new Map();
for (const line of head.split("\n")) {
  if (!/[\uac00-\ud7a3]/.test(line)) continue;
  const key = asciiKey(line);
  if (key.length < 8) continue;
  if (!headMap.has(key)) headMap.set(key, []);
  headMap.get(key).push(line.trim());
}

const STRING_RE =
  /(["'`])((?:\\.|(?!\1).)*?\?{2,}(?:\\.|(?!\1).)*?)\1|\\u[0-9A-Fa-f]{4}/g;

/** Collect string-ish literals that look corrupted or are \u escapes used for UI */
const findings = [];
const lines = cur.split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const hasQ =
    /\?\?\?/.test(line) &&
    /["'`]/.test(line) &&
    !/localStorage/.test(line);
  const hasU =
    /\\u[A-F0-9]{4}/i.test(line) &&
    /flash\(|aria-label|island-|btn-|title|label|hint|strong>|small>|toast|message/.test(
      line,
    );
  if (!hasQ && !hasU) continue;

  const key = asciiKey(line);
  const recovered = headMap.get(key)?.[0] ?? null;
  findings.push({
    line: i + 1,
    kind: hasQ ? "qmark" : "unicode",
    asciiKey: key.slice(0, 80),
    current: line.trim().slice(0, 200),
    recovered: recovered ? recovered.slice(0, 200) : null,
  });
}

// Also extract unique string literals containing ??? 
const literalSet = new Map();
for (const line of lines) {
  // simple: "....???" or `....???`
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*?\?{2,}(?:\\.|(?!\1)[^\\])*?)\1/g;
  let m;
  while ((m = re.exec(line))) {
    const lit = m[2];
    if (lit.length < 2) continue;
    if (!literalSet.has(lit)) literalSet.set(lit, 0);
    literalSet.set(lit, literalSet.get(lit) + 1);
  }
}

const unicodeLits = [];
const ure =
  /\$\{\s*"((?:\\u[0-9A-Fa-f]{4}|[^"\\])*)"\s*\}|"((?:\\u[0-9A-Fa-f]{4})+(?:\\u[0-9A-Fa-f]{4}|[^"\\])*)"/g;
let um;
while ((um = ure.exec(cur))) {
  const raw = um[1] ?? um[2];
  if (!/\\u/i.test(raw)) continue;
  try {
    const decoded = JSON.parse(`"${raw}"`);
    if (/[\uac00-\ud7a3]/.test(decoded)) {
      unicodeLits.push({ escaped: raw, decoded });
    }
  } catch {
    /* skip */
  }
}

const report = {
  curHangul: hangulCount(cur),
  headHangul: hangulCount(head),
  badLines: findings.filter((f) => f.kind === "qmark").length,
  recoveredLines: findings.filter((f) => f.kind === "qmark" && f.recovered)
    .length,
  unrecovered: findings.filter((f) => f.kind === "qmark" && !f.recovered),
  uniqueQLiterals: [...literalSet.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([lit, n]) => ({ n, lit: lit.slice(0, 120) })),
  unicodeUiLits: [...new Map(unicodeLits.map((u) => [u.decoded, u])).values()],
  sampleFindings: findings.slice(0, 80),
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
console.log(
  JSON.stringify(
    {
      curHangul: report.curHangul,
      headHangul: report.headHangul,
      badLines: report.badLines,
      recoveredLines: report.recoveredLines,
      unrecovered: report.unrecovered.length,
      uniqueQ: report.uniqueQLiterals.length,
      unicodeUi: report.unicodeUiLits.length,
      out: outPath,
    },
    null,
    2,
  ),
);
