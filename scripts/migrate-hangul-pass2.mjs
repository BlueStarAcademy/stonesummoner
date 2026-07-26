/**
 * Pass 2: migrate leftover Hangul inside templates / HTML text to t().
 * Also fix broken aria-label=""..." patterns and remaining ??? flashes.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = path.join(root, "apps/web/src/main.ts");
const extraPath = path.join(root, "apps/web/src/i18n/ui-extra.json");

let cur = fs.readFileSync(mainPath, "utf8").replace(/\r\n/g, "\n");
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));

function hangulCount(s) {
  return (s.match(/[\uac00-\ud7a3]/g) || []).length;
}

function keyFor(ko) {
  return `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
}

function ensureKey(ko, en) {
  const key = keyFor(ko);
  if (!extra[key]) extra[key] = { ko, en: en ?? ko };
  return key;
}

function toEn(ko) {
  const map = {
    환영합니다: "Welcome",
    "로그인됨 · ": "Signed in · ",
    "전투 결과": "Battle result",
    "결과 없음": "No result",
    "출정문으로 돌아가 다시 도전하세요": "Return to the gate and try again",
    마나: "Mana",
    크리스탈: "Crystal",
    영광: "Glory",
    진문석: "Jinmun",
    기여도: "Contribution",
    "서머너 EXP": "Summoner EXP",
    레벨: "Level",
    소환서: "Scroll",
    "장비 드롭": "Gear drop",
    "강화진 가방에서 장착": "Equip from forge bag",
    "강화진에서 장착": "Equip at forge",
    "연마·각인": "Polish · Engrave",
    "다시 도전": "Retry",
    출정문: "Gate",
    파티: "Party",
    홈으로: "Home",
    "포석 보너스": "Opening bonus",
    "추천 착수": "Suggested move",
    "로그인 · ": "Signed in · ",
    게임시작: "Start",
    로그아웃: "Log out",
    회원가입: "Sign up",
    이메일: "Email",
    비밀번호: "Password",
    "아이디 저장": "Save ID",
    "자동 로그인": "Auto login",
    "데모 플레이": "Demo play",
    "게스트로 계속": "Continue as guest",
    "서버 DB가 메모리 모드입니다. 배포 환경에서는 Postgres(DATABASE_URL)를 연결하세요.":
      "Server DB is in-memory. Connect Postgres (DATABASE_URL) in production.",
    "건물 배치 편집": "Layout edit",
    확인: "OK",
    "융합 완료": "Fusion complete",
    "수련 현황": "Drill status",
    누적: "Total",
    수련하기: "Drill",
    "이 난이도는 아직 열리지 않았습니다.": "This difficulty is not open yet.",
    "행동력이 부족합니다.": "Not enough energy.",
    "스테이지가 잠겨 있습니다.": "Stage is locked.",
  };
  return map[ko] ?? ko;
}

// Fix broken aria-label=""한글"" from pass1 unicode decode bug
cur = cur.replace(/aria-label=""([^"]+)""/g, (_, text) => {
  const key = ensureKey(text, toEn(text));
  return `aria-label="\${t(${JSON.stringify(key)})}"`;
});

// Fix aria-label="${"한글"}" if any remain
cur = cur.replace(/aria-label="\$\{\s*"([^"]+)"\s*\}"/g, (_, text) => {
  const key = ensureKey(text, toEn(text));
  return `aria-label="\${t(${JSON.stringify(key)})}"`;
});

// Auth welcome templates
cur = cur.replace(
  /`환영합니다\$\{(\w+)\.email \? ` · \$\{(\w+)\.email\}` : ""\}`/g,
  (_, a, b) => {
    const key = ensureKey("환영합니다", "Welcome");
    return `\`\${t(${JSON.stringify(key)})}\${${a}.email ? \` · \${${b}.email}\` : ""}\``;
  },
);
cur = cur.replace(/`로그인됨 · \$\{(\w+)\.email\}`/g, (_, a) => {
  const key = ensureKey("로그인됨 · {email}", "Signed in · {email}");
  return `t(${JSON.stringify(key)}, { email: ${a}.email })`;
});

// Known ??? flashes from startBattle etc — recover from common messages
const FLASH_FIXES = [
  [
    /flash\("\?\? \?\?\?\? \?\? \?\?\?\?\."\);/g,
    () => {
      const key = ensureKey(
        "스테이지가 잠겨 있습니다.",
        "Stage is locked.",
      );
      return `flash(t(${JSON.stringify(key)}));`;
    },
  ],
  [
    /flash\("\?\? \?\?\?\? \?\? \?\?\?\? \?\?\?\?\?\."\);/g,
    () => {
      const key = ensureKey(
        "이 난이도는 아직 열리지 않았습니다.",
        "This difficulty is not open yet.",
      );
      return `flash(t(${JSON.stringify(key)}));`;
    },
  ],
  [
    /flash\("\?\?\?\?\? \?\?\?\?\?\?\."\);/g,
    () => {
      const key = ensureKey("행동력이 부족합니다.", "Not enough energy.");
      return `flash(t(${JSON.stringify(key)}));`;
    },
  ],
];
for (const [re, fn] of FLASH_FIXES) {
  cur = cur.replace(re, fn);
}

// Auth enter flashes still ???
cur = cur.replace(
  /user\.kind === "demo"\s*\?\s*"\?\? \?\?\? \?\?\?\?\?\?\."\s*:\s*user\.kind === "guest"\s*\?\s*"\?\?\?\? \?\?\?\?\?\?\."/g,
  () => {
    const d = ensureKey("데모 모드로 입장했습니다.", "Entered demo mode.");
    const g = ensureKey("게스트로 입장했습니다.", "Entered as guest.");
    return `user.kind === "demo"\n        ? t(${JSON.stringify(d)})\n        : user.kind === "guest"\n          ? t(${JSON.stringify(g)})`;
  },
);
cur = cur.replace(
  /sessionUser\.kind === "demo"\s*\?\s*"\?\? \?\?\? \?\?\?\?\?\?\."\s*:\s*sessionUser\.kind === "guest"\s*\?\s*"\?\?\?\? \?\?\?\?\?\?\."/g,
  () => {
    const d = ensureKey("데모 모드로 입장했습니다.", "Entered demo mode.");
    const g = ensureKey("게스트로 입장했습니다.", "Entered as guest.");
    return `sessionUser.kind === "demo"\n        ? t(${JSON.stringify(d)})\n      : sessionUser.kind === "guest"\n        ? t(${JSON.stringify(g)})`;
  },
);
cur = cur.replace(
  /: "\?\?\?\?\?\?\?\?\. \?\?\?\?\? \?\? \?\?\?\.",/g,
  () => {
    const key = ensureKey(
      "계정에 연결되었습니다. 게임시작을 눌러 주세요.",
      "Account linked. Press Start to play.",
    );
    return `: t(${JSON.stringify(key)}),`;
  },
);

// noteCloudUnauthorized
cur = cur.replace(
  /ephemeralStore\s*\?\s*"\?[^"]*"\s*:\s*"\?[^"]*"/,
  () => {
    const a = ensureKey(
      "체험 세션은 DB가 없습니다. Railway에 DATABASE_URL(Postgres)을 연결하세요. 그 전엔 로컬만 저장됩니다.",
      "Trial session has no DB. Set DATABASE_URL (Postgres) on Railway. Until then only local saves.",
    );
    const b = ensureKey(
      "클라우드 동기화에 실패했습니다. 잠시 후 다시 시도하세요. (로컬은 유지됨)",
      "Cloud sync failed. Try again later. (Local save kept)",
    );
    return `ephemeralStore\n        ? t(${JSON.stringify(a)})\n        : t(${JSON.stringify(b)})`;
  },
);

/**
 * Replace Hangul text embedded in HTML/templates.
 * Strategy: find maximal Hangul phrases and wrap.
 * Avoid replacing inside t("...") calls and import paths.
 */
