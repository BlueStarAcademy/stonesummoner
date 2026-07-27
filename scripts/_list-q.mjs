import fs from "node:fs";
const c = fs.readFileSync("apps/web/src/main.ts", "utf8");
c.split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => /\?{2,}/.test(l))
  .forEach(([n, l]) => console.log(n + ":", l.trim().slice(0, 200)));
