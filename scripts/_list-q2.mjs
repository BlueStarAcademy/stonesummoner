import fs from "node:fs";
const c = fs.readFileSync("apps/web/src/main.ts", "utf8");
const bad = c
  .split(/\n/)
  .map((l, i) => [i + 1, l])
  .filter(([, l]) => {
    if (!/\?/.test(l)) return false;
    // string/template with question-mark runs that look like corrupted hangul
    if (/["'`][^"'`]*\?{2,}[^"'`]*["'`]/.test(l)) return true;
    if (/>[^<]*\?{2,}[^<]*</.test(l)) return true;
    if (/labelKo:\s*"\?/.test(l)) return true;
    if (/blurb:\s*"\?/.test(l)) return true;
    return false;
  });
console.log("suspicious", bad.length);
bad.forEach(([n, l]) => console.log(n + ":", l.trim().slice(0, 180)));
