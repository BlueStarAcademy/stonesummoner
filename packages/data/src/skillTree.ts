/** Shallow summoner skill tree — passive nodes, not a full talent labyrinth. */

export type SkillTreeNodeId =
  | "root_mana"
  | "root_sense"
  | "root_power"
  | "mana_pool"
  | "sense_start"
  | "power_focus"
  | "leader_aura"
  | "dual_mastery"
  | "clean_mastery"
  | "declare_mastery"
  | "abyss_well"
  | "war_chorus";

export interface SkillTreeBonus {
  manaRegenBonus: number;
  manaMaxBonus: number;
  boardSenseBonus: number;
  startManaPct: number;
  skillPowerBonus: number;
  leaderAtkBonus: number;
  summonerHpBonus: number;
  /** Multiplier on 증폭선언 mana cost (default 1). */
  declareCostMul: number;
  /** Multiplier on 쌍착수 mana cost (default 1). */
  dualCostMul: number;
  /** Multiplier on 진문청소 mana cost (default 1). */
  cleanCostMul: number;
  /** Extra Amplify power on 증폭선언. */
  declarePowerBonus: number;
  /** Extra Amplify from 진문청소 per stone removed. */
  cleanAmpBonus: number;
}

export interface SkillTreeNode {
  id: SkillTreeNodeId;
  nameKo: string;
  branch: "mana" | "sense" | "power" | "leader" | "mastery";
  descKo: string;
  manaCost: number;
  crystalCost: number;
  minLevel: number;
  requires: SkillTreeNodeId[];
  bonus: Partial<SkillTreeBonus>;
}

export const SKILL_TREE_NODES: SkillTreeNode[] = [
  {
    id: "root_mana",
    nameKo: "진액 회로",
    branch: "mana",
    descKo: "마나 재생 +0.05",
    manaCost: 200,
    crystalCost: 0,
    minLevel: 3,
    requires: [],
    bonus: { manaRegenBonus: 0.05 },
  },
  {
    id: "root_sense",
    nameKo: "국면 눈",
    branch: "sense",
    descKo: "국면 감응 +0.02",
    manaCost: 200,
    crystalCost: 0,
    minLevel: 3,
    requires: [],
    bonus: { boardSenseBonus: 0.02 },
  },
  {
    id: "root_power",
    nameKo: "진문 핵",
    branch: "power",
    descKo: "스킬 위력 +3%",
    manaCost: 200,
    crystalCost: 0,
    minLevel: 3,
    requires: [],
    bonus: { skillPowerBonus: 0.03 },
  },
  {
    id: "mana_pool",
    nameKo: "심연 저장",
    branch: "mana",
    descKo: "마나 상한 +12 · 시작 마나 +2%",
    manaCost: 350,
    crystalCost: 1,
    minLevel: 6,
    requires: ["root_mana"],
    bonus: { manaMaxBonus: 12, startManaPct: 0.02 },
  },
  {
    id: "sense_start",
    nameKo: "선취 감응",
    branch: "sense",
    descKo: "시작 마나 +4% · 감응 +0.02",
    manaCost: 350,
    crystalCost: 1,
    minLevel: 6,
    requires: ["root_sense"],
    bonus: { startManaPct: 0.04, boardSenseBonus: 0.02 },
  },
  {
    id: "power_focus",
    nameKo: "개방 집중",
    branch: "power",
    descKo: "스킬 위력 +5% · 증폭선언 +0.03",
    manaCost: 400,
    crystalCost: 1,
    minLevel: 6,
    requires: ["root_power"],
    bonus: { skillPowerBonus: 0.05, declarePowerBonus: 0.03 },
  },
  {
    id: "leader_aura",
    nameKo: "지휘 파동",
    branch: "leader",
    descKo: "리더 ATK +1% · 서머너 HP +40",
    manaCost: 500,
    crystalCost: 2,
    minLevel: 8,
    requires: ["root_mana", "root_power"],
    bonus: { leaderAtkBonus: 0.01, summonerHpBonus: 40 },
  },
  {
    id: "dual_mastery",
    nameKo: "쌍착 숙련",
    branch: "mastery",
    descKo: "쌍착수 마나 소모 85%",
    manaCost: 450,
    crystalCost: 2,
    minLevel: 8,
    requires: ["root_sense"],
    bonus: { dualCostMul: 0.85 },
  },
  {
    id: "clean_mastery",
    nameKo: "청소 숙련",
    branch: "mastery",
    descKo: "진문청소 마나 90% · 제거당 Amp +0.005",
    manaCost: 450,
    crystalCost: 2,
    minLevel: 8,
    requires: ["root_power"],
    bonus: { cleanCostMul: 0.9, cleanAmpBonus: 0.005 },
  },
  {
    id: "declare_mastery",
    nameKo: "증폭 숙련",
    branch: "mastery",
    descKo: "증폭선언 마나 85% · Amp +0.04",
    manaCost: 550,
    crystalCost: 2,
    minLevel: 10,
    requires: ["power_focus"],
    bonus: { declareCostMul: 0.85, declarePowerBonus: 0.04 },
  },
  {
    id: "abyss_well",
    nameKo: "심연 우물",
    branch: "mana",
    descKo: "마나 상한 +20 · 재생 +0.06",
    manaCost: 550,
    crystalCost: 2,
    minLevel: 10,
    requires: ["mana_pool"],
    bonus: { manaMaxBonus: 20, manaRegenBonus: 0.06 },
  },
  {
    id: "war_chorus",
    nameKo: "전장 합창",
    branch: "leader",
    descKo: "리더 ATK +1.5% · 스킬 위력 +4%",
    manaCost: 700,
    crystalCost: 3,
    minLevel: 12,
    requires: ["leader_aura", "dual_mastery"],
    bonus: { leaderAtkBonus: 0.015, skillPowerBonus: 0.04 },
  },
];

