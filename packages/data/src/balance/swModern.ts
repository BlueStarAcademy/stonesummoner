/**
 * Modern Summoners War reference snapshot for StoneSummoner balance work.
 *
 * This file intentionally contains reference data only. Values are not live
 * game configuration and are not exported from the package root.
 *
 * Sources (captured 2026-09-01):
 * - Scenario structure: https://summonerswar.fandom.com/wiki/Scenario
 * - Scenario energy/XP: https://summonerswar.fandom.com/wiki/Faimon_Volcano
 * - Modern Cairos recompression:
 *   https://m-mercury.qpyou.cn/custom/board_detail/527
 * - Cairos floor levels and historical drop bands:
 *   https://summonerswar.fandom.com/wiki/Giant%27s_Keep
 * - Abyss floor metadata:
 *   https://swarfarm.com/bestiary/dungeons/giants-keep-abyss/2/
 *   https://summonerswarskyarena.info/giants-keep-abyss/
 *
 * See docs/balance/summoners-war-modern.md for provenance and caveats.
 */

export type SwEvidenceKind =
  | "published-rule"
  | "community-table"
  | "community-measurement"
  | "design-synthesis";

export type SwConfidence = "high" | "medium" | "low";

export interface SwProvenance {
  readonly evidence: SwEvidenceKind;
  readonly confidence: SwConfidence;
  readonly note: string;
}

export const SW_MODERN_SNAPSHOT = {
  capturedOn: "2026-09-01",
  baseline: "post-RELOADED B1-B10 plus Abyss Normal/Hard (6★ ceiling)",
  game: "Summoners War: Sky Arena",
} as const;

export type SwScenarioDifficulty = "normal" | "hard" | "hell";

export interface SwScenarioDifficultyProfile {
  readonly energyStages1To6: number;
  readonly energyBossStage7: number;
  readonly rewardRank: 1 | 2 | 3;
}

/**
 * Scenario is 13 areas × 7 stages × 3 difficulties. The seventh stage is the
 * area boss. Faimon's community table shows the boss-stage +1 energy through
 * its XP/energy denominators (549, 729 and 900 respectively).
 */
export const SW_SCENARIO_STRUCTURE = {
  areaCount: 13,
  stagesPerArea: 7,
  regularStageCount: 6,
  bossStage: 7,
  partySize: 4,
  difficulties: ["normal", "hard", "hell"],
  provenance: {
    evidence: "community-table",
    confidence: "high",
    note: "Stable scenario topology; individual onboarding stages can be special cases.",
  },
} as const satisfies {
  readonly areaCount: number;
  readonly stagesPerArea: number;
  readonly regularStageCount: number;
  readonly bossStage: number;
  readonly partySize: number;
  readonly difficulties: readonly SwScenarioDifficulty[];
  readonly provenance: SwProvenance;
};

export const SW_SCENARIO_DIFFICULTY: Readonly<
  Record<SwScenarioDifficulty, SwScenarioDifficultyProfile>
> = {
  normal: { energyStages1To6: 3, energyBossStage7: 4, rewardRank: 1 },
  hard: { energyStages1To6: 4, energyBossStage7: 5, rewardRank: 2 },
  hell: { energyStages1To6: 5, energyBossStage7: 6, rewardRank: 3 },
};

export interface SwScenarioXpAnchor {
  readonly area: "faimon-volcano";
  readonly stage: 1;
  readonly difficulty: SwScenarioDifficulty;
  readonly energy: number;
  /** XP awarded across four occupied player-monster slots. */
  readonly partyXp: number;
  readonly xpPerOccupiedSlot: number;
  readonly grossPartyXpPerEnergy: number;
  readonly provenance: SwProvenance;
}

/**
 * Faimon 1 is used as an anchor because its post-v5.0.8 values are one of the
 * few community tables explicitly marked as remeasured after the XP increase.
 * XP boosters, max-level redistribution and friend representatives are absent.
 */
