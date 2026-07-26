/**
 * Remove duplicate stageButtons remnant after failed brace replace.
 */
import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const bad = c.indexOf(`}): string {\n  const vaultLeft = opts?.equipWeekly`);
const typeStart = c.indexOf("\ntype StagesRegion = {", bad);
if (bad < 0 || typeStart < 0) {
  console.error("cut points", { bad, typeStart });
  process.exit(1);
}

// Keep everything before bad, close the good function, keep from type
c = c.slice(0, bad) + "}" + c.slice(typeStart);
fs.writeFileSync(p, c, "utf8");

try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

console.log({
  hangul: (c.match(/[\uac00-\ud7a3]/g) || []).length,
  dropPreview: c.includes("stageDropPreview"),
  dropSlots: c.includes("stageDropSlots"),
  select: c.includes("region-diff-select"),
  remnant: c.includes("}): string {"),
  regionDropIcons: c.includes("regionDropIcons"),
});
