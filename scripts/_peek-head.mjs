import { execSync } from "node:child_process";
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
const keys = [
  "summon-idle-kicker",
  "SCROLL_KIND_LABEL",
  "labelKo",
  "btn-season-claim",
  "mana-label",
  "stage-drop-piece-label",
  "season-panel-title",
  "stages-region-x",
  "equipVault",
  "guildContribution",
];
for (const k of keys) {
  const idx = head.indexOf(k);
  if (idx < 0) {
    console.log("--- missing", k);
    continue;
  }
  console.log("\n===", k, "===");
  console.log(head.slice(Math.max(0, idx - 80), idx + 200).replace(/\n/g, "\n"));
}
