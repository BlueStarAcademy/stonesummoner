/**
 * Fallback difficulty when region can't open current selection.
 */
import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const old = `      stagesRegion = stagesRegion === id ? null : id;
      render();`;

const neu = `      stagesRegion = stagesRegion === id ? null : id;
      if (stagesRegion) {
        const region = stagesRegions().find((r) => r.id === stagesRegion);
        if (region && !regionDifficultyOpen(region, stageEntryDiff)) {
          stageEntryDiff = "normal";
        }
      }
      render();`;

if (!c.includes(old)) {
  console.error("region toggle missing");
  process.exit(1);
}
c = c.replace(old, neu);

fs.writeFileSync(p, c, "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
