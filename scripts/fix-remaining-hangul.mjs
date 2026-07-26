import fs from "fs";
import { transformSync } from "esbuild";

const p = "apps/web/src/main.ts";
let c = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

c = c.replace(
  `  if (!isDifficultyOpen(stage, diff)) {
    flash("?? ???? ?? ???? ?????.");
    render();
    return;
  }`,
  `  if (!isDifficultyOpen(stage, diff)) {
    flash("\uD574\uB2F9 \uB09C\uC774\uB3C4\uB294 \uC544\uC9C1 \uD574\uAE08\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
    render();
    return;
  }`,
);

c = c.replace(
  `      const costHint = !diffOpen
      ? "일반 진문"
        : cost <= 0
          ? "??? 0"
          : \`??? \${cost}\`;
      const mark = done
        ? "?"
        : s.mode === "scenario"
          ? \`\${s.map}-\${s.stage}\`
          : String(s.boardSize);
      return \`<button type="button" class="stage-card stage-card--sortie\${done ? " is-cleared" : ""}\${!canFight ? " is-disabled" : ""}" data-stage="\${s.id}" \${canFight ? "" : "disabled"}>
        <span class="stage-card-mark" aria-hidden="true">\${mark}</span>
        <span class="stage-card-body">
          <strong>\${label} � \${s.nameKo}</strong>`,
  `      const costHint = !diffOpen
        ? "\uB09C\uC774\uB3C4 \uBBF8\uD574\uAE08"
        : cost <= 0
          ? "\uD589\uB3D9\uB825 0"
          : \`\uD589\uB3D9\uB825 \${cost}\`;
      const mark = done
        ? "\u2713"
        : s.mode === "scenario"
          ? \`\${s.map}-\${s.stage}\`
          : String(s.boardSize);
      return \`<button type="button" class="stage-card stage-card--sortie\${done ? " is-cleared" : ""}\${!canFight ? " is-disabled" : ""}" data-stage="\${s.id}" \${canFight ? "" : "disabled"}>
        <span class="stage-card-mark" aria-hidden="true">\${mark}</span>
        <span class="stage-card-body">
          <strong>\${label} \u00B7 \${s.nameKo}</strong>`,
);

// unlock message should be region-style for stages? keep as 이전 스테이지 or use 아직 해금
c = c.replace(
  'flash("이전 스테이지를 먼저 클리어하세요.");\n    render();\n    return;\n  }\n  if (!isDifficultyOpen',
  'flash("\uC544\uC9C1 \uD574\uAE08\uB418\uC9C0 \uC54A\uC740 \uC9C0\uC5ED\uC785\uB2C8\uB2E4.");\n    render();\n    return;\n  }\n  if (!isDifficultyOpen',
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
new RegExp(m[1]);
console.log("ticker OK");
console.log("hangul", (c.match(/[\uac00-\ud7a3]/g) || []).length);
console.log(
  "???",
  c.split("\n").filter((l) => /\?\?\?/.test(l)).length,
);
