import fs from "node:fs";

const extra = JSON.parse(
  fs.readFileSync("apps/web/src/i18n/ui-extra.json", "utf8"),
);
const main = fs.readFileSync("apps/web/src/main.ts", "utf8");

for (const [k, v] of Object.entries(extra)) {
  if (!/복구필요|needs-restore/.test(v.ko + v.en)) continue;
  const used = main.includes(k);
  console.log(used ? "USED" : "unused", k, JSON.stringify(v));
}
