/** Phase 2 glory buildings (SW arena shop → permanent combat buffs). */

export type GloryBuildingId =
  | "mana_fountain"
  | "ancient_sword"
  | "guardstone"
  | "crystal_altar"
  | "sky_totem"
  | "fire_sanctuary"
  | "water_sanctuary"
  | "wind_sanctuary"
  | "fairy_tree";

export interface GloryBuildingDef {
  id: GloryBuildingId;
  nameKo: string;
  swName: string;
  /** Glory point cost to buy Lv1 / each upgrade. */
  gloryCostPerLevel: number;
  maxLevel: number;
  effectKo: string;
  /** Combat buff per level (fraction, e.g. 0.02 = +2%). */
  atkPct?: number;
  defPct?: number;
  hpPct?: number;
  spdFlat?: number;
  /** Island mana production multiplier per level. */
  manaProdPct?: number;
}

export const GLORY_BUILDINGS: GloryBuildingDef[] = [
  {
    id: "mana_fountain",
    nameKo: "골드 분천",
    swName: "Mana Fountain",
    gloryCostPerLevel: 40,
    maxLevel: 10,
    effectKo: "골드 연못 생산 +3%/Lv",
    manaProdPct: 0.03,
  },
  {
    id: "ancient_sword",
    nameKo: "고대의 검",
    swName: "Ancient Sword",
    gloryCostPerLevel: 50,
    maxLevel: 10,
    effectKo: "공격력 +2%/Lv",
    atkPct: 0.02,
  },
  {
    id: "guardstone",
    nameKo: "수호의 석",
    swName: "Guardstone",
    gloryCostPerLevel: 50,
    maxLevel: 10,
    effectKo: "방어력 +2%/Lv",
    defPct: 0.02,
  },
  {
    id: "crystal_altar",
    nameKo: "수정 제단",
    swName: "Crystal Altar",
    gloryCostPerLevel: 50,
    maxLevel: 10,
    effectKo: "체력 +2%/Lv",
    hpPct: 0.02,
  },
  {
    id: "sky_totem",
    nameKo: "하늘부족 토템",
    swName: "Sky Tribe Totem",
    gloryCostPerLevel: 60,
    maxLevel: 10,
    effectKo: "공격속도 +1/Lv",
    spdFlat: 1,
  },
  {
    id: "fire_sanctuary",
    nameKo: "불의 성소",
    swName: "Fire Sanctuary",
    gloryCostPerLevel: 55,
    maxLevel: 8,
    effectKo: "공격력 +1.5%/Lv",
    atkPct: 0.015,
  },
  {
    id: "water_sanctuary",
    nameKo: "물의 성소",
    swName: "Water Sanctuary",
    gloryCostPerLevel: 55,
    maxLevel: 8,
    effectKo: "체력 +1.5%/Lv",
    hpPct: 0.015,
  },
  {
    id: "wind_sanctuary",
    nameKo: "바람의 성소",
    swName: "Wind Sanctuary",
    gloryCostPerLevel: 55,
    maxLevel: 8,
    effectKo: "공격속도 +1/Lv",
    spdFlat: 1,
  },
  {
    id: "fairy_tree",
    nameKo: "요정의 나무",
    swName: "Fairy Tree",
    gloryCostPerLevel: 45,
    maxLevel: 10,
    effectKo: "골드 연못 생산 +2%/Lv",
    manaProdPct: 0.02,
  },
];

export function getGloryBuilding(id: string): GloryBuildingDef | undefined {
  return GLORY_BUILDINGS.find((b) => b.id === id);
}

export interface GloryCombatBuff {
  atkPct: number;
  defPct: number;
  hpPct: number;
  spdFlat: number;
  manaProdPct: number;
}

export function gloryBuffFromLevels(
  levels: Partial<Record<GloryBuildingId, number>>,
): GloryCombatBuff {
  const out: GloryCombatBuff = {
    atkPct: 0,
    defPct: 0,
    hpPct: 0,
    spdFlat: 0,
    manaProdPct: 0,
  };
  for (const def of GLORY_BUILDINGS) {
    const lv = levels[def.id] ?? 0;
    if (lv <= 0) continue;
    out.atkPct += (def.atkPct ?? 0) * lv;
    out.defPct += (def.defPct ?? 0) * lv;
    out.hpPct += (def.hpPct ?? 0) * lv;
    out.spdFlat += (def.spdFlat ?? 0) * lv;
    out.manaProdPct += (def.manaProdPct ?? 0) * lv;
  }
  return out;
}