export const SW_SCENARIO_XP_ANCHORS = [
  {
    area: "faimon-volcano",
    stage: 1,
    difficulty: "normal",
    energy: 3,
    partyXp: 3024,
    xpPerOccupiedSlot: 756,
    grossPartyXpPerEnergy: 1008,
    provenance: {
      evidence: "community-measurement",
      confidence: "medium",
      note: "Post-v5.0.8 Fandom table; no XP booster or friend-rep adjustment.",
    },
  },
  {
    area: "faimon-volcano",
    stage: 1,
    difficulty: "hard",
    energy: 4,
    partyXp: 5104,
    xpPerOccupiedSlot: 1276,
    grossPartyXpPerEnergy: 1276,
    provenance: {
      evidence: "community-measurement",
      confidence: "medium",
      note: "Post-v5.0.8 Fandom table; no XP booster or friend-rep adjustment.",
    },
  },
  {
    area: "faimon-volcano",
    stage: 1,
    difficulty: "hell",
    energy: 5,
    partyXp: 10920,
    xpPerOccupiedSlot: 2730,
    grossPartyXpPerEnergy: 2184,
    provenance: {
      evidence: "community-measurement",
      confidence: "medium",
      note: "Post-v5.0.8 Fandom table; no XP booster or friend-rep adjustment.",
    },
  },
] as const satisfies readonly SwScenarioXpAnchor[];

export type SwCairosFloor =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export type SwRuneStars = 1 | 2 | 3 | 4 | 5 | 6;

export interface SwCairosFloorProfile {
  readonly floor: SwCairosFloor;
  readonly energy: number;
  /** Representative boss level; trash/tower levels can differ. */
  readonly enemyLevelAnchor: number;
  /** Observed/advertised grade support, not a probability distribution. */
  readonly runeStars: {
    readonly min: SwRuneStars;
    readonly max: SwRuneStars;
  };
  readonly provenance: SwProvenance;
}

/**
 * Modern core-rune-dungeon ladder shared as a generic Giant/Dragon/Necro
 * reference. B10 reflects the RELOADED recompression: former B12 rewards at
 * 8 energy and a level-75 difficulty anchor. Lower-floor grade bands retain
 * the community-table support ranges; omitted grades may still appear in old
 * samples whose collection predates the recompression.
 */
export const SW_CAIROS_B1_B10 = [
  { floor: 1, energy: 5, enemyLevelAnchor: 12, runeStars: { min: 2, max: 3 } },
  { floor: 2, energy: 5, enemyLevelAnchor: 15, runeStars: { min: 2, max: 3 } },
  { floor: 3, energy: 6, enemyLevelAnchor: 20, runeStars: { min: 2, max: 4 } },
  { floor: 4, energy: 6, enemyLevelAnchor: 25, runeStars: { min: 3, max: 4 } },
  { floor: 5, energy: 7, enemyLevelAnchor: 30, runeStars: { min: 3, max: 5 } },
  { floor: 6, energy: 7, enemyLevelAnchor: 40, runeStars: { min: 3, max: 5 } },
  { floor: 7, energy: 7, enemyLevelAnchor: 50, runeStars: { min: 4, max: 6 } },
  { floor: 8, energy: 8, enemyLevelAnchor: 55, runeStars: { min: 4, max: 6 } },
  { floor: 9, energy: 8, enemyLevelAnchor: 60, runeStars: { min: 4, max: 6 } },
  { floor: 10, energy: 8, enemyLevelAnchor: 75, runeStars: { min: 6, max: 6 } },
].map((profile) => ({
  ...profile,
  provenance: {
    evidence: "community-table",
    confidence: "medium",
    note:
      profile.floor === 10
        ? "RELOADED B10 combines published 8-energy/former-B12 rewards with a community level anchor."
        : "Representative Giant ladder; lower-floor tables are community maintained.",
  },
})) as readonly SwCairosFloorProfile[];

export type SwAbyssDifficulty = "normal" | "hard";

export interface SwAbyssProfile {
  readonly difficulty: SwAbyssDifficulty;
  readonly energy: 8;
  readonly enemyLevelAnchor: 70 | 75;
  readonly runeStars: Readonly<{ min: 6; max: 6 }>;
  readonly intangibleEligible: true;
  readonly duplicateMonstersAllowed: false;
  readonly seasonalBossVariant: true;
  readonly relativeRuneQuality: "high" | "highest";
  readonly provenance: SwProvenance;
}

export const SW_ABYSS_PROFILES: Readonly<
  Record<SwAbyssDifficulty, SwAbyssProfile>
