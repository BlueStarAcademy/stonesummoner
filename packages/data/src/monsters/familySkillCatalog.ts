import type { SkillDef } from "../skills.js";
import type { BalanceArchetype, Element } from "./types.js";

export const EL_PREFIX: Record<Element, { s1: string; s2: string; s3: string }> = {
  fire: { s1: "화염", s2: "작열", s3: "폭염" },
  water: { s1: "냉기", s2: "해일", s3: "빙결" },
  wind: { s1: "질풍", s2: "돌풍", s3: "폭풍" },
  light: { s1: "섬광", s2: "성휘", s3: "심판" },
  dark: { s1: "암영", s2: "심연", s3: "공허" },
};

const ESSENCE: Record<Element, string> = {
  fire: "불",
  water: "얼음",
  wind: "바람",
  light: "빛",
  dark: "어둠",
};

/** Per-family unique skill name stems (S2 / S3). */
export const FAMILY_STEMS: Record<string, { s2: string; s3: string }> = {
  stone_golem: { s2: "바위투척", s3: "대지수호" },
  forest_sprite: { s2: "숲의숨결", s3: "생명꽃잎" },
  venom_stinger: { s2: "독침사격", s3: "맹독폭발" },
  cinder_imp: { s2: "불씨연사", s3: "불씨폭풍" },
  dew_slime: { s2: "이슬방울", s3: "생명이슬" },
  gale_bat: { s2: "초음파", s3: "질풍소용돌이" },
  sand_lizard: { s2: "모래참격", s3: "사막폭풍" },
  moss_turtle: { s2: "이끼덮개", s3: "수생보호" },
  crow_scout: { s2: "표식포획", s3: "군집속박" },
  bone_thrall: { s2: "뼈창투척", s3: "낙하골격" },
  mace_soldier: { s2: "철퇴연타", s3: "강철진지" },
  heal_priest: { s2: "성스러운손길", s3: "신성의빛" },
  magic_archer: { s2: "마력화살", s3: "궤적폭우" },
  shadow_thief: { s2: "그림자칼", s3: "암습마크" },
  thunder_spear: { s2: "뇌전찌르기", s3: "번개낙뢰" },
  frost_witch: { s2: "서리결정", s3: "빙결폭풍" },
  stone_fist: { s2: "석권격", s3: "바위주먹" },
  herb_alchemist: { s2: "약초투척", s3: "회복영약" },
  capture_hound: { s2: "추적물기", s3: "사슬포박" },
  seal_apprentice: { s2: "봉인각인", s3: "진문파동" },
  flame_warrior: { s2: "연화참", s3: "화염무영" },
  abyss_pirate: { s2: "해적사격", s3: "심해포격" },
  gale_rider: { s2: "돌풍돌격", s3: "폭풍질주" },
  sanctuary_guard: { s2: "성역방패", s3: "신성결계" },
  abyss_hexer: { s2: "심연저주", s3: "심연균열" },
  dew_healer: { s2: "이슬치유", s3: "생명의샘" },
  seal_elder: { s2: "진문각인", s3: "석문개방" },
  wolf_fighter: { s2: "울부짖음", s3: "굶주린일격" },
  lotus_dancer: { s2: "연꽃향기", s3: "춤의파동" },
  scout_sniper: { s2: "저격사격", s3: "관통탄" },
  steel_armor: { s2: "강철충돌", s3: "장갑방호" },
  mana_captor: { s2: "마나그물", s3: "포획고리" },
  magma_knight: { s2: "용암참", s3: "용암분출" },
  glacier_mage: { s2: "빙하구", s3: "빙하붕괴" },
  storm_spearmaster: { s2: "폭풍창격", s3: "천둥연참" },
  angel_healer: { s2: "천사의날개", s3: "성광치유" },
  demon_hexer: { s2: "악마의속삭임", s3: "저주의문" },
  rune_scholar: { s2: "룬해독", s3: "고대진문" },
  golden_guardian: { s2: "금빛방패", s3: "황금결계" },
  shadow_assassin: { s2: "암습일섬", s3: "그림자난무" },
  holy_judge: { s2: "심판의망치", s3: "성역폭발" },
  abyss_priest: { s2: "심연의기도", s3: "공허의파문" },
  wyrm_rider: { s2: "용의숨결", s3: "용격낙하" },
  capture_lord: { s2: "지배의눈", s3: "절대속박" },
  dragon_knight: { s2: "용염참", s3: "고룡격노" },
  primordial_hierophant: { s2: "태초각인", s3: "원시진문" },
  doom_oracle: { s2: "종말예언", s3: "재앙의시선" },
  sky_warden: { s2: "천공방벽", s3: "수호룡격" },
  eternal_healer: { s2: "영원한빛", s3: "생명의파동" },
  absolute_captor: { s2: "절대포획", s3: "공간속박" },
  ember_wisp: { s2: "잔불연타", s3: "불씨난무" },
  toxin_mite: { s2: "약독침", s3: "독무분출" },
  ward_totem: { s2: "수호의벽", s3: "면역결계" },
  rime_dart: { s2: "서리침투", s3: "빙결사격" },
  purify_finch: { s2: "정화깃털", s3: "정화노래" },
  blaze_hound: { s2: "작열이빨", s3: "화염추적" },
  plague_toad: { s2: "역독안개", s3: "전염점액" },
  iron_ward: { s2: "철벽면역", s3: "수호연대" },
  mute_owl: { s2: "침묵부리", s3: "봉인울음" },
  cleanse_monk: { s2: "정화염주", s3: "치유경전" },
  spark_raptor: { s2: "불꽃연격", s3: "작열난타" },
  fang_hydra: { s2: "독니연참", s3: "다두맹독" },
  aegis_scarab: { s2: "갑충방패", s3: "복합면역" },
  slumber_moth: { s2: "수면가루", s3: "동면날개" },
  sanctum_dove: { s2: "성역정화", s3: "치유의빛" },
  inferno_colossus: { s2: "지옥작열", s3: "대화재" },
  venom_tyrant: { s2: "맹독폭주", s3: "독왕강림" },
  glacier_bastion: { s2: "빙하속박", s3: "절대동결" },
  hex_mute: { s2: "치유봉인", s3: "침묵저주" },
  purify_hierophant: { s2: "대정화", s3: "성역면역" },
  flame_slaughter: { s2: "화염연살", s3: "학살난무" },
  poison_overlord: { s2: "독군주의숨", s3: "최종맹독" },
  absolute_frost: { s2: "절대빙결", s3: "동토결계" },
  curse_catalyst: { s2: "저주촉매", s3: "파멸침묵" },
  sanctuary_oracle: { s2: "성역예언", s3: "완전정화" },
};

