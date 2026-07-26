import fs from "node:fs";

const path = "apps/web/src/main.ts";
let s = fs.readFileSync(path, "utf8");

const hud = [
  "    ${",
  "      islandLayoutEdit",
  "        ? `<div class=\"island-edit-hud\" role=\"toolbar\" aria-label=\"${\"\\uAC74\\uBB3C \\uBC30\\uCE58 \\uD3B8\\uC9D1\"}\">",
  "      <div class=\"island-edit-hud-copy\">",
  "        <strong>${\"\\uBC30\\uCE58 \\uD3B8\\uC9D1\"}</strong>",
  "        <small>${\"\\uB4DC\\uB798\\uADF8\\uB85C \\uAC74\\uBB3C \\uC704\\uCE58\\uB97C \\uC62E\\uAE30\\uC138\\uC694\"}</small>",
  "      </div>",
  "      <button type=\"button\" class=\"secondary\" id=\"btn-island-layout-reset\">${\"\\uCD08\\uAE30\\uD654\"}</button>",
  "      <button type=\"button\" class=\"auth-btn-primary\" id=\"btn-island-layout-done\">${\"\\uC644\\uB8CC\"}</button>",
  "    </div>`",
  "        : \"\"",
  "    }",
].join("\n");

const hudRe =
  /    \$\{\n      islandLayoutEdit\n        \? `<div class="island-edit-hud"[\s\S]*?<\/div>`\n        : ""\n    \}/;

if (!hudRe.test(s)) {
  console.error("HUD block not found");
  const i = s.indexOf("island-edit-hud");
  console.error(JSON.stringify(s.slice(i - 40, i + 350)));
  process.exit(1);
}
s = s.replace(hudRe, hud);
console.log("ok hud");

// flash messages
const flashes = [
  [
    /flash\("[^"]*"\);\n  render\(\);\n  if \(focusId\)/,
    'flash("\\uAC74\\uBB3C \\uBC30\\uCE58 \\uD3B8\\uC9D1 \\u00B7 \\uB4DC\\uB798\\uADF8\\uB85C \\uC704\\uCE58\\uB97C \\uC62E\\uAE30\\uC138\\uC694");\n  render();\n  if (focusId)',
    "enter-flash",
  ],
  [
    /if \(commit && islandLayoutDraft\) \{\n    writeIslandLayout\(islandLayoutDraft\);\n    flash\("[^"]*"\);\n  \} else if \(!commit\) \{\n    flash\("[^"]*"\);\n  \}/,
    'if (commit && islandLayoutDraft) {\n    writeIslandLayout(islandLayoutDraft);\n    flash("\\uAC74\\uBB3C \\uBC30\\uCE58\\uB97C \\uC800\\uC7A5\\uD588\\uC2B5\\uB2C8\\uB2E4");\n  } else if (!commit) {\n    flash("\\uBC30\\uCE58 \\uD3B8\\uC9D1\\uC744 \\uCDE8\\uC18C\\uD588\\uC2B5\\uB2C8\\uB2E4");\n  }',
    "exit-flash",
  ],
  [
    /writeIslandLayout\(islandLayoutDraft\);\n    flash\("[^"]*"\);\n    render\(\);/,
    'writeIslandLayout(islandLayoutDraft);\n    flash("\\uAE30\\uBCF8 \\uBC30\\uCE58\\uB85C \\uB3CC\\uB824\\uB193\\uC558\\uC2B5\\uB2C8\\uB2E4");\n    render();',
    "reset-flash",
  ],
];

for (const [re, next, label] of flashes) {
  if (!re.test(s)) {
    console.error("MISSING", label);
    process.exit(1);
  }
  s = s.replace(re, next);
  console.log("ok", label);
}

fs.writeFileSync(path, s, "utf8");

const out = fs.readFileSync(path, "utf8");
console.log("hud has 배치", out.includes("\\uBC30\\uCE58 \\uD3B8\\uC9D1") || out.includes("\uBC30\uCE58 \uD3B8\uC9D1"));
console.log("done btn", out.includes("\\uC644\\uB8CC") || /id="btn-island-layout-done">\$\{"\\uC644\\uB8CC"\}/.test(out) || out.includes('id="btn-island-layout-done">${"\\uC644\\uB8CC"}'));
