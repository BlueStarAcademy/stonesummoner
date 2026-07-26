import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const bad = `    },
  }
  };
  const sideRegions:`;
const good = `    },
  };
  const sideRegions:`;

if (!c.includes(bad)) {
  console.error("pattern missing");
  process.exit(1);
}
c = c.replace(bad, good);
c = c.replace("}\ntype StagesRegion", "}\n\ntype StagesRegion");
fs.writeFileSync(p, c, "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length);
