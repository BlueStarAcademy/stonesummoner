import type {
  SymbolInstance,
  SymbolSetDef,
  SymbolSetId,
  SymbolSubstat,
} from "./symbols.js";
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

/**
 * Resolve Intangible pieces as missing pieces of equipped sets.
 * A one-piece deficit is preferred; ties favor 4-piece sets, matching the
 * common 3+Intangible use before 1+Intangible two-piece completion.
 */
export function effectiveSymbolSetCounts(
  equipped: SymbolInstance[],
): Partial<Record<SymbolSetId, number>> {
  const counts = countSymbolSets(equipped);
  let wildcards = counts.muhyeong ?? 0;
  delete counts.muhyeong;
  while (wildcards > 0) {
    const candidate = SYMBOL_SETS.filter((set) => !set.wildcard)
      .map((set) => {
        const count = counts[set.id] ?? 0;
        const remainder = count % set.pieces;
        const deficit = remainder === 0 ? set.pieces : set.pieces - remainder;
        return { set, count, deficit };
      })
      .filter(({ count, deficit }) => count > 0 && deficit <= wildcards)
      .sort(
        (a, b) =>
          a.deficit - b.deficit ||
          b.set.pieces - a.set.pieces ||
          b.count - a.count ||
          a.set.id.localeCompare(b.set.id),
      )[0];
    if (!candidate) break;
    counts[candidate.set.id] =
      (counts[candidate.set.id] ?? 0) + candidate.deficit;
    wildcards -= candidate.deficit;
  }
  if (wildcards > 0) counts.muhyeong = wildcards;
  return counts;
}

export function symbolCombatMods(equipped: SymbolInstance[]): SymbolCombatMods {
  const counts = effectiveSymbolSetCounts(equipped);
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

  const counts = effectiveSymbolSetCounts(equipped);
  const hwalroSets = Math.floor((counts.hwalro ?? 0) / 2);
  // 2-set bonuses stack additively (4 pieces = 2x the listed effect).
  if (hwalroSets > 0) stats.hp = Math.round(stats.hp * (1 + 0.15 * hwalroSets));
  if ((counts.yongmaeng ?? 0) >= 4) stats.atk = Math.round(stats.atk * 1.35);
  if ((counts.chimtu ?? 0) >= 4) stats.critDmg = Math.round(stats.critDmg * 1.4);
  if ((counts.haengma ?? 0) >= 4) stats.spd = Math.round(stats.spd * 1.25);
  const gunhimSets = Math.floor((counts.gunhim ?? 0) / 2);
  if (gunhimSets > 0) stats.def = Math.round(stats.def * (1 + 0.15 * gunhimSets));
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
  /** Completed 2-sets or 4-sets (`floor(count / pieces)`). */
  completions: number;
  active: boolean;
  effectKo: string;
}

export function symbolSetCompletions(count: number, pieces: 2 | 4): number {
  return Math.max(0, Math.floor(count / pieces));
}

/** Listed set effect scaled by completed sets (4 of a 2-set = 2x). */
export function formatSymbolSetEffect(
  set: SymbolSetDef,
  completions: number,
): string {
  const n = completions;
  if (n <= 1) return set.effectKo;
  switch (set.id) {
    case "hwalro":
      return `체력 +${15 * n}%`;
    case "yongmaeng":
      return `공격력 +${35 * n}%`;
    case "mussang":
      return `치명확률 +${12 * n}%`;
    case "haengma":
      return `속도 +${25 * n}%`;
    case "jipjung":
      return `효과적중 +${20 * n}%`;
    case "gunhim":
      return `방어력 +${15 * n}%`;
    case "yeongyeol":
      return `효과저항 +${20 * n}%`;
    case "bogang":
      return `착용자 실드 3턴(체력의 ${15 * n}%)`;
    case "hwangyeok":
      return `반격확률 +${15 * n}%`;
    case "ssangnip":
      return `면역 ${n}턴`;
    case "eungjing":
      return `피격 시 ATB +${4 * n}%(HP 7% 손실마다)`;
    case "tagae":
      return `흡혈 +${35 * n}%(데미지)`;
    case "pamyeol":
      return `피해의 30%로 적 최대HP 감소(회당 최대 ${4 * n}%)`;
    case "myosu":
      return `기절 확률 +${25 * n}%`;
    case "gyeongno":
      return `추가턴 +${22 * n}%`;
    case "chimtu":
      return `치명피해 +${40 * n}%`;
    default:
      return set.effectKo;
  }
}

export function summarizeSymbolSets(
  equipped: SymbolInstance[],
): SymbolSetProgress[] {
  const rawCounts = countSymbolSets(equipped);
  const counts = effectiveSymbolSetCounts(equipped);
  return SYMBOL_SETS.map((set) => {
    const rawCount = rawCounts[set.id] ?? 0;
    const count = counts[set.id] ?? 0;
    const completions = symbolSetCompletions(count, set.pieces);
    return {
      setId: set.id,
      nameKo: set.nameKo,
      count: set.wildcard ? rawCount : count,
      pieces: set.pieces,
      completions: set.wildcard ? 0 : completions,
      active: !set.wildcard && completions >= 1,
      effectKo: set.wildcard
        ? set.effectKo
        : formatSymbolSetEffect(set, completions),
    };
  }).filter((p) => p.count > 0 || (rawCounts[p.setId] ?? 0) > 0);
}

/** Gold cost to go from `enhance` → `enhance+1` (steeper past +8). */
export function symbolEnhanceManaCost(enhance: number): number {
  const base = 150 + enhance * 85;
  const late = Math.max(0, enhance - 8) * 70;
  return base + late;
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
