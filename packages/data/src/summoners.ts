import { SKILL_DMG_MUL } from "./combatTune.js";
import type { Element } from "./monsters.js";
import { summonerSkillDescKo, summonerSkillVfx } from "./summonerSkillMeta.js";
import { summonerSkillVfxId } from "./skillVisuals.js";

export type MagicBranch = "A" | "B";

export type MagicSkillSlot =
  | "A"
  | "B"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "B1"
  | "B2"
  | "B3"
  | "B4";

export type SummonerMagicSkillKind =
  | "aoe_damage"
  | "single_damage"
  | "ally_buff_atk"
  | "ally_buff_spd"
  | "ally_buff_crit"
  | "ally_heal"
  | "ally_shield"
  | "enemy_debuff"
  | "amplify"
  | "dual_stone"
  | "board_clean"
  | "damage_reduce"
  | "enemy_ailment"
  | "ally_cleanse";

export interface SummonerLeaderDef {
  id: string;
  nameKo: string;
  /** Ally ATK multiplier bonus (0.22 = +22%). */
  atkPct?: number;
  /** Extra ATK% for matching element monsters. */
  elementAtkPct?: number;
  /** Ally HP multiplier bonus. */
  hpPct?: number;
  /** Ally SPD multiplier bonus. */
  spdPct?: number;
  /** Flat accuracy bonus. */
  accuracyFlat?: number;
  /** Incoming damage multiplier (0.92 = -8%). */
  damageTakenMul?: number;
  /** Flat crit rate bonus. */
  critRateFlat?: number;
  /** Flat crit damage bonus. */
  critDmgFlat?: number;
}

export interface SummonerMagicSkillDef {
  slot: MagicSkillSlot;
  id: string;
  nameKo: string;
  /** Mana cost as fraction of manaMax (1 = full bar). */
  manaCostFrac: number;
  kind: SummonerMagicSkillKind;
  /** Primary power coeff / heal coeff / buff amount depending on kind. */
  power: number;
  /** Optional secondary (e.g. DoT turns, buff turns). */
  turns?: number;
  /** Rank scaling per enhance level (added to power). */
  rankScale?: number;
  /**
   * How many units this skill hits.
   * - omitted / 0: legacy full side (all allies or all enemies)
   * - 1: single target
   * - 2..5: multi-target pick among living units on that side
   */
  hitCount?: number;
  /** Flavor description shown in UI. */
  descKo?: string;
  /** Stable art/VFX identity. */
  vfxId?: string;
  /** Battle VFX routing override. */
  vfxFamily?: "melee" | "bolt" | "nova" | "support";
  /** Projectile travels as a glowing orb. */
  orbBolt?: boolean;
  /** Multi-hit strikes against each selected target (damage kinds). */
  hits?: number;
  /** On-hit or dedicated ailment payload. */
  ailment?: {
    kind: "burn" | "poison" | "stun" | "freeze" | "sleep" | "silence";
    turns: number;
    chance: number;
  };
  /** ally_cleanse: number of debuffs to remove. */
  cleanseCount?: number;
}

export interface SummonerKitDef {
  element: Element;
  labelKo: string;
  leader: SummonerLeaderDef;
  skills: Record<MagicSkillSlot, SummonerMagicSkillDef>;
}

/** Enhance cost for magic skill rank n → n+1 (0-indexed current rank). */
export function magicEnhanceManaCost(rank: number): number {
  // Steeper curve so each +1 is a deliberate spend (~2.5–3× prior).
  return 500 + rank * 450;
}

export function magicEnhanceCrystalCost(rank: number): number {
  // Crystal from +2 onward (was +3).
  return rank >= 2 ? 1 + (rank - 2) : 0;
}

/** Matching-element awaken essence spent on each enhance attempt. */
export function magicEnhanceEssenceCost(rank: number): {
  low: number;
  mid: number;
  high: number;
} {
  const r = Math.max(0, Math.min(4, Math.floor(rank)));
  const table = [
    { low: 6, mid: 0, high: 0 },
    { low: 10, mid: 1, high: 0 },
    { low: 12, mid: 3, high: 0 },
    { low: 8, mid: 6, high: 1 },
    { low: 6, mid: 8, high: 2 },
  ] as const;
  return { ...table[r]! };
}

/** Success chance for rank n → n+1 (resources always consumed). */
export function magicEnhanceSuccessRate(rank: number): number {
  const r = Math.max(0, Math.min(4, Math.floor(rank)));
  return ([1, 0.85, 0.7, 0.55, 0.4] as const)[r]!;
}

