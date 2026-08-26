import { buildGearArtPrompt } from "./lib/gear-art-prompts.mjs";

const stem = process.argv[2];
if (!stem) {
  console.error("Usage: node scripts/print-gear-prompt.mjs <stem>");
  process.exit(1);
}
console.log(buildGearArtPrompt(stem));
