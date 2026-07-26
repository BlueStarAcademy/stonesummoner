import fs from "fs";
import { execSync } from "child_process";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
}).replace(/\r\n/g, "\n");

// Multi-line spot blocks for wish/dojo/fusion from HEAD
for (const tone of ["wish", "dojo", "fusion"]) {
  const re = new RegExp(
    `\\$\\{spot\\("[^"]+",\\s*"[^"]*",\\s*\\d+,\\s*\\d+,\\s*\\{[\\s\\S]*?tone:\\s*"${tone}"[\\s\\S]*?\\}\\)\\}`,
  );
  const h = head.match(re);
  const cur = c.match(re);
  if (h && cur) {
    c = c.replace(cur[0], h[0]);
    console.log("restored spot", tone);
  } else {
    console.log("miss spot", tone, !!h, !!cur);
  }
}

// First remaining flash with ???
c = c.replace(
  /flash\("\?\? \?\? \?\? [^"]*"\);/,
  'flash("\uC544\uC9C1 \uD574\uAE08\uB418\uC9C0 \uC54A\uC740 \uC9C0\uC5ED\uC785\uB2C8\uB2E4.");',
);

fs.writeFileSync(p, c, "utf8");
transformSync(c, { loader: "ts", target: "es2022" });
const q = c.split("\n").filter((l) => /\?\?\?/.test(l));
console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length, "q", q.length);
q.forEach((l) => console.log(l.slice(0, 100)));
