import type { Element } from "./monsters.js";

export type MagicBranch = "A" | "B";

export type MagicSkillSlot = "A" | "B" | "A1" | "A2" | "B1" | "B2";

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
  | "damage_reduce";

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
}

export interface SummonerKitDef {
  element: Element;
  labelKo: string;
  leader: SummonerLeaderDef;
  skills: Record<MagicSkillSlot, SummonerMagicSkillDef>;
}

/** Enhance cost for magic skill rank n → n+1 (0-indexed current rank). */
export function magicEnhanceManaCost(rank: number): number {
  return 200 + rank * 150;
}

export function magicEnhanceCrystalCost(rank: number): number {
  return rank >= 3 ? 1 + (rank - 3) : 0;
}

export const MAX_MAGIC_RANK = 5;

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
        nameKo: "화염개방",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.35,
        rankScale: 0.06,
      },
      B: {
        slot: "B",
        id: "fire_rage",
        nameKo: "분노선언",
        manaCostFrac: 0.45,
        kind: "ally_buff_atk",
        power: 0.2,
        turns: 2,
        rankScale: 0.02,
      },
      A1: {
        slot: "A1",
        id: "fire_scorch",
        nameKo: "작열진문",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.55,
        turns: 2,
        rankScale: 0.07,
      },
      A2: {
        slot: "A2",
        id: "fire_magma",
        nameKo: "용암일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.4,
        rankScale: 0.1,
      },
      B1: {
        slot: "B1",
        id: "fire_charge",
        nameKo: "전열돌격",
        manaCostFrac: 0.5,
        kind: "ally_buff_crit",
        power: 0.25,
        turns: 2,
        rankScale: 0.03,
      },
      B2: {
        slot: "B2",
        id: "fire_amp",
        nameKo: "폭염증폭",
        manaCostFrac: 0.55,
        kind: "amplify",
        power: 0.18,
        rankScale: 0.02,
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
        nameKo: "심해개방",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.3,
        rankScale: 0.06,
      },
      B: {
        slot: "B",
        id: "water_heal",
        nameKo: "치유물결",
        manaCostFrac: 0.4,
        kind: "ally_heal",
        power: 0.28,
        rankScale: 0.03,
      },
      A1: {
        slot: "A1",
        id: "water_freeze",
        nameKo: "빙결진문",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.4,
        turns: 1,
        rankScale: 0.06,
      },
      A2: {
        slot: "A2",
        id: "water_tide",
        nameKo: "해일충격",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.5,
        rankScale: 0.07,
      },
      B1: {
        slot: "B1",
        id: "water_veil",
        nameKo: "가호수막",
        manaCostFrac: 0.45,
        kind: "ally_shield",
        power: 0.2,
        rankScale: 0.02,
      },
      B2: {
        slot: "B2",
        id: "water_cycle",
        nameKo: "생명순환",
        manaCostFrac: 0.5,
        kind: "ally_heal",
        power: 0.22,
        rankScale: 0.025,
      },
    },
  },
  wind: {
    element: "wind",
    labelKo: "질풍",
    leader: {
      id: "leader_wind",
      nameKo: "질풍 가속",
      spdPct: 0.2,
    },
    skills: {
      A: {
        slot: "A",
        id: "wind_open",
        nameKo: "질풍개방",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.32,
        rankScale: 0.06,
      },
      B: {
        slot: "B",
        id: "wind_dual",
        nameKo: "쌍착수",
        manaCostFrac: 0.35,
        kind: "dual_stone",
        power: 1,
        rankScale: 0,
      },
      A1: {
        slot: "A1",
        id: "wind_storm",
        nameKo: "폭풍참",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.48,
        rankScale: 0.07,
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
      },
      B1: {
        slot: "B1",
        id: "wind_clean",
        nameKo: "진문청소",
        manaCostFrac: 0.45,
        kind: "board_clean",
        power: 1,
        rankScale: 0,
      },
      B2: {
        slot: "B2",
        id: "wind_haste",
        nameKo: "선풍가속",
        manaCostFrac: 0.45,
        kind: "ally_buff_spd",
        power: 0.22,
        turns: 2,
        rankScale: 0.02,
      },
    },
  },
  light: {
    element: "light",
    labelKo: "신성",
    leader: {
      id: "leader_light",
      nameKo: "신성 결속",
      accuracyFlat: 25,
      damageTakenMul: 0.92,
    },
    skills: {
      A: {
        slot: "A",
        id: "light_open",
        nameKo: "신성개방",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.35,
        rankScale: 0.06,
      },
      B: {
        slot: "B",
        id: "light_guard",
        nameKo: "수호광휘",
        manaCostFrac: 0.4,
        kind: "ally_shield",
        power: 0.18,
        rankScale: 0.02,
      },
      A1: {
        slot: "A1",
        id: "light_judge",
        nameKo: "심판광",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.45,
        rankScale: 0.07,
      },
      A2: {
        slot: "A2",
        id: "light_smite",
        nameKo: "성역타격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.5,
        rankScale: 0.1,
      },
      B1: {
        slot: "B1",
        id: "light_bind",
        nameKo: "결속치유",
        manaCostFrac: 0.5,
        kind: "ally_heal",
        power: 0.24,
        rankScale: 0.025,
      },
      B2: {
        slot: "B2",
        id: "light_aegis",
        nameKo: "무적광환",
        manaCostFrac: 0.55,
        kind: "damage_reduce",
        power: 0.15,
        turns: 2,
        rankScale: 0.02,
      },
    },
  },
  dark: {
    element: "dark",
    labelKo: "심연",
    leader: {
      id: "leader_dark",
      nameKo: "심연 각인",
      critRateFlat: 20,
      critDmgFlat: 15,
    },
    skills: {
      A: {
        slot: "A",
        id: "dark_open",
        nameKo: "심연개방",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.38,
        rankScale: 0.06,
      },
      B: {
        slot: "B",
        id: "dark_curse",
        nameKo: "저주선언",
        manaCostFrac: 0.45,
        kind: "enemy_debuff",
        power: 0.22,
        turns: 2,
        rankScale: 0.02,
      },
      A1: {
        slot: "A1",
        id: "dark_void",
        nameKo: "공허폭발",
        manaCostFrac: 1,
        kind: "aoe_damage",
        power: 1.6,
        rankScale: 0.08,
      },
      A2: {
        slot: "A2",
        id: "dark_drain",
        nameKo: "흡혈일격",
        manaCostFrac: 1,
        kind: "single_damage",
        power: 2.3,
        rankScale: 0.09,
      },
      B1: {
        slot: "B1",
        id: "dark_despair",
        nameKo: "절망각인",
        manaCostFrac: 0.5,
        kind: "enemy_debuff",
        power: 0.3,
        turns: 2,
        rankScale: 0.03,
      },
      B2: {
        slot: "B2",
        id: "dark_veil",
        nameKo: "그림자장막",
        manaCostFrac: 0.5,
        kind: "ally_buff_crit",
        power: 0.2,
        turns: 2,
        rankScale: 0.025,
      },
    },
  },
};

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
  return def.power + (def.rankScale ?? 0) * Math.max(0, Math.min(MAX_MAGIC_RANK, rank));
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
  } else if (branch === "B") {
    out.push(kit.skills.B1, kit.skills.B2);
  }
  return out;
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
