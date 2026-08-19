/** Circle inscriptions: spend 진문석 for magic-circle combat bonuses (not glory ATK/HP). */

export type CircleInscriptionId = "start_mana" | "amplify_cap" | "item_spawn";

export interface CircleInscriptionDef {
  id: CircleInscriptionId;
  nameKo: string;
  effectKo: string;
  jinmunCostPerLevel: number;
  maxLevel: number;
  startManaFlat?: number;
  amplifyCapAdd?: number;
  itemSpawnBonus?: number;
}

export const CIRCLE_INSCRIPTIONS: CircleInscriptionDef[] = [
  {
    id: "start_mana",
    nameKo: "시작 마나 각인",
    effectKo: "전투 시작 마나 +1/Lv",
    jinmunCostPerLevel: 2,
    maxLevel: 10,
    startManaFlat: 1,
  },
  {
    id: "amplify_cap",
    nameKo: "증폭 상한 각인",
    effectKo: "Amplify 상한 +0.5%/Lv",
    jinmunCostPerLevel: 3,
    maxLevel: 10,
    amplifyCapAdd: 0.005,
  },
  {
    id: "item_spawn",
    nameKo: "보드 징표 각인",
    effectKo: "보드 아이템 출현 +3%/Lv",
    jinmunCostPerLevel: 2,
    maxLevel: 10,
    itemSpawnBonus: 0.03,
  },
];

export function getCircleInscription(
  id: string,
): CircleInscriptionDef | undefined {
  return CIRCLE_INSCRIPTIONS.find((d) => d.id === id);
}

export interface CircleInscriptionBuff {
  startManaFlat: number;
  amplifyCapAdd: number;
  itemSpawnBonus: number;
}

export function circleInscriptionBuffFromLevels(
  levels: Partial<Record<CircleInscriptionId, number>>,
): CircleInscriptionBuff {
  const out: CircleInscriptionBuff = {
    startManaFlat: 0,
    amplifyCapAdd: 0,
    itemSpawnBonus: 0,
  };
  for (const def of CIRCLE_INSCRIPTIONS) {
    const lv = levels[def.id] ?? 0;
    if (lv <= 0) continue;
    out.startManaFlat += (def.startManaFlat ?? 0) * lv;
    out.amplifyCapAdd += (def.amplifyCapAdd ?? 0) * lv;
    out.itemSpawnBonus += (def.itemSpawnBonus ?? 0) * lv;
  }
  return out;
}
