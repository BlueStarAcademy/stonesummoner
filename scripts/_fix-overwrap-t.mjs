/**
 * Repair over-aggressive ${t()} wrapping inside JS expressions in templates.
 */
import fs from "node:fs";
import { transformSync } from "esbuild";

let c = fs.readFileSync("apps/web/src/main.ts", "utf8");

c = c.replace(/\$\{t\('(ui\.[a-f0-9]+)'\)\}/g, (full, key, offset) => {
  const prev = c.slice(0, offset).replace(/\s+$/, "");
  const ch = prev[prev.length - 1] || "";
  if (ch === ">" || ch === '"' || ch === "'") return full; // HTML text / quoted attr
  if (ch === "=") return `"\${t('${key}')}"`; // unquoted attr → quote it
  return `t('${key}')`; // JS expression context
});

fs.writeFileSync("apps/web/src/main.ts", c, "utf8");

try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.log("FAIL", e.errors?.[0]?.text, e.errors?.[0]?.location);
  const loc = e.errors?.[0]?.location;
  if (loc) {
    const ls = c.split("\n");
    for (let i = loc.line - 2; i <= loc.line + 1; i++)
      console.log(i + ":", ls[i - 1]);
  }
  process.exit(1);
}

// Check remaining literal t('ui') shown as text in HTML ( >t('ui
const bareHtml = [...c.matchAll(/>t\('ui\.[a-f0-9]+'\)/g)];
console.log("bare HTML t() left:", bareHtml.length);
bareHtml.slice(0, 10).forEach((m) => {
  const line = c.slice(0, m.index).split("\n").length;
  console.log(line, m[0]);
});
