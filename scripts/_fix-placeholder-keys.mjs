import fs from "node:fs";

const extraPath = "apps/web/src/i18n/ui-extra.json";
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));

const fixes = {
  "ui.d0e22dbd7b": { ko: "소환", en: "Summon" },
  "ui.2387a8e0b0": { ko: "기본 난이도", en: "Standard difficulty" },
  "ui.3dfdef02ab": { ko: "어려움", en: "Hard" },
  "ui.4292516afd": { ko: "난이도 잠김", en: "Difficulty locked" },
  "ui.bc22e8e368": { ko: "행동력 0", en: "Energy 0" },
  "ui.1a3b3223e1": { ko: "난이도 선택", en: "Select difficulty" },
};

for (const [k, v] of Object.entries(fixes)) {
  extra[k] = v;
  console.log("fixed", k, v.ko);
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2), "utf8");
