/**
 * Restore Hangul in post-HEAD region modal / difficulty strings (ASCII-safe script).
 */
import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const reps = [
  // flash energy
  [
    /flash\("\?\? \?\?\?\? \?\? \?\?\?\? \?\?\?\?\?\."\);/,
    'flash("\uD589\uB3D9\uB825\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.");',
  ],
  [
    /flash\("\?\?[^\"]*"\);/,
    null, // handle below if needed
  ],
];

// Direct known block replacements via unique ASCII anchors
c = c.replace(
  /\{ id: "normal", labelKo: "[^"]*", blurb: "[^"]*", energyMul: 1 \}/,
  '{ id: "normal", labelKo: "\uBCF4\uD1B5", blurb: "\uAE30\uBCF8 \uB09C\uC774\uB3C4", energyMul: 1 }',
);
c = c.replace(
  /\{ id: "hard", labelKo: "[^"]*", blurb: "[^"]*", energyMul: 1\.5 \}/,
  '{ id: "hard", labelKo: "\uC5B4\uB824\uC6C0", blurb: "\uC801 \uB808\uBCA8 +2 \u00B7 \uD589\uB3D9\uB825 \uC99D\uAC00", energyMul: 1.5 }',
);
c = c.replace(
  /\{ id: "hell", labelKo: "[^"]*", blurb: "[^"]*", energyMul: 2 \}/,
  '{ id: "hell", labelKo: "\uC9C0\uC625", blurb: "\uC801 \uB808\uBCA8 +4 \u00B7 \uD589\uB3D9\uB825 \uB300\uD3ED \uC99D\uAC00", energyMul: 2 }',
);

c = c.replace(
  /const costHint = !diffOpen\n        \? "[^"]*"\n        : cost <= 0\n          \? "[^"]*"\n          : `[^`]*`;/,
  `const costHint = !diffOpen
        ? "\uB09C\uC774\uB3C4 \uBBF8\uD574\uAE08"
        : cost <= 0
          ? "\uD589\uB3D9\uB825 0"
          : \`\uD589\uB3D9\uB825 \${cost}\`;`,
);

c = c.replace(
  /blurb: `[^`]*\$\{pin\.areaKo\}`/,
  'blurb: `\uC2DC\uB098\uB9AC\uC624 \u00B7 ${pin.areaKo}`',
);

c = c.replace(
  /extras = `<p class="stages-note">[^<]*\$\{equipVaultRemaining\(syncEquipVaultWeek\(save\)\)\}\/\$\{EQUIP_VAULT_WEEKLY_LIMIT\}[^<]*<\/p>`;/,
  'extras = `<p class="stages-note">\uC8FC\uAC04 ${equipVaultRemaining(syncEquipVaultWeek(save))}/${EQUIP_VAULT_WEEKLY_LIMIT} \u00B7 \uAC00\uBC29 \uBCF4\uAD00 \uD6C4 \uAC15\uD654\uC9C4\uC5D0\uC11C \uC7A5\uCC29/\uD310\uB9E4</p>`;',
);

c = c.replace(
  /<p class="stages-meta">[^<]*\$\{prog\.cleared\}\/\$\{prog\.total\}\$\{prog\.unlocked \? "" : "[^"]*"\}<\/p>/,
  '<p class="stages-meta">\uD074\uB9AC\uC5B4 ${prog.cleared}/${prog.total}${prog.unlocked ? "" : " \u00B7 \uBBF8\uD574\uAE08"}</p>',
);

c = c.replace(
  /<p class="stages-region-diff-label">[^<]*<\/p>/,
  '<p class="stages-region-diff-label">\uB09C\uC774\uB3C4</p>',
);

c = c.replace(
  /aria-label="[^"]*"\>\$\{diffSeg\}/,
  'aria-label="\uC2DC\uB098\uB9AC\uC624 \uB09C\uC774\uB3C4">${diffSeg}',
);

c = c.replace(
  /<span>[^<]*<strong>\$\{energyNow\}<\/strong>\/\$\{energyMax\}<\/span>/,
  '<span>\uBCF4\uC720 \uD589\uB3D9\uB825 <strong>${energyNow}</strong>/${energyMax}</span>',
);

// flash 행동력
c = c.replace(
  /flash\("[^"]*"\);\n    render\(\);\n    return;\n  \}\n  save = \{\n    \.\.\.save,\n    island: \{\n      \.\.\.save\.island,\n      energy: Math\.floor\(save\.island\.energy\) - cost,/,
  'flash("\uD589\uB3D9\uB825\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.");\n    render();\n    return;\n  }\n  save = {\n    ...save,\n    island: {\n      ...save.island,\n      energy: Math.floor(save.island.energy) - cost,',
);

// ticker join fullwidth spaces
c = c.replace(/items\.join\("[^"]*"\)/, 'items.join("\u3000\u3000\u00B7\u3000\u3000")');

// stage card small line board size
c = c.replace(
  /<small>\$\{s\.boardSize\}.[^$]*\$\{s\.boardSize\}.[^$]*\$\{s\.waves\}\$\{extra\}\$\{weekly\}<\/small>/,
  "<small>${s.boardSize}\u00D7${s.boardSize} \u00B7 \uC6E8\uC774\uBE0C ${s.waves}${extra}${weekly}</small>",
);

// regionDrop caption / labels if broken
c = c.replace(
  /aria-label="[^"]*">\n    <p class="stage-drop-caption">[^<]*<\/p>/,
  'aria-label="\uD68D\uB4DD \uAC00\uB2A5">\n    <p class="stage-drop-caption">\uD68D\uB4DD</p>',
);
c = c.replace(
  /title="[^"]*">\n      <img class="stage-drop-ico" src="\/art\/ui\/symbol\/gear\.svg"/,
  'title="\uC7A5\uBE44 \uB4DC\uB86D">\n      <img class="stage-drop-ico" src="/art/ui/symbol/gear.svg"',
);
c = c.replace(
  /<span class="stage-drop-label">\?\?<\/span>/,
  '<span class="stage-drop-label">\uC7A5\uBE44</span>',
);

fs.writeFileSync(p, c, "utf8");
try {
  transformSync(c, { loader: "ts", target: "es2022" });
  console.log("esbuild OK");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const m = c.match(/filter\(\s*\(l\)\s*=>\s*\/([^/]+)\//);
try {
  new RegExp(m[1]);
  console.log("ticker OK");
} catch (e) {
  console.error("ticker bad", e.message);
  process.exit(1);
}

console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length);
const bad = c.split("\n").filter((l) => /\?\?\?/.test(l));
console.log("??? lines", bad.length);
for (const l of bad) console.log(" ", l.slice(0, 120));
