/** Combat-hooked stone passives (Phase 1). */
export type StonePassiveId =
  | "capture_crit"
  | "shield_core_heal"
  | "stone_ally_atb"
  | "high_amp_dr"
  | "crit_charm_plus"
  | "suggest_plus"
  | "capture_mana"
  | "stone_amp_proc"
  | "stone_ally_heal"
  | "capture_amp";

export const STONE_PASSIVE_LABEL: Record<StonePassiveId, string> = {
  capture_crit: "따냄 시 치피 +10%",
  shield_core_heal: "실드핵 획득 시 힐",
  stone_ally_atb: "착수 시 아군 ATB +5%",
  high_amp_dr: "Amplify↑ 시 받는피해↓",
  crit_charm_plus: "치명부적 지속 +1",
  suggest_plus: "착수 추천 +1",
  capture_mana: "따냄 마나 +30%",
  stone_amp_proc: "연타착수 15%",
  stone_ally_heal: "착수 시 아군 소량 회복",
  capture_amp: "따냄 시 Amplify +",
};
