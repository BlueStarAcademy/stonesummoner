import { execSync } from "child_process";
import fs from "fs";

const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
});
const cur = fs.readFileSync("apps/web/src/main.ts", "utf8");

const spotRe = /\$\{spot\([^)]+\)\}/g;
const headSpots = [...head.matchAll(spotRe)].map((m) => m[0]);
console.log("head spots", headSpots.length);
for (const s of headSpots) console.log(s);

const ti = head.indexOf("function tickerMessages");
console.log("---");
console.log(head.slice(ti, ti + 900));
