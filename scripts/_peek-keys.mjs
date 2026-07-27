import fs from "node:fs";
const koSrc = fs.readFileSync("apps/web/src/i18n/messages/ko.ts", "utf8");
const ko = JSON.parse(
  koSrc.match(/const messages: MessageDict = ({[\s\S]*?});\s*\n\s*export default/)[1],
);
const keys = [
  "ui.e225a6fd75", // login?
  "ui.ecb4cc8789", // register
  "ui.d975611bf8", // dojo hint fragment
  "ui.fa73f3a42f", // scroll
  "ui.b241493768", // 장
  "ui.aef1a1e70e",
  "ui.1c208809ed",
  "ui.2d586d2a06",
];
for (const k of keys) console.log(k, "→", ko[k]);