function emptyBonus(): SkillTreeBonus {
  return {
    manaRegenBonus: 0,
    manaMaxBonus: 0,
    boardSenseBonus: 0,
    startManaPct: 0,
    skillPowerBonus: 0,
    leaderAtkBonus: 0,
    summonerHpBonus: 0,
    declareCostMul: 1,
    dualCostMul: 1,
    cleanCostMul: 1,
    declarePowerBonus: 0,
    cleanAmpBonus: 0,
  };
}

export function getSkillTreeNode(
  id: string,
): SkillTreeNode | undefined {
  return SKILL_TREE_NODES.find((n) => n.id === id);
}

export function isSkillTreeNodeId(id: string): id is SkillTreeNodeId {
  return SKILL_TREE_NODES.some((n) => n.id === id);
}

/** Aggregate bonuses from unlocked node ids. */
export function skillTreeBonuses(unlocked: string[] | undefined): SkillTreeBonus {
  const out = emptyBonus();
  const set = new Set(unlocked ?? []);
  for (const node of SKILL_TREE_NODES) {
    if (!set.has(node.id)) continue;
    const b = node.bonus;
    out.manaRegenBonus += b.manaRegenBonus ?? 0;
    out.manaMaxBonus += b.manaMaxBonus ?? 0;
    out.boardSenseBonus += b.boardSenseBonus ?? 0;
    out.startManaPct += b.startManaPct ?? 0;
    out.skillPowerBonus += b.skillPowerBonus ?? 0;
    out.leaderAtkBonus += b.leaderAtkBonus ?? 0;
    out.summonerHpBonus += b.summonerHpBonus ?? 0;
    out.declarePowerBonus += b.declarePowerBonus ?? 0;
    out.cleanAmpBonus += b.cleanAmpBonus ?? 0;
    if (b.declareCostMul != null) {
      out.declareCostMul = Math.min(out.declareCostMul, b.declareCostMul);
    }
    if (b.dualCostMul != null) {
      out.dualCostMul = Math.min(out.dualCostMul, b.dualCostMul);
    }
    if (b.cleanCostMul != null) {
      out.cleanCostMul = Math.min(out.cleanCostMul, b.cleanCostMul);
    }
  }
  return out;
}

export function canUnlockSkillNode(
  unlocked: string[],
  nodeId: SkillTreeNodeId,
  summonerLevel: number,
): { ok: true } | { ok: false; reason: string } {
  const node = getSkillTreeNode(nodeId);
  if (!node) return { ok: false, reason: "알 수 없는 노드" };
  if (unlocked.includes(nodeId)) {
    return { ok: false, reason: "이미 해금됨" };
  }
  if (summonerLevel < node.minLevel) {
    return {
      ok: false,
      reason: `서머너 Lv.${node.minLevel}+ 필요 (현재 ${summonerLevel})`,
    };
  }
  for (const req of node.requires) {
    if (!unlocked.includes(req)) {
      const name = getSkillTreeNode(req)?.nameKo ?? req;
      return { ok: false, reason: `선행 필요: ${name}` };
    }
  }
  return { ok: true };
}
