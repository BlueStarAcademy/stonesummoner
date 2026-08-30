/**
 * Export the production queue for high-quality 2.5D monster battle stills.
 *
 * Usage:
 *   node scripts/export-monster-battle-25d-queue.mjs
 *   node scripts/export-monster-battle-25d-queue.mjs --pilot
 *   node scripts/export-monster-battle-25d-queue.mjs --families wolf_fighter,dragon_knight
 *   node scripts/export-monster-battle-25d-queue.mjs --ready-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ELEMENTS,
  FAMILY_IDS,
  PILOT_FAMILIES,
} from "./lib/monster-art-roster.mjs";
import {
  BATTLE_25D_NEGATIVE_PROMPT,
  buildMonsterBattle25dPrompt,
} from "./lib/monster-battle-25d-prompts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const docsDir = path.join(root, "docs/art/monster");
const familyDir = path.join(docsDir, "families");
const rosterPath = path.join(docsDir, "roster-50.md");

function argVal(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function normalizeRelative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function readRosterMeta() {
  const rows = new Map();
  const text = fs.readFileSync(rosterPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(
      /^\|\s*(\d)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/,
    );
    if (!match) continue;
    rows.set(match[2], {
      naturalStars: Number.parseInt(match[1], 10),
      nameKo: match[3],
      role: match[4],
    });
  }
  return rows;
}

function inspectFamilyBrief(familyId) {
  const file = path.join(familyDir, `${familyId}.md`);
  if (!fs.existsSync(file)) {
    return {
      file,
      brief: "",
      ready: false,
      issues: ["missing-family-sheet"],
    };
  }
  const brief = fs.readFileSync(file, "utf8");
  const issues = [];
  if (brief.includes("Family silhouette and role from roster-50.md")) {
    issues.push("template-identity");
  }
  if (!/^## Identity\s*$/m.test(brief)) issues.push("missing-identity-section");
  if (!/## (Battle prompt block|Prompts)\s*$/m.test(brief)) {
    issues.push("missing-prompt-section");
  }
  if (brief.length < 700) issues.push("brief-too-short");
  return { file, brief, ready: issues.length === 0, issues };
}

function stemFor(artKey, state, view) {
  return `${artKey}${state === "awaken" ? "-awaken" : ""}-${view}`;
}

function taskFor({
  familyId,
  family,
  meta,
  element,
  state,
  view,
  sequence,
}) {
  const artKey = `${familyId}_${element}`;
  const stem = stemFor(artKey, state, view);
  const baseFront = stemFor(artKey, "base", "front");
  const awakenFront = stemFor(artKey, "awaken", "front");
  const dependency =
    state === "base" && view === "front"
      ? null
      : state === "awaken" && view === "back"
        ? awakenFront
        : baseFront;
  const referenceName = dependency ? `${dependency}.webp` : null;
  return {
    id: stem,
    sequence,
    status: family.ready ? "ready" : "blocked-family-brief",
    familyId,
    nameKo: meta?.nameKo ?? null,
    naturalStars: meta?.naturalStars ?? null,
    role: meta?.role ?? null,
    element,
    state,
    view,
    seedGroup: familyId,
    familySheet: normalizeRelative(family.file),
    briefIssues: family.issues,
    dependsOn: dependency,
    referenceAsset: referenceName
      ? `assets/monster/battle/${referenceName}`
      : null,
    sourceAsset: `assets/monster/battle/${stem}.webp`,
    installedAsset: `apps/web/public/art/monster/battle/${stem}.webp`,
    sourceSpec: {
      width: 1536,
      height: 1536,
      format: "png-or-webp",
      background: "transparent-alpha-or-#FF00FF",
    },
    installSpec: {
      width: 1024,
      height: 1024,
      format: "webp",
      fit: "contain",
    },
    prompt: buildMonsterBattle25dPrompt({
      familyId,
      element,
      state,
      view,
      familyBrief: family.brief,
      referenceName,
    }),
    negativePrompt: BATTLE_25D_NEGATIVE_PROMPT,
  };
}

const rosterMeta = readRosterMeta();
const requestedFamilies = argVal("--families")
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const selectedSet = new Set(
  args.includes("--pilot")
    ? PILOT_FAMILIES
    : requestedFamilies?.length
      ? requestedFamilies
      : FAMILY_IDS,
);
const unknownFamilies = [...selectedSet].filter(
  (familyId) => !FAMILY_IDS.includes(familyId),
);
if (unknownFamilies.length > 0) {
  console.error(`unknown families: ${unknownFamilies.join(", ")}`);
  process.exit(1);
}

const familyOrder = FAMILY_IDS.filter((familyId) => selectedSet.has(familyId))
  .sort((left, right) => {
    const pilotDelta =
      Number(PILOT_FAMILIES.includes(right)) -
      Number(PILOT_FAMILIES.includes(left));
    if (pilotDelta !== 0) return pilotDelta;
    return (
      (rosterMeta.get(right)?.naturalStars ?? 0) -
      (rosterMeta.get(left)?.naturalStars ?? 0)
    );
  });

const familyAudits = familyOrder.map((familyId) => ({
  familyId,
  ...inspectFamilyBrief(familyId),
}));
const readyOnly = args.includes("--ready-only");
const queue = [];
let sequence = 1;

for (const family of familyAudits) {
  if (readyOnly && !family.ready) continue;
  const meta = rosterMeta.get(family.familyId);
  for (const [state, view] of [
    ["base", "front"],
    ["base", "back"],
    ["awaken", "front"],
    ["awaken", "back"],
  ]) {
    for (const element of ELEMENTS) {
      queue.push(
        taskFor({
          familyId: family.familyId,
          family,
          meta,
          element,
          state,
          view,
          sequence: sequence++,
        }),
      );
    }
  }
}

const readyFamilies = familyAudits.filter((family) => family.ready).length;
const outputName = args.includes("--pilot")
  ? "battle-25d-queue-pilot.json"
  : requestedFamilies?.length
    ? "battle-25d-queue-selected.json"
    : "battle-25d-queue.json";
const outPath = path.join(docsDir, outputName);
const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: "replace-existing-painted-battle-stills",
  totals: {
    families: familyAudits.length,
    readyFamilies,
    blockedFamilies: familyAudits.length - readyFamilies,
    artKeys: familyAudits.length * ELEMENTS.length,
    tasks: queue.length,
    readyTasks: queue.filter((task) => task.status === "ready").length,
    blockedTasks: queue.filter((task) => task.status !== "ready").length,
  },
  productionOrder: [
    "base-front",
    "base-back-from-base-front-reference",
    "awaken-front-from-base-front-reference",
    "awaken-back-from-awaken-front-reference",
  ],
  familyAudit: familyAudits.map((family) => ({
    familyId: family.familyId,
    ready: family.ready,
    issues: family.issues,
    familySheet: normalizeRelative(family.file),
  })),
  queue,
};

fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(
  `wrote ${normalizeRelative(outPath)} families=${familyAudits.length} ready=${readyFamilies} tasks=${queue.length}`,
);
