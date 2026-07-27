import fs from "node:fs";
import crypto from "node:crypto";
import { transformSync } from "esbuild";

function keyFor(ko) {
  return `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
}

const extraPath = "apps/web/src/i18n/ui-extra.json";
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));
function ensure(ko, en) {
  const k = keyFor(ko);
  extra[k] = { ko, en };
  return k;
}

const login = ensure("로그인", "Log in");
const guest = ensure("게스트", "Guest");
const warn = ensure(
  "서버 DB가 메모리 모드입니다. 배포 환경에서는 Postgres(DATABASE_URL)를 연결하세요.",
  "Server DB is in-memory. Connect Postgres (DATABASE_URL) in production.",
);

let c = fs.readFileSync("apps/web/src/main.ts", "utf8");

// Login pane title + submit (not register pane)
c = c.replace(
  /(const emailAttr = savedEmail[\s\S]*?<h2 class="auth-title">)\$\{t\('ui\.[a-f0-9]+'\)\}(<\/h2>[\s\S]*?<button type="submit" class="auth-btn-primary">)\$\{t\('ui\.[a-f0-9]+'\)\}(<\/button>)/,
  `$1\${t('${login}')}$2\${t('${login}')}$3`,
);

// Guest label "?" 
c = c.replace(
  /(sessionUser!\.kind === "guest"\s*\?\s*)"\?"/,
  `$1t('${guest}')`,
);

// Broken auth warn line
c = c.replace(
  /<p class="auth-warn">\$\{t\('ui\.[a-f0-9]+'\)\} Postgres\(DATABASE_URL\)t\('ui\.[a-f0-9]+'\)\.<\/p>/,
  `<p class="auth-warn">\${t('${warn}')}</p>`,
);
c = c.replace(
  /<p class="auth-warn">[^<]*t\('ui\.[a-f0-9]+'\)[^<]*<\/p>/,
  `<p class="auth-warn">\${t('${warn}')}</p>`,
);

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
fs.writeFileSync("apps/web/src/main.ts", c, "utf8");

transformSync(c, { loader: "ts", target: "es2022" });
console.log("esbuild OK");
console.log("login key", login, "guest", guest);

// show auth warn line
const i = c.indexOf("auth-warn");
console.log(c.slice(i, i + 120));
