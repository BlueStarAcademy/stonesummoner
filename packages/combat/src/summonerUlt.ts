import { SKILL_DMG_MUL } from "stonesummoner-data";
import type { SummonerState } from "./types.js";

/** Composed full-mana summoner signature (진문개방 base + skill-tree modules). */
export interface ComposedSummonerUlt {
  /** Skill coeff for AoE hits on enemy monsters. */
  coeff: number;
  /** Temporary skill Amplify added for this cast. */
  skillAmplifyBonus: number;
  /** Persistent Amplify after cast. */
  amplifyDelta: number;
  /** Fraction of manaMax restored after spending full mana (0–1). */
  manaRefundFrac: number;
  /** Extra stone play after ult (dual_mastery). */
  bonusStone: boolean;
  /** Clear 3×3 neighborhood (clean_mastery). */
  boardClean: boolean;
  /** Short Amplify floor bump (declare_mastery). */
  declareAmpBump: boolean;
  /** Ally ATK buff duration in ATB ticks (leader / war_chorus). */
  leaderAtkBuffTicks: number;
  /** Flat ATK% for leader buff (0.05 = +5%). */
  leaderAtkBuffPct: number;
  /** Human-readable modules applied (for logs / UI). */
  modules: string[];
}

const TREE = {
  power: ["root_power", "power_focus"] as const,
  sense: ["root_sense", "sense_start", "sense_tide"] as const,
  mana: ["root_mana", "mana_pool", "abyss_well"] as const,
  leader: ["leader_aura", "war_chorus"] as const,
  dual: ["dual_mastery", "dual_surge"] as const,
  clean: ["clean_mastery", "clean_surge"] as const,
  declare: ["declare_mastery"] as const,
};

function hasAny(unlocked: Set<string>, ids: readonly string[]): boolean {
  return ids.some((id) => unlocked.has(id));
}

/**
 * Build the full-mana signature skill from summoner state + unlocked tree nodes.
 * Base = 진문개방 AoE; branches add coeff / Amp / refund / side effects.
 */
export function composeSummonerUlt(sm: SummonerState): ComposedSummonerUlt {
  const unlocked = new Set(sm.skillTreeUnlocked ?? []);
  const modules: string[] = ["base_open"];
  const powerBonus = sm.skillPowerBonus ?? 0;

  let coeff = 1.8 * SKILL_DMG_MUL * (1 + powerBonus);
  let skillAmplifyBonus = 0.15;
  let amplifyDelta = 0;
  let manaRefundFrac = 0;
  let bonusStone = false;
  let boardClean = false;
  let declareAmpBump = false;
  let leaderAtkBuffTicks = 0;
  let leaderAtkBuffPct = 0;

  if (hasAny(unlocked, TREE.power)) {
    coeff *= 1.08;
    skillAmplifyBonus += 0.03;
    modules.push("power");
  }
  if (unlocked.has("power_focus")) {
    coeff *= 1.05;
    modules.push("power_focus");
  }

  if (hasAny(unlocked, TREE.sense)) {
    amplifyDelta += 0.04 + (sm.boardSense ?? 0) * 0.15;
    skillAmplifyBonus += 0.02;
    modules.push("sense");
  }
  if (unlocked.has("sense_tide")) {
    amplifyDelta += 0.03;
    modules.push("sense_tide");
  }

  if (hasAny(unlocked, TREE.mana)) {
    manaRefundFrac += 0.08;
    modules.push("mana");
  }
  if (unlocked.has("abyss_well")) {
    manaRefundFrac += 0.07;
    modules.push("abyss_well");
  }

  if (hasAny(unlocked, TREE.dual)) {
    bonusStone = true;
    modules.push("dual_mastery");
  }
  if (hasAny(unlocked, TREE.clean)) {
    boardClean = true;
    amplifyDelta += 0.02 + (sm.cleanAmpBonus ?? 0);
    modules.push("clean_mastery");
  }
  if (hasAny(unlocked, TREE.declare)) {
    declareAmpBump = true;
    amplifyDelta += 0.02 + (sm.declarePowerBonus ?? 0) * 0.5;
    modules.push("declare_mastery");
  }

  if (hasAny(unlocked, TREE.leader)) {
    leaderAtkBuffTicks = unlocked.has("war_chorus") ? 3 : 2;
    leaderAtkBuffPct = unlocked.has("war_chorus") ? 0.08 : 0.05;
    modules.push(unlocked.has("war_chorus") ? "war_chorus" : "leader_aura");
  }

  return {
    coeff,
    skillAmplifyBonus,
    amplifyDelta,
    manaRefundFrac: Math.min(0.35, manaRefundFrac),
    bonusStone,
    boardClean,
    declareAmpBump,
    leaderAtkBuffTicks,
    leaderAtkBuffPct,
    modules,
  };
}