export function familySkillName(
  el: Element,
  slot: "s2" | "s3",
  stem: string,
): string {
  const p = EL_PREFIX[el];
  return `${slot === "s2" ? p.s2 : p.s3}${stem}`;
}

type VfxHint = {
  vfxFamily: NonNullable<SkillDef["vfxFamily"]>;
  orbBolt?: boolean;
};

function s2Desc(el: Element, role: BalanceArchetype): string {
  const e = ESSENCE[el];
  switch (role) {
    case "attacker":
      return {
        fire: "맹렬한 불꽃을 뿜어 적을 공격합니다.",
        water: "얼어붙은 파장을 쏘아 적을 관통합니다.",
        wind: "질풍을 몰아 적을 베어 냅니다.",
        light: "섬광을 모아 적을 꿰뚫습니다.",
        dark: "어둠의 일격을 내려 적을 짓누릅니다.",
      }[el];
    case "support":
      return {
        fire: `${e}의 기운을 모아 체력이 낮은 아군을 치유합니다.`,
        water: `${e}의 물결을 흘려 체력이 낮은 아군을 회복합니다.`,
        wind: `${e}의 기류를 불어 체력이 낮은 아군을 돕습니다.`,
        light: `${e}의 광휘를 내려 체력이 낮은 아군을 치유합니다.`,
        dark: `${e}의 잔향을 흘려 체력이 낮은 아군을 회복합니다.`,
      }[el];
    case "tank":
      return {
        fire: `${e}의 위압을 내며 적을 도발해 공격합니다.`,
        water: `${e}의 파동을 일으켜 적을 도발합니다.`,
        wind: `${e}의 기세로 적의 주의를 끕니다.`,
        light: `${e}의 권위를 드러내 적을 도발합니다.`,
        dark: `${e}의 압박으로 적을 도발합니다.`,
      }[el];
    case "debuffer":
      return {
        fire: `${e}의 저주를 걸어 적을 약화시킵니다.`,
        water: `${e}의 한기를 퍼뜨려 적을 둔화합니다.`,
        wind: `${e}의 난기류를 퍼뜨려 적을 흔듭니다.`,
        light: `${e}의 심판을 내려 적의 명중을 떨어뜨립니다.`,
        dark: `${e}의 균열을 열어 적의 방어를 무너뜨립니다.`,
      }[el];
    case "stonesage":
      return {
        fire: `${e}의 진문을 새겨 적을 타격하고 마나를 흡수합니다.`,
        water: `${e}의 문양을 그려 적을 타격하고 마나를 흡수합니다.`,
        wind: `${e}의 각인을 새겨 적을 타격하고 마나를 흡수합니다.`,
        light: `${e}의 문장을 새겨 적을 타격하고 마나를 흡수합니다.`,
        dark: `${e}의 각인을 박아 적을 타격하고 마나를 흡수합니다.`,
      }[el];
    case "capturer":
      return {
        fire: `${e}의 오브를 던져 적을 가두어 공격합니다.`,
        water: `${e}의 결정을 던져 적을 가두어 공격합니다.`,
        wind: `${e}의 고리를 던져 적을 가두어 공격합니다.`,
        light: `${e}의 구체를 던져 적을 가두어 공격합니다.`,
        dark: `${e}의 속박을 던져 적을 가두어 공격합니다.`,
      }[el];
    default:
      return `${e}의 기운을 뿜어 적을 공격합니다.`;
  }
}

