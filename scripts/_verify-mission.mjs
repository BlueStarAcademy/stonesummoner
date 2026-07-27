import { transformSync } from "esbuild";
import fs from "node:fs";
const main = fs.readFileSync("apps/web/src/main.ts", "utf8");
try {
  transformSync(main, { loader: "ts", target: "es2022" });
  console.log("OK");
} catch (e) {
  console.log(e.errors?.[0]);
  const loc = e.errors?.[0]?.location;
  if (loc) {
    const ls = main.split("\n");
    for (let i = loc.line - 2; i <= loc.line + 2; i++) console.log(i + ":", ls[i - 1]);
  }
}
// count modal injects
console.log(
  "inject count",
  (main.match(/renderMissionModal\(\)/g) || []).length,
);
console.log("bind mission", main.includes('"#btn-mission"'));
console.log("missionOpen close on nav", /missionOpen = false;\n      const nav/.test(main));
