import type { Element } from "./types.js";

const ESSENCE: Record<Element, string> = {
  fire: "불",
  water: "얼음",
  wind: "바람",
  light: "빛",
  dark: "어둠",
};

const STRIKE: Record<Element, string> = {
  fire: "맹렬한 불꽃을 휘둘러 베어",
  water: "날카로운 얼음 파편을 쏘아 관통",
  wind: "회오리 칼날로 베어",
  light: "빛의 창으로 꿰뚫어",
  dark: "어둠의 손아귀로 짓눌러",
};

const BOLT: Record<Element, string> = {
  fire: "불덩이를 연속 발사해",
  water: "얼음 창을 투척해",
  wind: "바람 화살을 쏘아",
  light: "섬광탄을 날려",
  dark: "암흑 구체를 던져",
};

const BURST: Record<Element, string> = {
  fire: "불기둥을 일으켜",
  water: "얼음 폭풍을 퍼뜨려",
  wind: "회오리를 휘몰아쳐",
  light: "성광을 쏟아",
  dark: "공허의 균열을 열어",
};

/** Flavor line matched from skill name suffix + element. */
export function skillDescForName(nameKo: string, el: Element): string {
  const e = ESSENCE[el];
  if (nameKo.endsWith("포획")) {
    return `적 1명에게 ${e}의 오브를 발사해 가두어 공격합니다.`;
  }
  if (nameKo.endsWith("추적")) {
    return `적 1명을 ${e}의 궤적으로 추적해 타격하고 마나를 흡수합니다.`;
  }
  if (nameKo.endsWith("속박")) {
    return `적 1명을 ${e}의 속박 고리로 가두어 피해를 입히고 속도를 떨어뜨립니다.`;
  }
  if (nameKo.endsWith("타격")) {
    return `적 1명에게 ${STRIKE[el]} 피해를 입힙니다.`;
  }
  if (nameKo.endsWith("일격")) {
    return `적 1명에게 ${BOLT[el]} 강하게 타격합니다.`;
  }
  if (nameKo.endsWith("난무")) {
    return `모든 적에게 ${BURST[el]} 광역 피해를 입힙니다.`;
  }
  if (nameKo.endsWith("탄")) {
    return `적 1명에게 ${e}의 마력 탄환을 발사합니다.`;
  }
  if (nameKo.endsWith("치유")) {
    return `체력이 가장 낮은 아군에게 ${e}의 기운으로 치유합니다.`;
  }
  if (nameKo.endsWith("가호")) {
    if (el === "light") {
      return `모든 아군의 체력을 회복하고 ${e}의 실드와 정화를 부여합니다.`;
    }
    return `모든 아군의 체력을 회복하고 ${e}의 실드를 부여합니다.`;
  }
  if (nameKo.endsWith("강타")) {
    return `적 1명에게 ${e}의 방패와 함께 강타를 내립니다.`;
  }
  if (nameKo.endsWith("도발")) {
    return `적 1명을 ${e}의 위압으로 도발하며 공격합니다.`;
  }
  if (nameKo.endsWith("방벽")) {
    return `자신을 ${e}의 방벽으로 감싸 실드를 두르고 방어력을 높입니다.`;
  }
  if (nameKo.endsWith("저주")) {
    return `적 1명에게 ${e}의 저주를 걸어 피해를 입힙니다.`;
  }
  if (nameKo.endsWith("약화")) {
    return `적 1명에게 ${e}의 기운으로 약화를 겁니다.`;
  }
  if (nameKo.endsWith("파열")) {
    if (el === "water") {
      return `모든 적에게 ${e}의 파열을 퍼뜨리고 빙결을 시도합니다.`;
    }
    if (el === "dark") {
      return `모든 적에게 ${e}의 파열을 퍼뜨리고 기절을 시도합니다.`;
    }
    return `모든 적에게 ${e}의 파열을 퍼뜨립니다.`;
  }
  if (nameKo.endsWith("각인")) {
    return `적 1명에게 ${e}의 진문 각인을 새깁니다.`;
  }
  if (nameKo.endsWith("착수")) {
    return `적 1명을 ${e}의 진문으로 타격하고 마나를 흡수합니다.`;
  }
  if (nameKo.endsWith("진문")) {
    return `모든 적에게 ${e}의 진문을 펼치고 아군의 명중을 높입니다.`;
  }
  return `적 1명에게 ${e}의 기운으로 피해를 입힙니다.`;
}
