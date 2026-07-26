import type { SymbolInstance, SymbolSetId } from "./symbols.js";
import { SYMBOL_SETS } from "./symbols.js";

export interface CombatStatBlock {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number;
  critDmg: number;
  accuracy: number;
  resistance: number;
}

/** Apply equipped symbol mains + set bonuses (Phase 1–2). */
export function applySymbolsToStats(
  base: CombatStatBlock,
  equipped: SymbolInstance[],
): CombatStatBlock {
  const stats = { ...base };

  for (const s of equipped) {
    const bonus = mainStatBonus(s);
    const prefix = prefixStatBonus(s);
    stats.hp += bonus.hp + prefix.hp;
    stats.atk += bonus.atk + prefix.atk;
    stats.def += bonus.def + prefix.def;
    stats.spd += bonus.spd + prefix.spd;
    stats.critRate += bonus.critRate + prefix.critRate;
    stats.critDmg += bonus.critDmg + prefix.critDmg;
    stats.accuracy += bonus.accuracy + prefix.accuracy;
    stats.resistance += bonus.resistance + prefix.resistance;
  }

  const counts = countSets(equipped);
  // 2-set stacking: floor(count/pieces) times
  const hwalroSets = Math.floor((counts.hwalro ?? 0) / 2);
  for (let i = 0; i < hwalroSets; i++) stats.hp = Math.round(stats.hp * 1.15);
  if ((counts.yongmaeng ?? 0) >= 4) stats.atk = Math.round(stats.atk * 1.35);
  if ((counts.haengma ?? 0) >= 4) stats.spd = Math.round(stats.spd * 1.25);
  const gunhimSets = Math.floor((counts.gunhim ?? 0) / 2);
  for (let i = 0; i < gunhimSets; i++) stats.def = Math.round(stats.def * 1.15);
  const mussangSets = Math.floor((counts.mussang ?? 0) / 2);
  stats.critRate += mussangSets * 12;
  if ((counts.chimtu ?? 0) >= 4) stats.critDmg = Math.round(stats.critDmg * 1.4);
  const bogangSets = Math.floor((counts.bogang ?? 0) / 2);
  for (let i = 0; i < bogangSets; i++) stats.hp = Math.round(stats.hp * 1.08);
  const jipjungSets = Math.floor((counts.jipjung ?? 0) / 2);
  stats.critRate += jipjungSets * 8;

  return stats;
}

function countSets(equipped: SymbolInstance[]): Partial<Record<SymbolSetId, number>> {
  const out: Partial<Record<SymbolSetId, number>> = {};
  for (const s of equipped) {
    out[s.setId] = (out[s.setId] ?? 0) + 1;
  }
  return out;
}

export interface SymbolSetProgress {
  setId: SymbolSetId;
  nameKo: string;
  count: number;
  pieces: number;
  active: boolean;
  effectKo: string;
}

/** Sets present on equipped symbols, with activation progress. */
export function summarizeSymbolSets(
  equipped: SymbolInstance[],
): SymbolSetProgress[] {
  const counts = countSets(equipped);
  return SYMBOL_SETS.map((set) => {
    const count = counts[set.id] ?? 0;
    return {
      setId: set.id,
      nameKo: set.nameKo,
      count,
      pieces: set.pieces,
      active: count >= set.pieces,
      effectKo: set.effectKo,
    };
  }).filter((p) => p.count > 0);
}

function emptyBonus(): CombatStatBlock {
  return { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0, critDmg: 0, accuracy: 0, resistance: 0 };
}

function applyNamedStat(
  z: CombatStatBlock,
  name: string,
  value: number,
): CombatStatBlock {
  switch (name) {
    case "ATK+":
      z.atk = Math.round(value);
      break;
    case "HP+":
      z.hp = Math.round(value);
      break;
    case "DEF+":
      z.def = Math.round(value);
      break;
    case "SPD+":
      z.spd = Math.round(value);
      break;
    case "CRI Dmg%":
      z.critDmg = Math.round(value);
      break;
    case "CRI Rate%":
      z.critRate = Math.round(value);
      break;
    case "ACC%":
      z.accuracy = Math.round(value);
      break;
    case "RES%":
      z.resistance = Math.round(value);
      break;
    default:
      break;
  }
  return z;
}

function mainStatBonus(s: SymbolInstance): CombatStatBlock {
  const scale = 1 + s.enhance * 0.08;
  return applyNamedStat(emptyBonus(), s.mainStat, s.mainValue * scale);
}

/** Prefix (grind) is flat — never scaled by enhance. */
function prefixStatBonus(s: SymbolInstance): CombatStatBlock {
  if (!s.prefixStat || !s.prefixValue) return emptyBonus();
  return applyNamedStat(emptyBonus(), s.prefixStat, s.prefixValue);
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
  const main = `${s.mainStat} ${s.mainValue}`;
  const prefix =
    s.prefixStat && s.prefixValue
      ? ` · 접두 ${s.prefixStat} ${s.prefixValue}`
      : "";
  return `${set?.nameKo ?? s.setId} 슬롯${s.slot} +${s.enhance} (${main}${prefix})`;
}
