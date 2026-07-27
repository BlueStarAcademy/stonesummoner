/**
 * Inside `template literals`, wrap bare t('ui…') that appear in TEXT parts
 * (outside ${...}) as ${t('ui…')}. Leave t() already inside ${} alone.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { transformSync } from "esbuild";

let c = fs.readFileSync("apps/web/src/main.ts", "utf8");

function processTemplateLiterals(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src[i] === "`") {
      // find end of template, respecting ${}
      let j = i + 1;
      let depth = 0;
      const parts = []; // {type:'text'|'expr', start, end}
      let textStart = j;
      while (j < src.length) {
        if (src[j] === "\\" && depth === 0) {
          j += 2;
          continue;
        }
        if (depth === 0 && src[j] === "`") break;
        if (depth === 0 && src[j] === "$" && src[j + 1] === "{") {
          if (j > textStart) parts.push({ type: "text", start: textStart, end: j });
          depth = 1;
          j += 2;
          const exprStart = j;
          while (j < src.length && depth > 0) {
            const ch = src[j];
            if (ch === "'" || ch === '"' || ch === "`") {
              // skip string
              const q = ch;
              j++;
              while (j < src.length) {
                if (src[j] === "\\") {
                  j += 2;
                  continue;
                }
                if (src[j] === q) {
                  j++;
                  break;
                }
                j++;
              }
              continue;
            }
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            j++;
          }
          parts.push({ type: "expr", start: exprStart, end: j - 1 });
          textStart = j;
          continue;
        }
        j++;
      }
      if (j > textStart && j < src.length) {
        parts.push({ type: "text", start: textStart, end: j });
      }

      // rebuild template
      out += "`";
      for (const p of parts) {
        const chunk = src.slice(p.start, p.end);
        if (p.type === "text") {
          out += chunk.replace(/t\('(ui\.[a-f0-9]+)'\)/g, "${t('$1')}");
        } else {
          // Recurse into expressions so nested templates get fixed too
          out += "${" + processTemplateLiterals(chunk) + "}";
        }
      }
      out += "`";
      i = j + 1;
      continue;
    }
    // skip strings
    if (src[i] === "'" || src[i] === '"') {
      const q = src[i];
      out += q;
      i++;
      while (i < src.length) {
        if (src[i] === "\\") {
          out += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    out += src[i];
    i++;
  }
  return out;
}

c = processTemplateLiterals(c);

// Fix auth warn fully
c = c.replace(
  /ephemeralStore\s*\?\s*`<p class="auth-warn">[\s\S]*?<\/p>`\s*:\s*""/,
  `ephemeralStore
        ? \`<p class="auth-warn">\${t('ui.b97534218c')}</p>\`
        : ""`,
);

// Fix shield title=t( → title="${t(
c = c.replace(/title=t\('(ui\.[a-f0-9]+)'\)/g, 'title="${t(\'$1\')}"');
c = c.replace(/placeholder=t\('(ui\.[a-f0-9]+)'\)/g, 'placeholder="${t(\'$1\')}"');
c = c.replace(/alt=t\('(ui\.[a-f0-9]+)'\)/g, 'alt="${t(\'$1\')}"');

// Fix welcome flashes that are still `t('ui')${email
c = c.replace(
  /: `\$\{t\('(ui\.[a-f0-9]+)'\)\}\$\{(\w+)\.email \? ` · \$\{(\w+)\.email\}` : ""\}`/g,
  ": `${t('$1')}${$2.email ? ` · ${$3.email}` : \"\"}`",
);
// If still bare form without wrap from before
c = c.replace(
  /: `t\('(ui\.[a-f0-9]+)'\)\$\{(\w+)\.email \? ` · \$\{(\w+)\.email\}` : ""\}`/g,
  ": `${t('$1')}${$2.email ? ` · ${$3.email}` : \"\"}`",
);

// Fix SCROLL_KIND_LABEL mapping (all wrongly same key)
const extra = JSON.parse(fs.readFileSync("apps/web/src/i18n/ui-extra.json", "utf8"));
function ensureKey(ko, en) {
  const k = `ui.${crypto.createHash("sha1").update(ko).digest("hex").slice(0, 10)}`;
  extra[k] = { ko, en };
  return k;
}
const kn = ensureKey("일반", "Normal");
const kp = ensureKey("고급", "Premium");
const km = ensureKey("신성/심연", "Mystic");
c = c.replace(
  /normal: t\('ui\.[a-f0-9]+'\),\s*premium: t\('ui\.[a-f0-9]+'\),\s*mystic: t\('ui\.[a-f0-9]+'\),/,
  `normal: t('${kn}'),
    premium: t('${kp}'),
    mystic: t('${km}'),`,
);

fs.writeFileSync("apps/web/src/i18n/ui-extra.json", JSON.stringify(extra, null, 2), "utf8");
fs.writeFileSync("apps/web/src/main.ts", c, "utf8");

try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("FAIL", e.errors?.[0]?.text);
  const loc = e.errors?.[0]?.location;
  if (loc) {
    const ls = c.split("\n");
    for (let i = loc.line - 2; i <= loc.line + 1; i++) console.log(i + ":", ls[i - 1]);
  }
  process.exit(1);
}

// Count remaining bare t('ui') in template text (heuristic: `...t('ui without ${ before)
const remaining = [...c.matchAll(/`(?:[^`$]|\$(?!\{)|\\`)*t\('ui\./g)];
console.log("possible bare in templates:", remaining.length);

const warn = c.includes("auth-warn");
const warnLine = c.split("\n").find((l) => l.includes("auth-warn"));
console.log("warn:", warnLine?.trim().slice(0, 120));
