import type { SymbolInstance, SymbolSetId } from "./symbols.js";
import { SYMBOL_SETS } from "./symbols.js";

export interface CombatStatBlock {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number;
  critDmg: number;
}

/** Apply equipped symbol mains + Phase 1 set bonuses. */
export function applySymbolsToStats(
  base: CombatStatBlock,
  equipped: SymbolInstance[],
): CombatStatBlock {
  const stats = { ...base };

  for (const s of equipped) {
    const bonus = mainStatBonus(s);
    stats.hp += bonus.hp;
    stats.atk += bonus.atk;
    stats.def += bonus.def;
    stats.spd += bonus.spd;
    stats.critRate += bonus.critRate;
    stats.critDmg += bonus.critDmg;
  }

  const counts = countSets(equipped);
  if ((counts.hwalro ?? 0) >= 2) stats.hp = Math.round(stats.hp * 1.15);
  if ((counts.yongmaeng ?? 0) >= 4) stats.atk = Math.round(stats.atk * 1.35);
  if ((counts.haengma ?? 0) >= 4) stats.spd = Math.round(stats.spd * 1.25);

  return stats;
}

function countSets(equipped: SymbolInstance[]): Partial<Record<SymbolSetId, number>> {
  const out: Partial<Record<SymbolSetId, number>> = {};
  for (const s of equipped) {
    out[s.setId] = (out[s.setId] ?? 0) + 1;
  }
  return out;
}

function mainStatBonus(s: SymbolInstance): CombatStatBlock {
  const scale = 1 + s.enhance * 0.08;
  const v = s.mainValue * scale;
  const z: CombatStatBlock = {
    hp: 0,
    atk: 0,
    def: 0,
    spd: 0,
    critRate: 0,
    critDmg: 0,
  };
  switch (s.mainStat) {
    case "ATK+":
      z.atk = Math.round(v);
      break;
    case "HP+":
      z.hp = Math.round(v);
      break;
    case "DEF+":
      z.def = Math.round(v);
      break;
    case "SPD+":
      z.spd = Math.round(v);
      break;
    case "CRI Dmg%":
      z.critDmg = Math.round(v);
      break;
    case "CRI Rate%":
      z.critRate = Math.round(v);
      break;
    default:
      break;
  }
  return z;
}

export function symbolEnhanceManaCost(enhance: number): number {
  return 60 + enhance * 35;
}

export const MAX_SYMBOL_ENHANCE = 15;

export function bumpSymbolEnhance(s: SymbolInstance): SymbolInstance {
  return { ...s, enhance: s.enhance + 1 };
}

export function describeSymbol(s: SymbolInstance): string {
  const set = SYMBOL_SETS.find((x) => x.id === s.setId);
  return `${set?.nameKo ?? s.setId} 슬롯${s.slot} +${s.enhance} (${s.mainStat} ${s.mainValue})`;
}