const PHRASE_RE =
  /[\uac00-\ud7a3][\uac00-\ud7a3A-Za-z0-9\s·./+\-%°I×〜~、，]*[\uac00-\ud7a3]|[\uac00-\ud7a3]+/g;

function replaceHangulPhrases(src) {
  // Collect unique phrases longest-first
  const phrases = new Set();
  let m;
  const re = new RegExp(PHRASE_RE.source, "g");
  while ((m = re.exec(src))) {
    const p = m[0].trim();
    if (p.length < 1) continue;
    if (hangulCount(p) < 1) continue;
    // skip pure latin leftovers
    phrases.add(m[0]);
  }
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  let out = src;
  let n = 0;
  for (const phrase of sorted) {
    // Skip if phrase is only whitespace+hangul of length 1 that's a variable context - still migrate
    let idx = 0;
    while ((idx = out.indexOf(phrase, idx)) !== -1) {
      const before = out.slice(Math.max(0, idx - 12), idx);
      const after = out.slice(idx + phrase.length, idx + phrase.length + 8);
      // already in t("ui....") string value? skip if inside existing t( key )
      if (/t\("ui\.[a-f0-9]{6,}"\)$/.test(before.replace(/\s/g, "")) || before.endsWith('t("') || before.includes('t("ui.')) {
        // more precise: if we're inside the key quotes
        const slice = out.slice(Math.max(0, idx - 30), idx);
        if (/t\("ui\.[a-f0-9]*$/.test(slice)) {
          idx += phrase.length;
          continue;
        }
      }
      // skip in comments
      const lineStart = out.lastIndexOf("\n", idx) + 1;
      const linePrefix = out.slice(lineStart, idx);
      if (linePrefix.trimStart().startsWith("//")) {
        idx += phrase.length;
        continue;
      }

      const key = ensureKey(phrase.trim(), toEn(phrase.trim()));
      // Decide wrapper: if surrounded by HTML text or template, use ${t()}
      const prev = out[idx - 1] || "";
      const next = out[idx + phrase.length] || "";
      const inTemplate =
        (() => {
          // rough: count backticks before
          const head = out.slice(0, idx);
          const ticks = (head.match(/`/g) || []).length;
          return ticks % 2 === 1;
        })();

      let repl;
      if (inTemplate) {
        repl = `\${t(${JSON.stringify(key)})}`;
      } else if ((prev === '"' && next === '"') || (prev === "'" && next === "'")) {
        // whole string content — replace including quotes
        repl = `t(${JSON.stringify(key)})`;
        out = out.slice(0, idx - 1) + repl + out.slice(idx + phrase.length + 1);
        n++;
        idx += repl.length;
        continue;
      } else {
        // bare hangul in JS (unusual) — wrap as t()
        repl = `t(${JSON.stringify(key)})`;
      }
      out = out.slice(0, idx) + repl + out.slice(idx + phrase.length);
      n++;
      idx += repl.length;
    }
  }
  return { out, n };
}

const pass = replaceHangulPhrases(cur);
cur = pass.out;
console.log("phrase replacements:", pass.n);

// Clean up double ${t()} wrappers if any: ${${t(...)}} 
cur = cur.replace(/\$\{\$\{t\((["']ui\.[a-f0-9]+["'])\)\}\}/g, "${t($1)}");
// Fix t(t("ui...")) 
cur = cur.replace(/t\(t\((["']ui\.[a-f0-9]+["'])\)\)/g, "t($1)");

// Remaining ??? string literals - replace with generic missing key markers from length
cur = cur.replace(/(["'])(\?{2,}(?:\s|\?|·|\.|\,|\+|\/|[A-Za-z0-9()])*)\1/g, (full, q, body) => {
  // skip localStorage / ternary noise
  if (body.length < 3) return full;
  // Try not to replace code like ???
  const key = ensureKey(
    `[복구필요:${body}]`,
    `[needs-restore:${body}]`,
  );
  return `t(${JSON.stringify(key)})`;
});

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
fs.writeFileSync(mainPath, cur, "utf8");

const leftH = hangulCount(cur);
const leftQ = cur
  .split("\n")
  .filter((l) => /\?\?\?/.test(l) && /["'`]/.test(l) && !/localStorage|needs-restore|복구필요/.test(l))
  .length;
const leftover = cur
  .split("\n")
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => /[\uac00-\ud7a3]/.test(l));

fs.writeFileSync(
  path.join(root, "scripts/_migrate-leftover2.json"),
  JSON.stringify(
    leftover.slice(0, 100).map(([n, l]) => ({ n, l: l.trim().slice(0, 200) })),
    null,
    2,
  ),
  "utf8",
);

console.log(
  JSON.stringify(
    {
      extras: Object.keys(extra).length,
      hangulLeft: leftH,
      leftoverLines: leftover.length,
      qLines: leftQ,
    },
    null,
    2,
  ),
);