function s3Desc(el: Element, role: BalanceArchetype): string {
  const e = ESSENCE[el];
  switch (role) {
    case "attacker":
      return {
        fire: "불기둥을 일으켜 모든 적에게 피해를 입힙니다.",
        water: "얼음 폭풍을 퍼뜨려 모든 적을 관통합니다.",
        wind: "회오리를 몰아 모든 적을 베어 냅니다.",
        light: "성광을 쏟아 모든 적을 꿰뚫습니다.",
        dark: "공허의 균열을 열어 모든 적을 짓누릅니다.",
      }[el];
    case "support":
      if (el === "light") {
        return `모든 아군의 체력을 회복하고 ${e}의 실드와 정화를 부여합니다.`;
      }
      return `모든 아군의 체력을 회복하고 ${e}의 실드를 부여합니다.`;
    case "tank":
      return `${e}의 방벽을 세워 자신을 감싸 실드와 방어력을 높입니다.`;
    case "debuffer":
      if (el === "water") {
        return `${e}의 파열을 퍼뜨리고 빙결을 시도합니다.`;
      }
      if (el === "dark") {
        return `${e}의 파열을 퍼뜨리고 기절을 시도합니다.`;
      }
      return `${e}의 파열을 퍼뜨려 모든 적을 약화시킵니다.`;
    case "stonesage":
      return `${e}의 진문을 펼쳐 모든 적을 타격하고 아군의 명중을 높입니다.`;
    case "capturer":
      return `${e}의 속박을 걸어 적을 가두고 속도를 떨어뜨립니다.`;
    default:
      return `${e}의 폭발을 일으켜 모든 적에게 피해를 입힙니다.`;
  }
}

export function familySkillDescKo(
  el: Element,
  slot: "s2" | "s3",
  role: BalanceArchetype,
): string {
  return slot === "s2" ? s2Desc(el, role) : s3Desc(el, role);
}

function atkMelee(el: Element): boolean {
  return el === "fire" || el === "wind";
}

export function familySkillVfx(
  role: BalanceArchetype,
  slot: "s2" | "s3",
  el: Element,
): VfxHint {
  if (role === "capturer") {
    return { vfxFamily: "bolt", orbBolt: true };
  }
  if (role === "stonesage") {
    return slot === "s2"
      ? { vfxFamily: "bolt", orbBolt: true }
      : { vfxFamily: "nova" };
  }
  if (role === "support") {
    return { vfxFamily: "support" };
  }
  if (role === "tank") {
    return slot === "s2" ? { vfxFamily: "melee" } : { vfxFamily: "support" };
  }
  if (role === "debuffer") {
    return slot === "s3" ? { vfxFamily: "nova" } : { vfxFamily: "bolt" };
  }
  // attacker
  if (slot === "s3") {
    if (el === "water" || el === "dark") {
      return { vfxFamily: "bolt" };
    }
    return { vfxFamily: "nova" };
  }
  return { vfxFamily: atkMelee(el) ? "melee" : "bolt" };
}

export function familyStemsFor(familyId: string): { s2: string; s3: string } {
  const stems = FAMILY_STEMS[familyId];
  if (!stems) {
    throw new Error(`missing family skill stems: ${familyId}`);
  }
  return stems;
}