export const MAX_MAGIC_RANK = 5;

/** Summoner level required to enhance from current rank → rank+1. */
export const MAGIC_ENHANCE_REQUIRED_LEVEL = [1, 5, 10, 15, 20] as const;

export function magicEnhanceRequiredLevel(currentRank: number): number {
  const i = Math.max(
    0,
    Math.min(
      MAGIC_ENHANCE_REQUIRED_LEVEL.length - 1,
      Math.floor(currentRank),
    ),
  );
  return MAGIC_ENHANCE_REQUIRED_LEVEL[i]!;
}

export const SUMMONER_KITS: Record<Element, SummonerKitDef> = {
  fire: {
    element: "fire",
    labelKo: "화염",
    leader: {
      id: "leader_fire",
      nameKo: "작열 지휘",
      atkPct: 0.22,
      elementAtkPct: 0.08,
    },
    skills: {
      A: {
        slot: "A",
        id: "fire_open",
        nameKo: "화염일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.15,
        rankScale: 0.14,
        hitCount: 1,
      },
      B: {
        slot: "B",
        id: "fire_rage",
        nameKo: "분노의 불씨",
        manaCostFrac: 0.45,
        kind: "ally_buff_atk",
        power: 0.22,
        turns: 2,
        rankScale: 0.035,
        hitCount: 1,
      },
      A1: {
        slot: "A1",
        id: "fire_scorch",
        nameKo: "작열일섬",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.55,
        rankScale: 0.16,
        hitCount: 1,
      },
      A2: {
        slot: "A2",
        id: "fire_magma",
        nameKo: "용암파열",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.4,
        rankScale: 0.1,
        hitCount: 1,
        hits: 3,
        ailment: { kind: "burn", turns: 2, chance: 0.45 },
      },
      B1: {
        slot: "B1",
        id: "fire_charge",
        nameKo: "전열의 불꽃",
        manaCostFrac: 0.5,
        kind: "ally_buff_crit",
        power: 0.28,
        turns: 2,
        rankScale: 0.04,
        hitCount: 1,
      },
      B2: {
        slot: "B2",
        id: "fire_amp",
        nameKo: "폭염증폭",
        manaCostFrac: 0.55,
        kind: "amplify",
        power: 0.22,
        rankScale: 0.035,
      },
      A3: {
        slot: "A3",
        id: "fire_nova",
        nameKo: "화염신검",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 3.15,
        rankScale: 0.2,
        hitCount: 1,
      },
      A4: {
        slot: "A4",
        id: "fire_meteor",
        nameKo: "운석연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.95,
        rankScale: 0.13,
        hitCount: 5,
      },
      B3: {
        slot: "B3",
        id: "fire_bloodlust",
        nameKo: "혈염고취",
        manaCostFrac: 0.55,
        kind: "enemy_ailment",
        power: 0,
        turns: 2,
        rankScale: 0.03,
        hitCount: 2,
        ailment: { kind: "burn", turns: 2, chance: 0.85 },
      },
      B4: {
        slot: "B4",
        id: "fire_overheat",
        nameKo: "과열전군",
        manaCostFrac: 0.6,
        kind: "ally_buff_atk",
        power: 0.28,
        turns: 3,
        rankScale: 0.04,
        hitCount: 5,
      },
    },
  },
  water: {
    element: "water",
    labelKo: "심해",
    leader: {
      id: "leader_water",
      nameKo: "심해의 가호",
      hpPct: 0.25,
    },
    skills: {
      A: {
        slot: "A",
        id: "water_open",
        nameKo: "심해일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.1,
        rankScale: 0.14,
        hitCount: 1,
      },
      B: {
        slot: "B",
        id: "water_heal",
        nameKo: "치유물방울",
        manaCostFrac: 0.4,
        kind: "ally_heal",
        power: 0.32,
        rankScale: 0.045,
        hitCount: 1,
      },
      A1: {
        slot: "A1",
        id: "water_freeze",
        nameKo: "빙결일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.5,
        turns: 1,
        rankScale: 0.16,
        hitCount: 1,
      },
      A2: {
        slot: "A2",
        id: "water_tide",
        nameKo: "해일연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.5,
        rankScale: 0.07,
        hitCount: 0,
        hits: 2,
        ailment: { kind: "freeze", turns: 1, chance: 0.35 },
      },
      B1: {
        slot: "B1",
        id: "water_veil",
        nameKo: "가호수막",
        manaCostFrac: 0.45,
        kind: "ally_shield",
        power: 0.24,
        rankScale: 0.035,
        hitCount: 1,
      },
      B2: {
        slot: "B2",
        id: "water_cycle",
        nameKo: "생명방울",
        manaCostFrac: 0.5,
        kind: "ally_cleanse",
        power: 0,
        rankScale: 0.025,
        hitCount: 3,
        cleanseCount: 2,
      },
      A3: {
        slot: "A3",
        id: "water_abyss",
        nameKo: "심연일검",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 3.05,
        turns: 2,
        rankScale: 0.2,
        hitCount: 1,
      },
      A4: {
        slot: "A4",
        id: "water_geyser",
        nameKo: "용솟음연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.9,
        rankScale: 0.13,
        hitCount: 5,
      },
      B3: {
        slot: "B3",
        id: "water_bless",
        nameKo: "치유연파",
        manaCostFrac: 0.55,
        kind: "ally_heal",
        power: 0.3,
        rankScale: 0.045,
        hitCount: 3,
      },
      B4: {
        slot: "B4",
        id: "water_sanctuary",
        nameKo: "심해성역",
        manaCostFrac: 0.6,
        kind: "ally_shield",
        power: 0.28,
        turns: 3,
        rankScale: 0.04,
        hitCount: 5,
      },
    },
  },
  wind: {
    element: "wind",
    labelKo: "질풍",
    leader: {
      id: "leader_wind",
      nameKo: "질풍 지휘",
      spdPct: 0.18,
      accuracyFlat: 0.08,
    },
    skills: {
      A: {
        slot: "A",
        id: "wind_open",
        nameKo: "질풍일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.1,
        rankScale: 0.14,
        hitCount: 1,
      },
      B: {
        slot: "B",
        id: "wind_haste",
        nameKo: "순풍의 숨",
        manaCostFrac: 0.4,
        kind: "ally_buff_spd",
        power: 0.2,
        turns: 2,
        rankScale: 0.035,
        hitCount: 1,
      },
      A1: {
        slot: "A1",
        id: "wind_pierce",
        nameKo: "관통일섬",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.5,
        rankScale: 0.16,
        hitCount: 1,
      },
      A2: {
        slot: "A2",
        id: "wind_blade",
        nameKo: "바람칼날",
        manaCostFrac: 0.9,
        kind: "single_damage",
        power: 2.1,
        turns: 2,
        rankScale: 0.08,
        hitCount: 1,
        hits: 3,
        ailment: { kind: "sleep", turns: 1, chance: 0.35 },
      },
      B1: {
        slot: "B1",
        id: "wind_dual",
        nameKo: "쌍석배치",
        manaCostFrac: 0.5,
        kind: "dual_stone",
        power: 0,
        rankScale: 0,
      },
      B2: {
        slot: "B2",
        id: "wind_clean",
        nameKo: "청풍정화",
        manaCostFrac: 0.5,
        kind: "board_clean",
        power: 0,
        rankScale: 0,
      },
      A3: {
        slot: "A3",
        id: "wind_razor",
        nameKo: "풍인참",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 3.05,
        rankScale: 0.2,
        hitCount: 1,
      },
      A4: {
        slot: "A4",
        id: "wind_storm",
        nameKo: "폭풍연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.9,
        rankScale: 0.13,
        hitCount: 5,
      },
      B3: {
        slot: "B3",
        id: "wind_gale",
        nameKo: "질풍고취",
        manaCostFrac: 0.55,
        kind: "ally_buff_spd",
        power: 0.26,
        turns: 3,
        rankScale: 0.04,
        hitCount: 3,
      },
      B4: {
        slot: "B4",
        id: "wind_gale",
        nameKo: "질풍전령",
        manaCostFrac: 0.5,
        kind: "enemy_ailment",
        power: 0,
        turns: 2,
        rankScale: 0.03,
        hitCount: 2,
        ailment: { kind: "silence", turns: 2, chance: 0.7 },
      },
    },
  },
  light: {
    element: "light",
    labelKo: "성광",
    leader: {
      id: "leader_light",
      nameKo: "성광의 가호",
      hpPct: 0.12,
      damageTakenMul: 0.94,
    },
    skills: {
      A: {
        slot: "A",
        id: "light_open",
        nameKo: "성광일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.1,
        rankScale: 0.14,
        hitCount: 1,
      },
      B: {
        slot: "B",
        id: "light_ward",
        nameKo: "수호의 빛",
        manaCostFrac: 0.45,
        kind: "ally_shield",
        power: 0.24,
        turns: 2,
        rankScale: 0.035,
        hitCount: 1,
      },
      A1: {
        slot: "A1",
        id: "light_smite",
        nameKo: "심판일섬",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.55,
        rankScale: 0.16,
        hitCount: 1,
        hits: 2,
        ailment: { kind: "stun", turns: 1, chance: 0.35 },
      },
      A2: {
        slot: "A2",
        id: "light_radiance",
        nameKo: "광휘연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.7,
        rankScale: 0.11,
        hitCount: 3,
      },
      B1: {
        slot: "B1",
        id: "light_heal",
        nameKo: "치유의 빛",
        manaCostFrac: 0.45,
        kind: "ally_heal",
        power: 0.3,
        rankScale: 0.045,
        hitCount: 1,
      },
      B2: {
        slot: "B2",
        id: "light_guard",
        nameKo: "수호진언",
        manaCostFrac: 0.5,
        kind: "damage_reduce",
        power: 0.18,
        turns: 2,
        rankScale: 0.03,
        hitCount: 1,
      },
      A3: {
        slot: "A3",
        id: "light_judgement",
        nameKo: "성역참",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 3.1,
        rankScale: 0.2,
        hitCount: 1,
      },
      A4: {
        slot: "A4",
        id: "light_nova",
        nameKo: "성광연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.95,
        rankScale: 0.13,
        hitCount: 5,
      },
      B3: {
        slot: "B3",
        id: "light_bless",
        nameKo: "치유광파",
        manaCostFrac: 0.55,
        kind: "ally_cleanse",
        power: 0,
        rankScale: 0.03,
        hitCount: 3,
        cleanseCount: 3,
      },
      B4: {
        slot: "B4",
        id: "light_aegis",
        nameKo: "전군수호",
        manaCostFrac: 0.6,
        kind: "ally_shield",
        power: 0.28,
        turns: 3,
        rankScale: 0.04,
        hitCount: 5,
      },
    },
  },
  dark: {
    element: "dark",
    labelKo: "심연",
    leader: {
      id: "leader_dark",
      nameKo: "심연의 저주",
      critRateFlat: 0.1,
      critDmgFlat: 0.15,
    },
    skills: {
      A: {
        slot: "A",
        id: "dark_open",
        nameKo: "심연일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.2,
        rankScale: 0.14,
        hitCount: 1,
      },
      B: {
        slot: "B",
        id: "dark_curse",
        nameKo: "저주의 씨앗",
        manaCostFrac: 0.45,
        kind: "enemy_ailment",
        power: 0,
        turns: 3,
        rankScale: 0.02,
        hitCount: 3,
        ailment: { kind: "poison", turns: 3, chance: 0.8 },
      },
      A1: {
        slot: "A1",
        id: "dark_slash",
        nameKo: "암흑일섬",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.6,
        rankScale: 0.16,
        hitCount: 1,
      },
      A2: {
        slot: "A2",
        id: "dark_wave",
        nameKo: "심연연격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.7,
        rankScale: 0.11,
        hitCount: 3,
      },
      B1: {
        slot: "B1",
        id: "dark_hex",
        nameKo: "약화저주",
        manaCostFrac: 0.5,
        kind: "enemy_debuff",
        power: 0.22,
        turns: 2,
        rankScale: 0.035,
        hitCount: 1,
      },
      B2: {
        slot: "B2",
        id: "dark_crit",
        nameKo: "암영고취",
        manaCostFrac: 0.5,
        kind: "ally_buff_crit",
        power: 0.26,
        turns: 2,
        rankScale: 0.04,
        hitCount: 1,
      },
      A3: {
        slot: "A3",
        id: "dark_execute",
        nameKo: "심연처형",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 3.2,
        rankScale: 0.2,
        hitCount: 1,
      },
      A4: {
        slot: "A4",
        id: "dark_storm",
        nameKo: "암연연격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.7,
        rankScale: 0.11,
        hitCount: 1,
        hits: 4,
        ailment: { kind: "silence", turns: 1, chance: 0.3 },
      },
      B3: {
        slot: "B3",
        id: "dark_plague",
        nameKo: "역병저주",
        manaCostFrac: 0.55,
        kind: "enemy_debuff",
        power: 0.24,
        turns: 3,
        rankScale: 0.04,
        hitCount: 3,
      },
      B4: {
        slot: "B4",
        id: "dark_ruin",
        nameKo: "전장저주",
        manaCostFrac: 0.6,
        kind: "enemy_debuff",
        power: 0.22,
        turns: 3,
        rankScale: 0.04,
        hitCount: 5,
      },
    },
  }
};