> = {
  normal: {
    difficulty: "normal",
    energy: 8,
    enemyLevelAnchor: 70,
    runeStars: { min: 6, max: 6 },
    intangibleEligible: true,
    duplicateMonstersAllowed: false,
    seasonalBossVariant: true,
    relativeRuneQuality: "high",
    provenance: {
      evidence: "community-table",
      confidence: "medium",
      note: "Abyss B1/Normal profile; boss skills and exact stats vary by season.",
    },
  },
  hard: {
    difficulty: "hard",
    energy: 8,
    enemyLevelAnchor: 75,
    runeStars: { min: 6, max: 6 },
    intangibleEligible: true,
    duplicateMonstersAllowed: false,
    seasonalBossVariant: true,
    relativeRuneQuality: "highest",
    provenance: {
      evidence: "community-table",
      confidence: "high",
      note: "SWARFARM Abyss B2/Hard waves and boss are level 75.",
    },
  },
};

export type SwEfficiencyBand = "low" | "medium" | "high" | "highest";

export type SwModeEfficiencyId =
  | "scenario"
  | "cairos-progression"
  | "cairos-b10"
  | "abyss-normal"
  | "abyss-hard";

export interface SwModeEfficiencyProfile {
  readonly id: SwModeEfficiencyId;
  readonly xpPerEnergy: SwEfficiencyBand;
  readonly runeQualityPerEnergy: SwEfficiencyBand;
  readonly clearTimeBurden: SwEfficiencyBand;
  readonly failureSensitivity: SwEfficiencyBand;
  readonly progressionGate: SwEfficiencyBand;
  readonly primaryUse: "xp" | "rune-progression" | "rune-farming";
  readonly provenance: SwProvenance;
}

/**
 * Qualitative comparison only. These profiles intentionally avoid fake drop
 * percentages: realized efficiency depends on clear time, win rate, events,
 * energy returns and changing drop tables.
 */
export const SW_MODE_EFFICIENCY_PROFILES: Readonly<
  Record<SwModeEfficiencyId, SwModeEfficiencyProfile>
> = {
  scenario: {
    id: "scenario",
    xpPerEnergy: "highest",
    runeQualityPerEnergy: "low",
    clearTimeBurden: "low",
    failureSensitivity: "low",
    progressionGate: "low",
    primaryUse: "xp",
    provenance: {
      evidence: "design-synthesis",
      confidence: "high",
      note: "Community consensus treats repeatable Hell scenario as the XP/fodder lane.",
    },
  },
  "cairos-progression": {
    id: "cairos-progression",
    xpPerEnergy: "low",
    runeQualityPerEnergy: "medium",
    clearTimeBurden: "medium",
    failureSensitivity: "medium",
    progressionGate: "medium",
    primaryUse: "rune-progression",
    provenance: {
      evidence: "design-synthesis",
      confidence: "high",
      note: "Lower floors trade reward ceiling for accessible, reliable clears.",
    },
  },
  "cairos-b10": {
    id: "cairos-b10",
    xpPerEnergy: "low",
    runeQualityPerEnergy: "high",
    clearTimeBurden: "medium",
    failureSensitivity: "medium",
    progressionGate: "high",
    primaryUse: "rune-farming",
    provenance: {
      evidence: "design-synthesis",
      confidence: "high",
      note: "Stable pre-Abyss farming baseline after RELOADED recompression.",
    },
  },
  "abyss-normal": {
    id: "abyss-normal",
    xpPerEnergy: "low",
    runeQualityPerEnergy: "high",
    clearTimeBurden: "high",
    failureSensitivity: "high",
    progressionGate: "high",
    primaryUse: "rune-farming",
    provenance: {
      evidence: "design-synthesis",
      confidence: "medium",
      note: "Higher reward quality can be erased by slow or failed runs.",
    },
  },
  "abyss-hard": {
    id: "abyss-hard",
    xpPerEnergy: "low",
    runeQualityPerEnergy: "highest",
    clearTimeBurden: "highest",
    failureSensitivity: "highest",
    progressionGate: "highest",
    primaryUse: "rune-farming",
    provenance: {
      evidence: "design-synthesis",
      confidence: "medium",
      note: "Best successful-run ceiling, not automatically best realized efficiency.",
    },
  },
};
