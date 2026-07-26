/**
 * Full migration: restore Hangul from HEAD -> extract to i18n extra -> purge main.ts
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const extraPath = path.join(root, "apps/web/src/i18n/ui-extra.json");

const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  cwd: root,
}).replace(/\r\n/g, "\n");

let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");

function asciiKey(s) {
  return s.replace(/[\uac00-\ud7a3\u0080-\uffff?·—–…\uFFFD]/g, "");
}

function hangulCount(s) {
  return (s.match(/[\uac00-\ud7a3]/g) || []).length;
}

function keyFor(ko) {
  return `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
}

// --- 1) Restore Hangul lines from HEAD by ascii skeleton ---
const headByAscii = new Map();
for (const line of head.split("\n")) {
  if (!/[\uac00-\ud7a3]/.test(line)) continue;
  const k = asciiKey(line);
  if (k.length < 6) continue;
  if (!headByAscii.has(k)) headByAscii.set(k, line);
}

const curLines = cur.split("\n");
let restored = 0;
for (let i = 0; i < curLines.length; i++) {
  const line = curLines[i];
  if (!/\?{2,}/.test(line)) continue;
  if (!/["'`]/.test(line)) continue;
  const k = asciiKey(line);
  const h = headByAscii.get(k);
  if (!h) continue;
  // Prefer same indent
  const indent = line.match(/^\s*/)[0];
  const hIndent = h.match(/^\s*/)[0];
  curLines[i] = indent + h.trimStart();
  // If head indent differs but content matches better, use head as-is when lengths close
  if (Math.abs(hIndent.length - indent.length) <= 2) {
    curLines[i] = indent + h.trimStart();
  }
  restored++;
}
cur = curLines.join("\n");
console.log("restored lines from HEAD:", restored);

// --- 2) Decode \uXXXX string literals that contain Hangul escapes ---
cur = cur.replace(/"((?:\\u[0-9A-Fa-f]{4}|[^"\\])*)"/g, (full, body) => {
  if (!/\\u[0-9A-Fa-f]{4}/i.test(body)) return full;
  try {
    const decoded = JSON.parse(`"${body}"`);
    if (!/[\uac00-\ud7a3]/.test(decoded)) return full;
    // Keep as normal UTF-8 string literal for extraction
    return JSON.stringify(decoded);
  } catch {
    return full;
  }
});
// Also ${"\u...."} patterns
cur = cur.replace(/\$\{\s*"((?:\\u[0-9A-Fa-f]{4}|[^"\\])*)"\s*\}/g, (full, body) => {
  if (!/\\u/i.test(body)) return full;
  try {
    const decoded = JSON.parse(`"${body}"`);
    if (!/[\uac00-\ud7a3]/.test(decoded)) return full;
    return JSON.stringify(decoded);
  } catch {
    return full;
  }
});
console.log("after unicode decode hangul:", hangulCount(cur));

// --- 3) Manual patches for known unrecovered / new UI ---
const MANUAL = [
  // island layout
  [
    /flash\("건물 배치 편집 · 드래그로 위치를 옮기세요"\);|flash\("\\uAC74\\uBB3C \\uBC30\\uCE58 \\uD3B8\\uC9D1 \\u00B7 \\uB4DC\\uB798\\uADF8\\uB85C \\uC704\\uCE58\\uB97C \\uC62E\\uAE30\\uC138\\uC694"\);/,
    'flash("건물 배치 편집 · 드래그로 위치를 옮기세요");',
  ],
];

// Known flash / auth messages if still ???
const manualReplacements = [
  { re: /flash\(\s*"\?\?\? \?\?\? \?\?\?\?\?\?\."\s*\)/g, to: 'flash("다시 시도해 주세요.")' },
];

// Broader: replace remaining ???-only string literals with placeholder keys later
// First apply semantic manual map for common short unrecovered based on context lines

const CONTEXT_PATCHES = [
  {
    // auth cloud errors around line 778
    find: /ephemeralStore\s*\?\s*"\?[^"]*"\s*:\s*"\?[^"]*"/,
    replace: `ephemeralStore
        ? "체험 세션은 DB가 없습니다. Railway에 DATABASE_URL(Postgres)을 연결하세요. 그 전엔 로컬만 저장됩니다."
        : "클라우드 동기화에 실패했습니다. 잠시 후 다시 시도하세요. (로컬은 유지됨)"`,
  },
];

for (const p of CONTEXT_PATCHES) {
  if (p.find.test(cur)) {
    cur = cur.replace(p.find, p.replace);
    console.log("applied context patch");
  }
}

// Patch remaining obvious ??? strings that are whole-string literals by length/context
// Read unrecovered from extract - apply a curated map of ascii-ish patterns

const CURATED = {
  // exact corrupted literals -> hangul
  "??? ??? ??????.": "다시 시도해 주세요.",
  "???? ??????.": "저장에 실패했습니다.",
  "????????. ????? ?? ???.": "로그아웃되었습니다. 다음에 또 만나요.",
  "???": "없음",
  "?? ?? ? ?? ?? (??? +1)": "일일 소원으로 소환서 획득 (일반 +1)",
  "??? ??": "스테이지 선택",
  "???": "수동",
};

// Don't use curated blindly for short "???" - too ambiguous