for (const kit of Object.values(SUMMONER_KITS)) {
  for (const sk of Object.values(kit.skills)) {
    const vfx = summonerSkillVfx(sk.kind, sk.manaCostFrac);
    sk.descKo = summonerSkillDescKo(sk.kind, kit.element);
    sk.vfxFamily = vfx.vfxFamily;
    sk.vfxId = summonerSkillVfxId(sk.id);
    if (vfx.orbBolt) sk.orbBolt = true;
  }
}

export function getSummonerKit(element: Element): SummonerKitDef {
  return SUMMONER_KITS[element];
}

export function getSummonerLeader(element: Element): SummonerLeaderDef {
  return SUMMONER_KITS[element].leader;
}

export function magicSkillPower(
  def: SummonerMagicSkillDef,
  rank: number,
): number {
  const raw =
    def.power +
    (def.rankScale ?? 0) * Math.max(0, Math.min(MAX_MAGIC_RANK, rank));
  if (def.kind === "aoe_damage" || def.kind === "single_damage") {
    return Math.round(raw * SKILL_DMG_MUL * 100) / 100;
  }
  return raw;
}

export type SummonerMagicProgress = {
  /** Rank 0..5 per base/upper skill id. */
  ranks: Partial<Record<string, number>>;
  /** First base skill that reached +5; unlocks that branch's uppers. */
  branch: MagicBranch | null;
};

