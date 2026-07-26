import fs from "fs";
import { execSync } from "child_process";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
}).replace(/\r\n/g, "\n");

// Pull island spot() lines from HEAD by tone key
for (const tone of [
  "summon",
  "forge",
  "gate",
  "shop",
  "wish",
  "dojo",
  "fusion",
  "mine",
  "pond",
  "party",
  "guild",
  "glory",
]) {
  const re = new RegExp(
    `\\$\\{spot\\([^\\n]*tone: "${tone}"[^\\n]*\\)\\}`,
  );
  const h = head.match(re);
  const cur = c.match(re);
  if (h && cur && /\?\?/.test(cur[0])) {
    c = c.replace(cur[0], h[0]);
    console.log("spot", tone);
  }
}

c = c.replace(
  /blurb: `[^`]*\$\{pin\.areaKo\}`/,
  "blurb: `\uC2DC\uB098\uB9AC\uC624 \u00B7 ${pin.areaKo}`",
);

c = c.replace(
  /if \(!isDifficultyOpen\(stage, diff\)\) \{\n\s*flash\("[^"]*"\);/,
  'if (!isDifficultyOpen(stage, diff)) {\n    flash("\uD574\uB2F9 \uB09C\uC774\uB3C4\uB294 \uC544\uC9C1 \uD574\uAE08\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");',
);

c = c.replace(
  /if \(Math\.floor\(save\.island\.energy\) < cost\) \{\n\s*flash\("[^"]*"\);/,
  'if (Math.floor(save.island.energy) < cost) {\n    flash("\uD589\uB3D9\uB825\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.");',
);

c = c.replace(
  /if \(!isStageUnlocked\(save, stage\.id\)\) \{\n\s*flash\("[^"]*"\);/,
  'if (!isStageUnlocked(save, stage.id)) {\n    flash("\uC544\uC9C1 \uD574\uAE08\uB418\uC9C0 \uC54A\uC740 \uC9C0\uC5ED\uC785\uB2C8\uB2E4.");',
);

fs.writeFileSync(p, c, "utf8");
transformSync(c, { loader: "ts", target: "es2022" });
const q = c.split("\n").filter((l) => /\?\?\?/.test(l)).length;
console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length, "q", q);
const m = c.match(/filter\(\s*\(l\)\s*=>\s*\/([^/]+)\//);
new RegExp(m[1]);
console.log("ticker OK");