// --- 4) Collect clean Hangul string literals ---
function collectStrings(src) {
  const found = new Map(); // ko -> count
  const re = /(["'])((?:\\.|(?!\1).)*?)\1/g;
  let m;
  while ((m = re.exec(src))) {
    let raw = m[2];
    let decoded;
    try {
      decoded = JSON.parse(`"${raw}"`);
    } catch {
      continue;
    }
    if (!/[\uac00-\ud7a3]/.test(decoded)) continue;
    if (decoded.includes("\n") || decoded.includes("<")) continue;
    if (decoded.length > 120 || decoded.length < 1) continue;
    // skip if mostly punctuation
    if (hangulCount(decoded) < 1) continue;
    found.set(decoded, (found.get(decoded) || 0) + 1);
  }
  return found;
}

const collected = collectStrings(cur);
console.log("clean hangul literals:", collected.size);

// --- 5) Build extra catalog with EN approximations (functional English) ---
/** Simple EN map for common labels; fallback: keep Korean with [KO] stripped - use literal English gloss */
function toEn(ko) {
  const map = {
    돌아가기: "Back",
    데모: "Demo",
    대기: "Idle",
    "대기 없음": "None waiting",
    "데모 모드로 입장했습니다.": "Entered demo mode.",
    모험가: "Adventurer",
    소환진: "Summon Circle",
    수동: "Manual",
    "수정 광맥": "Crystal Vein",
    "이전 스테이지를 먼저 클리어하세요.": "Clear the previous stage first.",
    "일반 진문": "Normal gate",
    "최대 레벨": "Max level",
    "건물 배치 편집": "Layout edit",
    "건물 배치 편집 · 드래그로 위치를 옮기세요":
      "Layout edit · Drag buildings to move them",
    "드래그로 건물 위치를 옮기세요": "Drag to move buildings",
    초기화: "Reset",
    완료: "Done",
    "건물 배치를 저장했습니다": "Building layout saved",
    "배치 편집을 취소했습니다": "Layout edit cancelled",
    "기본 배치로 돌려놓았습니다": "Restored default layout",
    "배치 가능 구역": "Buildable area",
    해금: "Unlock",
    소환서: "Scroll",
    장: "",
    "레벨 · 각성 · 장비": "Level · Awaken · Gear",
    "시나리오 · 아레나": "Scenario · Arena",
    "소환서 · 연마 · 각인": "Scrolls · Polish · Engrave",
    "일 1회 소원": "Daily wish ×1",
    수련: "Drill",
    회: "",
    대기: "Stored",
    영광: "Glory",
    "가입·출석": "Join · Attend",
    "동일종 융합": "Same-species fusion",
    "클라우드 동기화에 실패했습니다. 잠시 후 다시 시도하세요. (로컬은 유지됨)":
      "Cloud sync failed. Try again later. (Local save kept)",
    "체험 세션은 DB가 없습니다. Railway에 DATABASE_URL(Postgres)을 연결하세요. 그 전엔 로컬만 저장됩니다.":
      "Trial session has no DB. Set DATABASE_URL (Postgres) on Railway. Until then only local saves.",
  };
  if (map[ko]) return map[ko];
  // Fallback: English placeholder noting Korean source for translators
  return ko;
}

const extra = {};
const koToKey = new Map();
for (const [ko] of [...collected.entries()].sort((a, b) => b[0].length - a[0].length)) {
  const key = keyFor(ko);
  koToKey.set(ko, key);
  extra[key] = { ko, en: toEn(ko) };
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
console.log("wrote", Object.keys(extra).length, "extra keys ->", extraPath);

// --- 6) Replace Hangul string literals with t("key") longest-first ---
const sortedKos = [...koToKey.keys()].sort((a, b) => b.length - a.length);
let replaceCount = 0;
for (const ko of sortedKos) {
  const key = koToKey.get(ko);
  const lit = JSON.stringify(ko); // "..."
  const replacement = `t(${JSON.stringify(key)})`;
  // Replace "..." and '...' forms
  const forms = [lit];
  if (!ko.includes("'")) forms.push(`'${ko}'`);
  for (const form of forms) {
    let idx = 0;
    while ((idx = cur.indexOf(form, idx)) !== -1) {
      // skip if already inside t("...")
      const before = cur.slice(Math.max(0, idx - 3), idx);
      if (before.endsWith("t(")) {
        idx += form.length;
        continue;
      }
      cur = cur.slice(0, idx) + replacement + cur.slice(idx + form.length);
      replaceCount++;
      idx += replacement.length;
    }
  }
}
console.log("replacements:", replaceCount);

// --- 7) Remaining Hangul in template literals: convert simple ${"hangul"} already done;
// For leftover Hangul chars, convert remaining quoted fragments
const left = hangulCount(cur);
console.log("remaining hangul chars:", left);

// Dump leftover hangul lines for follow-up
const leftoverLines = cur
  .split("\n")
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => /[\uac00-\ud7a3]/.test(l) || (/\?\?\?/.test(l) && /["'`]/.test(l)));
fs.writeFileSync(
  path.join(root, "scripts/_migrate-leftover.json"),
  JSON.stringify(
    leftoverLines.slice(0, 200).map(([n, l]) => ({ n, l: l.trim().slice(0, 180) })),
    null,
    2,
  ),
  "utf8",
);

fs.writeFileSync(mainPath, cur, "utf8");
console.log("wrote main.ts");
console.log(
  JSON.stringify(
    {
      restored,
      extras: Object.keys(extra).length,
      replaceCount,
      hangulLeft: left,
      leftoverLines: leftoverLines.length,
    },
    null,
    2,
  ),
);