export function emptyMagicProgress(): SummonerMagicProgress {
  return { ranks: {}, branch: null };
}

export function magicRank(
  progress: SummonerMagicProgress | undefined,
  skillId: string,
): number {
  return Math.max(0, Math.min(MAX_MAGIC_RANK, progress?.ranks[skillId] ?? 0));
}

/** Mid-tier (A1/A2 or B1/B2) both maxed → unlocks tier-2 pair. */
export function magicTier2Unlocked(
  element: Element,
  progress: SummonerMagicProgress | undefined,
): boolean {
  if (!progress?.branch) return false;
  const kit = SUMMONER_KITS[element];
  if (progress.branch === "A") {
    return (
      magicRank(progress, kit.skills.A1.id) >= MAX_MAGIC_RANK &&
      magicRank(progress, kit.skills.A2.id) >= MAX_MAGIC_RANK
    );
  }
  return (
    magicRank(progress, kit.skills.B1.id) >= MAX_MAGIC_RANK &&
    magicRank(progress, kit.skills.B2.id) >= MAX_MAGIC_RANK
  );
}

/** Skills usable in battle for this summoner element + progress. */
export function unlockedMagicSkills(
  element: Element,
  progress: SummonerMagicProgress | undefined,
): SummonerMagicSkillDef[] {
  const kit = SUMMONER_KITS[element];
  const out: SummonerMagicSkillDef[] = [kit.skills.A, kit.skills.B];
  const branch = progress?.branch;
  if (branch === "A") {
    out.push(kit.skills.A1, kit.skills.A2);
    if (magicTier2Unlocked(element, progress)) {
      out.push(kit.skills.A3, kit.skills.A4);
    }
  } else if (branch === "B") {
    out.push(kit.skills.B1, kit.skills.B2);
    if (magicTier2Unlocked(element, progress)) {
      out.push(kit.skills.B3, kit.skills.B4);
    }
  }
  return out;
}

/** Default battle loadout: always-unlocked basic magic skills A + B. */
export function defaultSummonerMagicLoadout(element: Element): [string, string] {
  const kit = SUMMONER_KITS[element];
  return [kit.skills.A.id, kit.skills.B.id];
}

export function tryUnlockMagicBranch(
  element: Element,
  progress: SummonerMagicProgress,
): SummonerMagicProgress {
  if (progress.branch) return progress;
  const kit = SUMMONER_KITS[element];
  const aRank = magicRank(progress, kit.skills.A.id);
  const bRank = magicRank(progress, kit.skills.B.id);
  if (aRank >= MAX_MAGIC_RANK) return { ...progress, branch: "A" };
  if (bRank >= MAX_MAGIC_RANK) return { ...progress, branch: "B" };
  return progress;
}
