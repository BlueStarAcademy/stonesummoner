/**
 * First-session onboarding — Summoners War–style core loop without copying assets.
 *
 * Path: island gateway → first region → first stage battle → summon → enhance
 * → party → equip → free play.
 * Progress is inferred from save when possible, with an explicit local checkpoint
 * so a mid-session refresh does not lose the guide.
 */

export type OnboardStep =
  | "gateway"
  | "stages"
  | "battle"
  | "summon"
  | "enhance"
  | "party"
  | "equip"
  | "done";

/** Active guide steps (excludes `done`) for stepper UI. */
export const ONBOARD_GUIDE_STEPS: readonly Exclude<OnboardStep, "done">[] = [
  "gateway",
  "stages",
  "battle",
  "summon",
  "enhance",
  "party",
  "equip",
] as const;

export function onboardStepIndex(step: OnboardStep): number {
  if (step === "done") return ONBOARD_GUIDE_STEPS.length;
  const idx = ONBOARD_GUIDE_STEPS.indexOf(step as (typeof ONBOARD_GUIDE_STEPS)[number]);
  return idx < 0 ? 1 : idx + 1;
}

export function onboardStepTotal(): number {
  return ONBOARD_GUIDE_STEPS.length;
}

export const ONBOARD_FIRST_STAGE_ID = "garen_1_1";
export const ONBOARD_STORAGE_PREFIX = "stonesummoner.onboard.v1";

export type OnboardSnapshot = {
  step: OnboardStep;
  /** True after the player has opened the gateway / stages map at least once. */
  openedStages: boolean;
  /** True after opening the first region sheet (Moonveil / mq1). */
  openedRegion: boolean;
  /** True after first summon pull during onboarding. */
  summoned: boolean;
  /** True after opening enhance / applying an enhance action. */
  enhanced: boolean;
  /** True after confirming a party lineup. */
  partySet: boolean;
  /** True after equipping a symbol or gear from the post-battle bag. */
  equipped: boolean;
  /** First-battle gear/symbol drop still needs equipping. */
  hasBattleDrop: boolean;
  /** Welcome rite overlay already shown for this account. */
  welcomeSeen: boolean;
};

export function defaultOnboardSnapshot(): OnboardSnapshot {
  return {
    step: "gateway",
    openedStages: false,
    openedRegion: false,
    summoned: false,
    enhanced: false,
    partySet: false,
    equipped: false,
    hasBattleDrop: false,
    welcomeSeen: false,
  };
}

/** True when no rite progress exists yet (fresh checkpoint). */
export function isVirginOnboard(snap: OnboardSnapshot): boolean {
  return (
    snap.step === "gateway" &&
    !snap.openedStages &&
    !snap.openedRegion &&
    !snap.summoned &&
    !snap.enhanced &&
    !snap.partySet &&
    !snap.equipped &&
    !snap.hasBattleDrop &&
    !snap.welcomeSeen
  );
}

/**
 * Returning players / demo saves already cleared the first stage before the
 * rite existed. Skip the guide instead of dropping them on "summon".
 */
export function skipOnboardForProgressedSave(
  snap: OnboardSnapshot,
  clearedStages: string[],
): OnboardSnapshot | null {
  if (!isVirginOnboard(snap)) return null;
  if (!clearedStages.includes(ONBOARD_FIRST_STAGE_ID)) return null;
  return {
    ...defaultOnboardSnapshot(),
    step: "done",
    openedStages: true,
    openedRegion: true,
    summoned: true,
    enhanced: true,
    partySet: true,
    equipped: true,
    welcomeSeen: true,
    hasBattleDrop: false,
  };
}

export function onboardStorageKey(userId: string): string {
  return `${ONBOARD_STORAGE_PREFIX}.${userId}`;
}

export function readOnboardSnapshot(userId: string | null | undefined): OnboardSnapshot {
  if (!userId) return defaultOnboardSnapshot();
  try {
    const raw = localStorage.getItem(onboardStorageKey(userId));
    if (!raw) return defaultOnboardSnapshot();
    const parsed = JSON.parse(raw) as Partial<OnboardSnapshot>;
    return {
      ...defaultOnboardSnapshot(),
      ...parsed,
      step: normalizeStep(parsed.step),
      openedStages: Boolean(parsed.openedStages),
      openedRegion: Boolean(parsed.openedRegion),
      summoned: Boolean(parsed.summoned),
      enhanced: Boolean(parsed.enhanced),
      partySet: Boolean(parsed.partySet),
      equipped: Boolean(parsed.equipped),
      hasBattleDrop: Boolean(parsed.hasBattleDrop),
      welcomeSeen: Boolean(parsed.welcomeSeen),
    };
  } catch {
    return defaultOnboardSnapshot();
  }
}

export function writeOnboardSnapshot(
  userId: string | null | undefined,
  snap: OnboardSnapshot,
): void {
  if (!userId) return;
  try {
    localStorage.setItem(onboardStorageKey(userId), JSON.stringify(snap));
  } catch {
    /* private / restricted storage */
  }
}

function normalizeStep(step: unknown): OnboardStep {
  switch (step) {
    case "gateway":
    case "stages":
    case "battle":
    case "summon":
    case "enhance":
    case "party":
    case "equip":
    case "done":
      return step;
    default:
      return "gateway";
  }
}

