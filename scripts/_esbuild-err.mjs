import { transformSync } from "esbuild";
import fs from "node:fs";

const c = fs.readFileSync("apps/web/src/main.ts", "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("OK");
} catch (e) {
  const err = e.errors?.[0];
  console.log(JSON.stringify(err, null, 2));
  if (err?.location) {
    const lines = c.split(/\n/);
    const n = err.location.line;
    for (let i = Math.max(0, n - 3); i < Math.min(lines.length, n + 2); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}
