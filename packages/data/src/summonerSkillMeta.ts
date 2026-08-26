import type { SkillDef } from "../skills.js";
import type { Element } from "./monsters.js";
import type { SummonerMagicSkillKind } from "./summoners.js";

export type SummonerSkillVfxFamily = NonNullable<SkillDef["vfxFamily"]>;

const ESSENCE: Record<Element, string> = {
  fire: "불",
  water: "얼음",
  wind: "바람",
  light: "빛",
  dark: "어둠",
};

export function summonerSkillDescKo(
  kind: SummonerMagicSkillKind,
  element: Element,
): string {
  const e = ESSENCE[element];
  switch (kind) {
    case "aoe_damage":
      return `${e}의 파동으로 전장의 적에게 광역 피해를 입힙니다.`;
    case "single_damage":
      return `${e}의 일격으로 적 1명에게 강력한 피해를 입힙니다.`;
    case "ally_buff_atk":
      return `${e}의 기운으로 아군의 공격력을 높입니다.`;
    case "ally_buff_spd":
      return `${e}의 기류로 아군의 속도를 높입니다.`;
    case "ally_buff_crit":
      return `${e}의 광휘로 아군의 치명타 기운을 강화합니다.`;
    case "ally_heal":
      return `${e}의 기운으로 아군의 체력을 회복합니다.`;
    case "ally_shield":
      return `${e}의 보호막을 펼쳐 아군을 감쌉니다.`;
    case "enemy_debuff":
      return `${e}의 저주를 걸어 적을 약화시킵니다.`;
    case "amplify":
      return `${e}의 증폭으로 다음 연계의 위력을 높입니다.`;
    case "dual_stone":
      return `${e}의 진문으로 두 개의 마석을 동시에 배치합니다.`;
    case "board_clean":
      return `${e}의 정화로 보드의 진문을 정리합니다.`;
    case "damage_reduce":
      return `${e}의 가호로 아군이 받는 피해를 줄입니다.`;
    default:
      return `${e}의 마력을 전장에 펼칩니다.`;
  }
}

export function summonerSkillVfx(
  kind: SummonerMagicSkillKind,
  manaCostFrac: number,
): { vfxFamily: SummonerSkillVfxFamily; orbBolt?: boolean } {
  if (kind === "aoe_damage") {
    return { vfxFamily: manaCostFrac >= 0.95 ? "nova" : "bolt" };
  }
  if (kind === "single_damage") {
    return { vfxFamily: "bolt" };
  }
  if (
    kind === "ally_heal" ||
    kind === "ally_shield" ||
    kind === "ally_buff_atk" ||
    kind === "ally_buff_spd" ||
    kind === "ally_buff_crit" ||
    kind === "amplify" ||
    kind === "dual_stone" ||
    kind === "board_clean" ||
    kind === "damage_reduce"
  ) {
    return { vfxFamily: "support" };
  }
  if (kind === "enemy_debuff") {
    return { vfxFamily: "bolt", orbBolt: true };
  }
  return { vfxFamily: "bolt" };
}