/** Recompute the active step from save flags + checkpoint. */
export function deriveOnboardStep(
  snap: OnboardSnapshot,
  opts?: {
    clearedStages?: string[];
    hasBattleDrop?: boolean;
  },
): OnboardStep {
  if (snap.step === "done") return "done";
  const cleared = opts?.clearedStages ?? [];
  const hasDrop = opts?.hasBattleDrop ?? snap.hasBattleDrop;
  const clearedFirst = cleared.includes(ONBOARD_FIRST_STAGE_ID);
  if (!clearedFirst) {
    if (!snap.openedStages) return "gateway";
    if (!snap.openedRegion) return "stages";
    return "battle";
  }
  if (!snap.summoned) return "summon";
  if (!snap.enhanced) return "enhance";
  if (!snap.partySet) return "party";
  if (hasDrop && !snap.equipped) return "equip";
  return "done";
}

export function advanceOnboard(
  snap: OnboardSnapshot,
  patch: Partial<OnboardSnapshot>,
  opts?: { clearedStages?: string[]; hasBattleDrop?: boolean },
): OnboardSnapshot {
  const next: OnboardSnapshot = { ...snap, ...patch };
  next.step = deriveOnboardStep(next, {
    clearedStages: opts?.clearedStages,
    hasBattleDrop: opts?.hasBattleDrop ?? next.hasBattleDrop,
  });
  return next;
}

export type OnboardObjective = {
  step: OnboardStep;
  titleKey: string;
  detailKey: string;
  ctaKey?: string;
  /** Building / nav hint for spotlight. */
  focus?: "gateway" | "summon" | "enhance" | "stages" | "equip" | "party";
};

export function onboardObjective(step: OnboardStep): OnboardObjective | null {
  switch (step) {
    case "gateway":
      return {
        step,
        titleKey: "ui.onboard.gatewayTitle",
        detailKey: "ui.onboard.gatewayDetail",
        ctaKey: "ui.onboard.gatewayCta",
        focus: "gateway",
      };
    case "stages":
      return {
        step,
        titleKey: "ui.onboard.stagesTitle",
        detailKey: "ui.onboard.stagesDetail",
        ctaKey: "ui.onboard.stagesCta",
        focus: "stages",
      };
    case "battle":
      return {
        step,
        titleKey: "ui.onboard.battleTitle",
        detailKey: "ui.onboard.battleDetail",
        ctaKey: "ui.onboard.battleCta",
        focus: "stages",
      };
    case "summon":
      return {
        step,
        titleKey: "ui.onboard.summonTitle",
        detailKey: "ui.onboard.summonDetail",
        ctaKey: "ui.onboard.summonCta",
        focus: "summon",
      };
    case "enhance":
      return {
        step,
        titleKey: "ui.onboard.enhanceTitle",
        detailKey: "ui.onboard.enhanceDetail",
        ctaKey: "ui.onboard.enhanceCta",
        focus: "enhance",
      };
    case "party":
      return {
        step,
        titleKey: "ui.onboard.partyTitle",
        detailKey: "ui.onboard.partyDetail",
        ctaKey: "ui.onboard.partyCta",
        focus: "party",
      };
    case "equip":
      return {
        step,
        titleKey: "ui.onboard.equipTitle",
        detailKey: "ui.onboard.equipDetail",
        ctaKey: "ui.onboard.equipCta",
        focus: "equip",
      };
    default:
      return null;
  }
}

export function onboardFocusSpotId(step: OnboardStep): string | null {
  switch (step) {
    case "gateway":
      return "gateway";
    case "summon":
      return "summon_hearth";
    case "enhance":
    case "equip":
      return null;
    case "party":
      return "party";
    default:
      return null;
  }
}

/** Flatten for PlayerSave.onboardRite / cloud sync. */
export function toOnboardRiteSave(snap: OnboardSnapshot): {
  step: string;
  openedStages: boolean;
  openedRegion: boolean;
  summoned: boolean;
  enhanced: boolean;
  partySet: boolean;
  equipped: boolean;
  hasBattleDrop: boolean;
  welcomeSeen: boolean;
} {
  return {
    step: snap.step,
    openedStages: snap.openedStages,
    openedRegion: snap.openedRegion,
    summoned: snap.summoned,
    enhanced: snap.enhanced,
    partySet: snap.partySet,
    equipped: snap.equipped,
    hasBattleDrop: snap.hasBattleDrop,
    welcomeSeen: snap.welcomeSeen,
  };
}

/** Restore from PlayerSave.onboardRite blob. */
export function fromOnboardRiteSave(raw: unknown): OnboardSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<OnboardSnapshot>;
  return {
    ...defaultOnboardSnapshot(),
    ...parsed,
    step: normalizeStep(parsed.step),
    openedStages: Boolean(parsed.openedStages),
    openedRegion: Boolean(parsed.openedRegion),
    summoned: Boolean(parsed.summoned),
    enhanced: Boolean(parsed.enhanced),
    partySet: Boolean(parsed.partySet),
    equipped: Boolean(parsed.equipped),
    hasBattleDrop: Boolean(parsed.hasBattleDrop),
    welcomeSeen: Boolean(parsed.welcomeSeen),
  };
}
