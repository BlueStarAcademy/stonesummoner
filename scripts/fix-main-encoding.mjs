import { execSync } from "child_process";
import fs from "fs";

const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
}).replace(/\r\n/g, "\n");
let cur = fs.readFileSync("apps/web/src/main.ts", "utf8").replace(/\r\n/g, "\n");

function asciiKey(s) {
  return s.replace(/[\uac00-\ud7a3\u0080-\uffff?·—–…\uFFFD]/g, "");
}

function buildMap(minLen) {
  const byKey = new Map();
  for (const l of head.split("\n")) {
    if (!/[\uac00-\ud7a3]/.test(l)) continue;
    const k = asciiKey(l);
    if (k.length < minLen) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(l);
  }
  return byKey;
}

let total = 0;
for (const minLen of [20, 12, 8, 5]) {
  const byKey = buildMap(minLen);
  let replaced = 0;
  cur = cur
    .split("\n")
    .map((l) => {
      if (!/\?\?\?/.test(l)) return l;
      const k = asciiKey(l);
      const cands = byKey.get(k);
      if (!cands?.length) return l;
      // Prefer candidate with similar length
      const best =
        cands.find((c) => Math.abs(c.length - l.length) <= 8) ?? cands[0];
      replaced++;
      return best;
    })
    .join("\n");
  total += replaced;
  console.log("pass", minLen, "replaced", replaced);
}

// Manual known expedition / UI strings still corrupted
const manual = [
  [/label: "\?\?\?\?\?"/g, 'label: "돌아가기"'],
  [/return "\?\?\?\?\?";/g, 'return "체험 계정";'],
  [/return "\?\?\?";\n/g, 'return "게스트";\n'],
  [/return "\?\?\?";/g, 'return "모험가";'],
  [/aria-label="\?\? \?\?\?"/g, 'aria-label="공지 전광판"'],
  [/\.join\("\?\?\?\?\?"\)/g, '.join("　　·　　")'],
  [/title="\?\?\?"/g, 'title="에너지"'],
  [/title="\?\?\?\?"/g, 'title="크리스탈"'],
  [/title="\?\? \?\?\?"/g, 'title="소환 스크롤"'],
  [/title="\?\?\?\?"/g, 'title="진문석"'],
  [/settings-logout"[^>]*>\?\?\?\?</g, 'settings-logout" id="btn-logout">로그아웃</'],
];

// Safer targeted replacements for common island spots from HEAD
const headSpot = (name) => {
  const re = new RegExp(`spot\\([^\\n]*${name}[^\\n]*\\)`);
  const m = head.match(re);
  return m?.[0];
};

fs.writeFileSync("apps/web/src/main.ts", cur, "utf8");

// Second pass: replace corrupted string literals by looking up identical
// surrounding ASCII function context from HEAD for short strings
const headLines = head.split("\n");
const curLines = cur.split("\n");
const headByTrimAscii = new Map();
for (const l of headLines) {
  const k = asciiKey(l.trim());
  if (k.length >= 4 && /[\uac00-\ud7a3]/.test(l)) {
    if (!headByTrimAscii.has(k)) headByTrimAscii.set(k, l);
  }
}
let short = 0;
const merged = curLines.map((l) => {
  if (!/\?\?/.test(l)) return l;
  const k = asciiKey(l.trim());
  const h = headByTrimAscii.get(k);
  if (!h) return l;
  // Only replace if current looks more corrupted
  const curHangul = (l.match(/[\uac00-\ud7a3]/g) || []).length;
  const headHangul = (h.match(/[\uac00-\ud7a3]/g) || []).length;
  if (headHangul > curHangul) {
    short++;
    return h;
  }
  return l;
});
cur = merged.join("\n");

// Fix remaining obvious labels
cur = cur.replace(
  /if \(sessionUser\?\.kind === "demo"\) return "[^"]*";/,
  'if (sessionUser?.kind === "demo") return "체험 계정";',
);
cur = cur.replace(
  /if \(sessionUser\?\.kind === "guest"\) return "[^"]*";/,
  'if (sessionUser?.kind === "guest") return "게스트";',
);

fs.writeFileSync("apps/web/src/main.ts", cur, "utf8");
console.log("short", short);
console.log("hangul", (cur.match(/[\uac00-\ud7a3]/g) || []).length);
console.log(
  "corrupted lines",
  cur.split("\n").filter((l) => /\?\?\?/.test(l)).length,
);

try {
  const esbuild = await import("esbuild");
  esbuild.transformSync(cur, { loader: "ts", target: "esnext" });
  console.log("esbuild OK");
} catch (e) {
  console.error("esbuild fail", e.message);
}
