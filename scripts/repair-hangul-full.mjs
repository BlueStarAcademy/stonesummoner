/**
 * Full Hangul repair for apps/web/src/main.ts
 * Cause: some editor tools rewrite the file as legacy encoding and
 * replace unmappable UTF-8 Hangul bytes with ASCII '?'.
 * Fix: only write via Node fs.writeFileSync(..., 'utf8').
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { transformSync } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const homeBackup = path.join(root, "apps/web/scripts/_verify_renderhome.txt");

const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "buffer",
  maxBuffer: 20 * 1024 * 1024,
})
  .toString("utf8")
  .replace(/\r\n/g, "\n");

let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");

function asciiKey(s) {
  return s.replace(/[\uac00-\ud7a3\u0080-\uffff?·—–…\uFFFD]/g, "");
}

function replaceFn(src, name, next) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return src;
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) {
        return src.slice(0, start) + next + src.slice(i + 1);
      }
    }
  }
  return src;
}

// 1) restore renderHome from known-good backup
const homeSrc = fs.readFileSync(homeBackup, "utf8").replace(/\r\n/g, "\n");
const homeFnMatch = homeSrc.match(/^function renderHome\(\): string \{[\s\S]*?\n\}\n/);
if (!homeFnMatch) {
  console.error("renderHome backup parse failed");
  process.exit(1);
}
cur = replaceFn(cur, "renderHome", homeFnMatch[0].trimEnd());
console.log("restored renderHome from backup");

// 2) HEAD line restore by ASCII skeleton
const headMap = new Map();
for (const l of head.split("\n")) {
  if (!/[\uac00-\ud7a3]/.test(l)) continue;
  const k = asciiKey(l.trim());
  if (k.length >= 6) headMap.set(k, l);
}
let fromHead = 0;
cur = cur
  .split("\n")
  .map((l) => {
    if (!/\?{2,}/.test(l)) return l;
    const h = headMap.get(asciiKey(l.trim()));
    if (!h) return l;
    const curH = (l.match(/[\uac00-\ud7a3]/g) || []).length;
    const headH = (h.match(/[\uac00-\ud7a3]/g) || []).length;
    if (headH > curH) {
      fromHead++;
      return h;
    }
    return l;
  })
  .join("\n");
console.log("restored lines from HEAD", fromHead);

// 3) Explicit high-value UI string fixes (current working-tree strings)
const pairs = [
  [/title="\?{2,}"/g, null], // handled below more specifically
];

const exact = [
  ['title="???"', 'title="행동력"'],
  ['title="??"', 'title="골드"'],
  ['title="????"', 'title="크리스탈"'],
  ['aria-label="?? ??"', 'aria-label="주요 재화"'],
  ['aria-label="?? ??"', 'aria-label="기타 재화"'],
  ['title="?? ???"', 'title="일반 소환서"'],
  ['title="?? ???"', 'title="고급 소환서"'],
  ['title="??/?? ???"', 'title="신성/심연 소환서"'],
  ['title="??"', 'title="영광"'],
  ['title="???"', 'title="진문석"'],
  ['title="??"', 'title="기여"'],
  ['title="???"', 'title="시즌승"'],
  ['aria-label="?? ??"', 'aria-label="설정 닫기"'],
  [">????</button>", ">로그아웃</button>"],
  ['id="settings-title">??</h2>', 'id="settings-title">설정</h2>'],
  ['id="summoner-picker-title">??? ??</h2>', 'id="summoner-picker-title">서머너 변경</h2>'],
  [
    "속성별 서머너를 선택해 육성하세요",
    "속성별 서머너를 선택해 육성하세요",
  ],
];

// More reliable: targeted regex replacements with unique ASCII context
const regexFixes = [
  [
    /aria-label="\?{2,} \$\{userExp\}\/100"/g,
    'aria-label="경험치 ${userExp}/100"',
  ],
  [
    /title="\$\{resMoreOpen \? "[^"]*" : "[^"]*"\}"/g,
    'title="${resMoreOpen ? "재화 접기" : "다른 재화 보기"}"',
  ],
  [
    /aria-label="\$\{resMoreOpen \? "[^"]*" : "[^"]*"\}"/g,
    'aria-label="${resMoreOpen ? "재화 접기" : "다른 재화 보기"}"',
  ],
  [/title="행동력"|title="\?{2,}"(?=[^>]*>[\s\S]*?energy\.svg)/g, 'title="행동력"'],
  [
    /<div class="res-item res-item--energy" title="[^"]*"/g,
    '<div class="res-item res-item--energy" title="행동력"',
  ],
  [
    /<div class="res-wallet" role="group" aria-label="[^"]*"/g,
    '<div class="res-wallet" role="group" aria-label="주요 재화"',
  ],
  [
    /<div class="res-item res-item--gold" title="[^"]*"/g,
    '<div class="res-item res-item--gold" title="골드"',
  ],
  [
    /<div class="res-item res-item--crystal" title="[^"]*"/g,
    '<div class="res-item res-item--crystal" title="크리스탈"',
  ],
  [
    /id="res-more-panel" role="region" aria-label="[^"]*"/g,
    'id="res-more-panel" role="region" aria-label="기타 재화"',
  ],
  [
    /<div class="res-item res-item--scroll" title="[^"]*">\s*<img class="res-ico" src="\/art\/ui\/res\/scroll\.svg"[\s\S]*?<small>일<\/small>/,
    `<div class="res-item res-item--scroll" title="일반 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(scrollCount(save, "normal"))}<small>일</small>`,
  ],
  [
    /<div class="res-item res-item--scroll" title="[^"]*">\s*<img class="res-ico" src="\/art\/ui\/res\/scroll\.svg"[\s\S]*?<small>고<\/small>/,
    `<div class="res-item res-item--scroll" title="고급 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(scrollCount(save, "premium"))}<small>고</small>`,
  ],
  [
    /<div class="res-item res-item--scroll" title="[^"]*">\s*<img class="res-ico" src="\/art\/ui\/res\/scroll\.svg"[\s\S]*?<small>신<\/small>/,
    `<div class="res-item res-item--scroll" title="신성/심연 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(scrollCount(save, "mystic"))}<small>신</small>`,
  ],
  [
    /<div class="res-item res-item--glory" title="[^"]*"/g,
    '<div class="res-item res-item--glory" title="영광"',
  ],
  [
    /<div class="res-item res-item--jinmun" title="[^"]*"/g,
    '<div class="res-item res-item--jinmun" title="진문석"',
  ],
  [
    /<div class="res-item res-item--guild" title="[^"]*"/g,
    '<div class="res-item res-item--guild" title="기여"',
  ],
  [
    /<div class="res-item res-item--arena" title="[^"]*"/g,
    '<div class="res-item res-item--arena" title="시즌승"',
  ],
  [
    /id="btn-settings-close" aria-label="[^"]*"/g,
    'id="btn-settings-close" aria-label="설정 닫기"',
  ],
  [
    /id="settings-title">[^<]*<\/h2>/g,
    'id="settings-title">설정</h2>',
  ],
  [
    /id="btn-logout">[^<]*<\/button>/g,
    'id="btn-logout">로그아웃</button>',
  ],
  [
    /id="btn-summoner-picker-close" aria-label="[^"]*"/g,
    'id="btn-summoner-picker-close" aria-label="서머너 선택 닫기"',
  ],
  [
    /id="summoner-picker-title">[^<]*<\/h2>/g,
    'id="summoner-picker-title">서머너 변경</h2>',
  ],
  [
    /<p class="settings-account">[^$<]*<\/p>\s*<div class="summoner-picker-list">/,
    '<p class="settings-account">속성별 서머너를 선택해 육성하세요</p>\n        <div class="summoner-picker-list">',
  ],
  [
    /label: "\?{2,}"/g,
    'label: "돌아가기"',
  ],
  [
    /<p class="result-kicker">[^<]*<\/p>/g,
    '<p class="result-kicker">전투 결과</p>',
  ],
  [
    /return "\?{2,}";/g,
    'return "모험가";',
  ],
  [
    /\? "\?{2,}"/g,
    '? "데모"',
  ],
  [
    /flash\(`\$\{SUMMONER_ELEMENT_LABEL\[el\]\}[^`]*`\)/g,
    "flash(`${SUMMONER_ELEMENT_LABEL[el]} 서머너로 전환`)",
  ],
];

for (const [re, rep] of regexFixes) {
  const before = cur;
  cur = cur.replace(re, rep);
  if (cur !== before) console.log("applied", String(re).slice(0, 60));
}

// ticker + renderTicker always rewrite (safe)
const tickerFn = `function tickerMessages(): string[] {
  const active = getActiveSummoner(save);
  const el = save.activeSummoner ?? "light";
  const energy = Math.floor(save.island.energy);
  const energyMax = save.island.energyMax ?? 100;
  const lines = [
    "신비의마법석 · 섬을 드래그해 시설을 둘러보세요",
    \`\${SUMMONER_ELEMENT_LABEL[el]} 서머너 Lv.\${active.level} 육성 중\`,
    \`행동력 \${energy}/\${energyMax} · 출정문으로 전투에 나서세요\`,
    \`소환서 \${totalScrollCount(save)}장 · 소환진에서 동료를 불러내세요\`,
  ];
  if ((save.gloryPoints ?? 0) > 0) {
    lines.push(\`영광 \${save.gloryPoints} · 영광 건물에서 보너스를 강화하세요\`);
  }
  if (save.island.summonerLevel < 7) {
    lines.push("서머너 Lv.7에 소원의 사당이 해금됩니다");
  } else if (save.island.summonerLevel < 8) {
    lines.push("서머너 Lv.8에 마법진 도장이 해금됩니다");
  }
  return lines;
}`;

const renderTickerFn = `function renderTicker(): string {
  const items = tickerMessages().map((m) => escapeHtml(m));
  const joined = items.join("　　·　　");
  return \`<div class="ticker" role="marquee" aria-label="공지 전광판">
    <div class="ticker-fade" aria-hidden="true"></div>
    <div class="ticker-track">
      <span class="ticker-text">\${joined}</span>
      <span class="ticker-text" aria-hidden="true">\${joined}</span>
    </div>
  </div>\`;
}`;

cur = replaceFn(cur, "tickerMessages", tickerFn);
cur = replaceFn(cur, "renderTicker", renderTickerFn);

// mail items
cur = cur.replace(
  /const mailItems = \[[\s\S]*?\];/,
  `const mailItems = [
    { title: "모험가 환영 선물", body: "신비의마법석에 오신 것을 환영합니다. 소환서와 마나를 확인하세요.", tag: "시스템" },
    { title: "일일 접속 보너스", body: "오늘도 섬을 둘러보고 출정문에 도전해 보세요.", tag: "보상" },
  ];`,
);

// Ensure bottom tabs / side quick still Korean
const must = [
  "전투",
  "몬스터",
  "미션",
  "커뮤니티",
  "상점",
  "설정",
  "우편함",
  "알림",
  "소환진",
  "출정문",
  "진액 연못",
  "마법상점",
  "행동력",
  "골드",
  "크리스탈",
  "로그아웃",
];

fs.writeFileSync(mainPath, cur, "utf8");

try {
  transformSync(cur, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error("esbuild FAIL", e.message);
  process.exit(1);
}

const hangul = (cur.match(/[\uac00-\ud7a3]/g) || []).length;
const bad = cur.split("\n").filter((l) => /\?\?\?/.test(l) && !/localStorage/.test(l));
console.log("hangul", hangul);
console.log("still ??? lines", bad.length);
bad.slice(0, 25).forEach((l, i) => console.log(i, l.trim().slice(0, 120)));
for (const k of must) console.log(k, cur.includes(k));
