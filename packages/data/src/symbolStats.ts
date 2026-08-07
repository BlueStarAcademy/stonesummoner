import type { SymbolInstance, SymbolSetId, SymbolSubstat } from "./symbols.js";
import { SYMBOL_SETS } from "./symbols.js";
import {
  mainStatAtEnhance,
  rollSubstatValue,
  SUBSTAT_POOL,
  type SymbolStatId,
  type SymbolStars,
} from "./symbolTables.js";

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

/** Proc / battle-start mods from completed symbol sets. */
export interface SymbolCombatMods {
  startShieldPct: number;
  startShieldTurns: number;
  counterChance: number;
  statusImmuneTurns: number;
  lifestealPct: number;
  /** Despair: stun chance % on hit. */
  stunChance: number;
  /** Violent: extra turn chance % after skill. */
  violentChance: number;
  /** Nemesis: ATB % gained per 7% HP lost when hit. */
  nemesisAtbPer7: number;
  /** Destroy set completions (stack). */
  destroySets: number;
}

export function emptySymbolCombatMods(): SymbolCombatMods {
  return {
    startShieldPct: 0,
    startShieldTurns: 0,
    counterChance: 0,
    statusImmuneTurns: 0,
    lifestealPct: 0,
    stunChance: 0,
    violentChance: 0,
    nemesisAtbPer7: 0,
    destroySets: 0,
  };
}

export function countSymbolSets(
  equipped: SymbolInstance[],
): Partial<Record<SymbolSetId, number>> {
  const out: Partial<Record<SymbolSetId, number>> = {};
  for (const s of equipped) {
    out[s.setId] = (out[s.setId] ?? 0) + 1;
  }
  return out;
}

export function symbolCombatMods(equipped: SymbolInstance[]): SymbolCombatMods {
  const counts = countSymbolSets(equipped);
  const bogang = Math.floor((counts.bogang ?? 0) / 2);
  const hwangyeok = Math.floor((counts.hwangyeok ?? 0) / 2);
  const ssangnip = Math.floor((counts.ssangnip ?? 0) / 2);
  const tagae = Math.floor((counts.tagae ?? 0) / 4);
  const myosu = Math.floor((counts.myosu ?? 0) / 4);
  const gyeongno = Math.floor((counts.gyeongno ?? 0) / 4);
  const eungjing = Math.floor((counts.eungjing ?? 0) / 2);
  const pamyeol = Math.floor((counts.pamyeol ?? 0) / 2);
  return {
    startShieldPct: bogang * 0.15,
    startShieldTurns: bogang > 0 ? 3 : 0,
    counterChance: hwangyeok * 15,
    statusImmuneTurns: ssangnip > 0 ? ssangnip : 0,
    lifestealPct: tagae * 35,
    stunChance: myosu * 25,
    violentChance: gyeongno * 22,
    nemesisAtbPer7: eungjing * 4,
    destroySets: pamyeol,
  };
}

function applyStatId(
  z: CombatStatBlock,
  name: string,
  value: number,
  baseHp: number,
  baseAtk: number,
  baseDef: number,
): void {
  switch (name) {
    case "ATK+":
      z.atk += Math.round(value);
      break;
    case "HP+":
      z.hp += Math.round(value);
      break;
    case "DEF+":
      z.def += Math.round(value);
      break;
    case "SPD+":
      z.spd += Math.round(value);
      break;
    case "ATK%":
      z.atk += Math.round((baseAtk * value) / 100);
      break;
    case "HP%":
      z.hp += Math.round((baseHp * value) / 100);
      break;
    case "DEF%":
      z.def += Math.round((baseDef * value) / 100);
      break;
    case "CRI Dmg%":
      z.critDmg += Math.round(value);
      break;
    case "CRI Rate%":
      z.critRate += Math.round(value);
      break;
    case "ACC%":
      z.accuracy += Math.round(value);
      break;
    case "RES%":
      z.resistance += Math.round(value);
      break;
    default:
      break;
  }
}

