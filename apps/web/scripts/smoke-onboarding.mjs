/**
 * Smoke: first-rite onboard step machine (no DOM / localStorage).
 * Run: node --experimental-strip-types apps/web/scripts/smoke-onboarding.mjs
 */
import {
  ONBOARD_FIRST_STAGE_ID,
  advanceOnboard,
  defaultOnboardSnapshot,
  deriveOnboardStep,
  fromOnboardRiteSave,
  guideRailShouldShow,
  isSideRegionGuideOpen,
  isVirginOnboard,
  overlayHidesGuideRail,
  SIDE_CONTENT_REGION_IDS,
  sideRegionsUnlockedAtGuideStep,
  skipOnboardForProgressedSave,
  toOnboardRiteSave,
} from "../src/core-loop/onboarding.ts";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

let snap = defaultOnboardSnapshot();
assert(isVirginOnboard(snap), "fresh snap is virgin");
assert(deriveOnboardStep(snap, { clearedStages: [] }) === "gateway", "start at gateway");

snap = advanceOnboard(snap, { openedStages: true }, { clearedStages: [] });
assert(snap.step === "stages", "gateway → stages");

snap = advanceOnboard(snap, { openedRegion: true }, { clearedStages: [] });
assert(snap.step === "battle", "stages → battle");

snap = advanceOnboard(
  snap,
  { hasBattleDrop: true },
  { clearedStages: [ONBOARD_FIRST_STAGE_ID] },
);
assert(snap.step === "summon", "clear 1-1 → summon");

snap = advanceOnboard(snap, { summoned: true }, {
  clearedStages: [ONBOARD_FIRST_STAGE_ID],
  hasBattleDrop: true,
});
assert(snap.step === "enhance", "summon → enhance");

snap = advanceOnboard(snap, { enhanced: true }, {
  clearedStages: [ONBOARD_FIRST_STAGE_ID],
  hasBattleDrop: true,
});
assert(snap.step === "party", "enhance → party");

snap = advanceOnboard(snap, { partySet: true }, {
  clearedStages: [ONBOARD_FIRST_STAGE_ID],
  hasBattleDrop: true,
});
assert(snap.step === "equip", "party → equip when drop");

snap = advanceOnboard(snap, { equipped: true }, {
  clearedStages: [ONBOARD_FIRST_STAGE_ID],
  hasBattleDrop: true,
});
assert(snap.step === "done", "equip → done");

const noDrop = advanceOnboard(
  {
    ...defaultOnboardSnapshot(),
    openedStages: true,
    openedRegion: true,
    summoned: true,
    enhanced: true,
    partySet: true,
    hasBattleDrop: false,
  },
  {},
  { clearedStages: [ONBOARD_FIRST_STAGE_ID], hasBattleDrop: false },
);
assert(noDrop.step === "done", "no drop skips equip");

const skipped = skipOnboardForProgressedSave(defaultOnboardSnapshot(), [
  ONBOARD_FIRST_STAGE_ID,
  "garen_1_2",
]);
assert(skipped?.step === "done", "veteran/demo virgin+cleared → done");
assert(
  skipOnboardForProgressedSave(defaultOnboardSnapshot(), []) === null,
  "fresh uncleared stays on rite",
);

const cloud = toOnboardRiteSave({
  ...defaultOnboardSnapshot(),
  step: "party",
  openedStages: true,
  openedRegion: true,
  summoned: true,
  enhanced: true,
  hasBattleDrop: true,
  circleTutorialSeen: true,
});
const restored = fromOnboardRiteSave(cloud);
assert(restored?.step === "party", "cloud rite roundtrip keeps step");
assert(restored?.summoned === true, "cloud rite roundtrip keeps flags");
assert(
  restored?.circleTutorialSeen === true,
  "cloud rite roundtrip keeps circleTutorialSeen",
);
assert(fromOnboardRiteSave(null) === null, "null cloud rite is null");

assert(!isSideRegionGuideOpen("gateway", "cadence"), "cadence locked at gateway");
assert(!isSideRegionGuideOpen("battle", "depth"), "depth locked before enhance");
assert(isSideRegionGuideOpen("summon", "cadence"), "cadence opens at summon");
assert(isSideRegionGuideOpen("enhance", "depth"), "depth opens at enhance");
assert(isSideRegionGuideOpen("party", "arena"), "arena opens at party");
assert(isSideRegionGuideOpen("equip", "warena"), "warena opens at equip");
assert(isSideRegionGuideOpen("done", "guild"), "guild opens when guide done");
assert(
  sideRegionsUnlockedAtGuideStep("done").length === SIDE_CONTENT_REGION_IDS.length,
  "all side regions open at done",
);

assert(
  guideRailShouldShow({ step: "gateway", view: "home" }),
  "rail shows on island during rite",
);
assert(
  guideRailShouldShow({ step: "summon", view: "summon" }),
  "rail shows on summon hall during rite",
);
assert(
  !guideRailShouldShow({ step: "enhance", view: "enhance" }),
  "rail hides on monster book",
);
assert(
  !guideRailShouldShow({ step: "party", view: "party" }),
  "rail hides on party hall",
);
assert(
  !guideRailShouldShow({ step: "gateway", view: "home", blockingOverlay: true }),
  "rail hides when a modal is open",
);
assert(
  !guideRailShouldShow({ step: "done", view: "home" }),
  "rail hides when rite is done",
);
assert(!overlayHidesGuideRail("stages-region"), "stages region keeps the rail");
assert(overlayHidesGuideRail("settings-layer"), "settings modal hides the rail");
assert(overlayHidesGuideRail("shop-layer"), "shop modal hides the rail");

console.log("smoke-onboarding OK");