/** Apply equipped symbol mains + substats + set bonuses (SW %). */
export function applySymbolsToStats(
  base: CombatStatBlock,
  equipped: SymbolInstance[],
): CombatStatBlock {
  const stats = { ...base };
  const baseHp = base.hp;
  const baseAtk = base.atk;
  const baseDef = base.def;

  for (const s of equipped) {
    applyStatId(stats, s.mainStat, s.mainValue, baseHp, baseAtk, baseDef);
    for (const sub of s.substats ?? []) {
      applyStatId(stats, sub.stat, sub.value, baseHp, baseAtk, baseDef);
    }
    if (s.prefixStat && s.prefixValue) {
      applyStatId(stats, s.prefixStat, s.prefixValue, baseHp, baseAtk, baseDef);
    }
  }

  const counts = countSymbolSets(equipped);
  const hwalroSets = Math.floor((counts.hwalro ?? 0) / 2);
  for (let i = 0; i < hwalroSets; i++) stats.hp = Math.round(stats.hp * 1.15);
  if ((counts.yongmaeng ?? 0) >= 4) stats.atk = Math.round(stats.atk * 1.35);
  if ((counts.chimtu ?? 0) >= 4) stats.critDmg = Math.round(stats.critDmg * 1.4);
  if ((counts.haengma ?? 0) >= 4) stats.spd = Math.round(stats.spd * 1.25);
  const gunhimSets = Math.floor((counts.gunhim ?? 0) / 2);
  for (let i = 0; i < gunhimSets; i++) stats.def = Math.round(stats.def * 1.15);
  const yeongyeolSets = Math.floor((counts.yeongyeol ?? 0) / 2);
  stats.resistance += yeongyeolSets * 20;
  const mussangSets = Math.floor((counts.mussang ?? 0) / 2);
  stats.critRate += mussangSets * 12;
  const jipjungSets = Math.floor((counts.jipjung ?? 0) / 2);
  stats.accuracy += jipjungSets * 20;

  return stats;
}

export interface SymbolSetProgress {
  setId: SymbolSetId;
  nameKo: string;
  count: number;
  pieces: number;
  active: boolean;
  effectKo: string;
}

export function summarizeSymbolSets(
  equipped: SymbolInstance[],
): SymbolSetProgress[] {
  const counts = countSymbolSets(equipped);
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

export function symbolEnhanceManaCost(enhance: number): number {
  return 60 + enhance * 35;
}

export const MAX_SYMBOL_ENHANCE = 15;
export const MAX_SYMBOL_SUBSTATS = 4;
/** Enhance levels that unlock or power a substat (SW-style). */
export const SYMBOL_SUBSTAT_PROC_LEVELS = [3, 6, 9, 12] as const;

function rollOneSubstat(
  mainStat: string,
  used: Set<string>,
  stars: SymbolStars,
  rng: () => number,
): SymbolSubstat | null {
  const pool = SUBSTAT_POOL.filter((s) => !used.has(s) && s !== mainStat);
  if (pool.length === 0) return null;
  const stat = pool[Math.floor(rng() * pool.length) % pool.length]!;
  return { stat, value: rollSubstatValue(stat, stars, rng) };
}

function powerSubstat(
  sub: SymbolSubstat,
  stars: SymbolStars,
  rng: () => number,
): SymbolSubstat {
  return {
    ...sub,
    value: sub.value + rollSubstatValue(sub.stat, stars, rng),
  };
}

/**
 * Grindstone v1: power one existing substat (SW grindstone).
 * Returns null when the symbol has no substats.
 */
export function grindEnhanceSubstat(
  s: SymbolInstance,
  rng: () => number = Math.random,
  subIndex?: number,
): SymbolInstance | null {
  const subs = s.substats ?? [];
  if (subs.length === 0) return null;
  const idx =
    typeof subIndex === "number" &&
    Number.isFinite(subIndex) &&
    subIndex >= 0 &&
    subIndex < subs.length
      ? Math.floor(subIndex)
      : Math.floor(rng() * subs.length) % subs.length;
  return {
    ...s,
    substats: subs.map((sub, i) =>
      i === idx ? powerSubstat(sub, s.stars as SymbolStars, rng) : sub,
    ),
  };
}

/**
 * +1 enhance; at +3/+6/+9/+12 unlock a new substat (max 4) or power an existing one.
 */
export function bumpSymbolEnhance(
  s: SymbolInstance,
  rng: () => number = Math.random,
): SymbolInstance {
  const enhance = s.enhance + 1;
  let substats = [...(s.substats ?? [])];
  if ((SYMBOL_SUBSTAT_PROC_LEVELS as readonly number[]).includes(enhance)) {
    if (substats.length < MAX_SYMBOL_SUBSTATS) {
      const used = new Set<string>([
        s.mainStat,
        ...substats.map((x) => x.stat),
      ]);
      const added = rollOneSubstat(
        s.mainStat,
        used,
        s.stars as SymbolStars,
        rng,
      );
      if (added) substats = [...substats, added];
    } else if (substats.length > 0) {
      const idx = Math.floor(rng() * substats.length) % substats.length;
      substats = substats.map((sub, i) =>
        i === idx ? powerSubstat(sub, s.stars as SymbolStars, rng) : sub,
      );
    }
  }
  return {
    ...s,
    enhance,
    mainValue: mainStatAtEnhance(s.mainStat as SymbolStatId, s.stars, enhance),
    substats,
  };
}

export function describeSymbol(s: SymbolInstance): string {
  const set = SYMBOL_SETS.find((x) => x.id === s.setId);
  const main = `${s.mainStat} ${s.mainValue}`;
  const prefix =
    s.prefixStat && s.prefixValue
      ? ` · 접두 ${s.prefixStat} ${s.prefixValue}`
      : "";
  return `${set?.nameKo ?? s.setId} ★${s.stars} 슬롯${s.slot} +${s.enhance} (${main}${prefix})`;
}
