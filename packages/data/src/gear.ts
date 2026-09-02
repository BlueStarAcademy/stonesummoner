/** Summoner gear — 무기(속성전용) · 상의 · 하의 · 신발 · 반지 · 목걸이 (+얕은 세트) */

import type { Element } from "./monsters/types.js";
import { ELEMENTS } from "./monsters/types.js";

export type GearSlot =
  | "weapon"
  | "top"
  | "bottom"
  | "shoes"
  | "ring"
  | "necklace";

export type GearStars = 1 | 2 | 3 | 4 | 5;

/** Same keys as symbol quality (일반/고급/희귀/영웅/전설). */
export type GearQuality = "normal" | "advanced" | "rare" | "epic" | "legend";

/** Shallow gear sets — do not compete with symbol set depth. */
export type GearSetId = "mana" | "assault" | "guardian" | "sense" | "tempo";

/** Non-weapon armor/accessory material — drives art + stat bias. */
export type GearMaterialId = "cloth" | "leather" | "chain" | "plate";

export interface GearMaterialDef {
  id: GearMaterialId;
  nameKo: string;
  /** Multipliers applied to slot base stats (non-weapon only). */
  statMul: Partial<GearSetBonus>;
}

export interface GearSetDef {
  id: GearSetId;
  nameKo: string;
  /** Bonus when wearing 2+ pieces of this set. */
  bonus2: Partial<GearSetBonus>;
  /** Extra bonus when wearing 4+ pieces (stacks on top of 2pc). */
  bonus4: Partial<GearSetBonus>;
  /** Full 6-slot mono-set (stacks on 2+4). */
  bonus6: Partial<GearSetBonus>;
}

export interface GearSetBonus {
  manaRegenBonus: number;
  manaMaxBonus: number;
  boardSenseBonus: number;
  startManaPct: number;
  skillPowerBonus: number;
  summonerHpBonus: number;
  summonerDefBonus: number;
  leaderAtkBonus: number;
}

/** Stat axes a gear piece can carry. */
export type GearStatKey = keyof GearSetBonus;

/** Random secondary line rolled from `rollSeed`. */
export interface GearSubStat {
  stat: GearStatKey;
  value: number;
}

export type GearAffixKind = "econ" | "combat";

/** Where an affix lands once aggregated. */
export type GearAffixEffect =
  | "battleGold"
  | "exp"
  | "symbolChance"
  | "gearChance"
  | "scrollChance"
  | "crystalChance"
  | "startMana"
  | "manaRegen"
  | "boardSense"
  | "allyAtk"
  | "summonerHp"
  | "bossAtk";

export type GearAffixId =
  | "goldSurge"
  | "goldTouch"
  | "crystalEye"
  | "symbolLure"
  | "vaultGreed"
  | "scholar"
  | "scrollHoard"
  | "battleOpening"
  | "manaSpring"
  | "leaderRoar"
  | "bulwark"
  | "keenSense"
  | "giantSlayer";

export interface GearAffixDef {
  id: GearAffixId;
  nameKo: string;
  kind: GearAffixKind;
  effect: GearAffixEffect;
  /** Lowest ★ this affix can roll on. */
  minStars: 4 | 5;
  /** Restrict to these slots when set. */
  slots?: GearSlot[];
  /** Roll range as an additive fraction. */
  value: [number, number];
  weight: number;
}

/** A rolled special ability on a piece. */
export interface GearAffixRoll {
  id: GearAffixId;
  value: number;
}

/** Aggregated affix effects for a full loadout. */
export interface GearAffixTotals {
  battleGoldMul: number;
  expMul: number;
  symbolChanceMul: number;
  gearChanceMul: number;
  scrollChanceMul: number;
  crystalChanceMul: number;
  startManaPctAdd: number;
  manaRegenMul: number;
  boardSenseMul: number;
  allyAtkAdd: number;
  summonerHpMul: number;
  bossAtkAdd: number;
}

export interface GearSetProgress {
  setId: GearSetId;
  nameKo: string;
  count: number;
  active2: boolean;
  active4: boolean;
  active6: boolean;
}

export interface GearPiece {
  id: string;
  slot: GearSlot;
  nameKo: string;
  stars: GearStars;
  quality: GearQuality;
  enhance: number;
  setId: GearSetId;
  /** Non-weapon material — art path + stat bias. */
  materialId?: GearMaterialId;
  /** Required for weapons — element lock. */
  element?: Element;
  /** Added to manaRegenPerTick */
  manaRegenBonus: number;
  /** Added to manaMax */
  manaMaxBonus: number;
  /** Added to boardSense (0~1 scale) */
  boardSenseBonus: number;
  /** Extra start mana as fraction of manaMax */
  startManaPct: number;
  /** Multiplies summoner skill (진문개방) coeff */
  skillPowerBonus: number;
  /** Flat summoner unit HP */
  summonerHpBonus: number;
  /** Flat summoner unit DEF */
  summonerDefBonus: number;
  /** Ally monster ATK multiplier bonus (leader-type) */
  leaderAtkBonus: number;
  /** Per-instance randomness seed — the only random source for the fields below. */
  rollSeed: number;
  /** Main stat variance multiplier derived from `rollSeed`. */
  rollPct: number;
  /** Random secondary lines derived from `rollSeed`. */
  subStats: GearSubStat[];
  /** Special abilities derived from `rollSeed` (★4+ only). */
  affixes: GearAffixRoll[];
}

export interface SummonerGear {
  weapon: GearPiece | null;
  top: GearPiece | null;
  bottom: GearPiece | null;
  shoes: GearPiece | null;
  ring: GearPiece | null;
  necklace: GearPiece | null;
}

export const MAX_GEAR_ENHANCE = 15;

export const GEAR_SLOTS: readonly GearSlot[] = [
  "weapon",
  "top",
  "bottom",
  "shoes",
  "ring",
  "necklace",
] as const;

export const GEAR_SETS: GearSetDef[] = [
  {
    id: "mana",
    nameKo: "진액",
    bonus2: { manaRegenBonus: 0.08, manaMaxBonus: 8 },
    bonus4: { startManaPct: 0.05, manaMaxBonus: 12 },
    bonus6: { manaRegenBonus: 0.06, manaMaxBonus: 16 },
  },
  {
    id: "assault",
    nameKo: "돌격",
    bonus2: { skillPowerBonus: 0.04, leaderAtkBonus: 0.005 },
    bonus4: { skillPowerBonus: 0.06, leaderAtkBonus: 0.01 },
    bonus6: { skillPowerBonus: 0.05, leaderAtkBonus: 0.012 },
  },
  {
    id: "guardian",
    nameKo: "수호",
    bonus2: { summonerHpBonus: 40, summonerDefBonus: 4 },
    bonus4: { summonerHpBonus: 60, summonerDefBonus: 6 },
    bonus6: { summonerHpBonus: 50, summonerDefBonus: 8 },
  },
  {
    id: "sense",
    nameKo: "감응",
    bonus2: { boardSenseBonus: 0.05 },
    bonus4: { boardSenseBonus: 0.08, manaRegenBonus: 0.04 },
    bonus6: { boardSenseBonus: 0.06, startManaPct: 0.04 },
  },
  {
    id: "tempo",
    nameKo: "진속",
    bonus2: { startManaPct: 0.04, boardSenseBonus: 0.03 },
    bonus4: { startManaPct: 0.04, skillPowerBonus: 0.03 },
    bonus6: { manaRegenBonus: 0.05, leaderAtkBonus: 0.008 },
  },
];

export const GEAR_MATERIALS: GearMaterialDef[] = [
  {
    id: "cloth",
    nameKo: "천",
    statMul: {
      manaRegenBonus: 1.18,
      boardSenseBonus: 1.14,
      skillPowerBonus: 1.06,
      summonerHpBonus: 0.82,
      summonerDefBonus: 0.82,
    },
  },
  {
    id: "leather",
    nameKo: "가죽",
    statMul: {
      startManaPct: 1.22,
      leaderAtkBonus: 1.18,
      manaRegenBonus: 1.06,
      summonerDefBonus: 0.95,
    },
  },
  {
    id: "chain",
    nameKo: "사슬",
    statMul: {
      summonerHpBonus: 1.12,
      summonerDefBonus: 1.18,
      skillPowerBonus: 1.08,
      leaderAtkBonus: 1.05,
    },
  },
  {
    id: "plate",
    nameKo: "판금",
    statMul: {
      summonerHpBonus: 1.28,
      summonerDefBonus: 1.28,
      manaRegenBonus: 0.88,
      startManaPct: 0.9,
    },
  },
];

/**
 * Special abilities. ★4 rolls one, ★5 rolls two distinct ids.
 * `value` is always an additive fraction, so a 1.0 roll on `goldSurge`
 * means double battle gold.
 */
export const GEAR_AFFIXES: GearAffixDef[] = [
  {
    id: "goldSurge",
    nameKo: "황금 격류",
    kind: "econ",
    effect: "battleGold",
    minStars: 5,
    slots: ["weapon", "necklace"],
    value: [0.6, 1],
    weight: 6,
  },
  {
    id: "goldTouch",
    nameKo: "황금 손길",
    kind: "econ",
    effect: "battleGold",
    minStars: 4,
    value: [0.2, 0.35],
    weight: 12,
  },
  {
    id: "crystalEye",
    nameKo: "결정안",
    kind: "econ",
    effect: "crystalChance",
    minStars: 4,
    value: [0.5, 1],
    weight: 9,
  },
  {
    id: "symbolLure",
    nameKo: "진문 유인",
    kind: "econ",
    effect: "symbolChance",
    minStars: 4,
    value: [0.2, 0.4],
    weight: 10,
  },
  {
    id: "vaultGreed",
    nameKo: "금고의 탐욕",
    kind: "econ",
    effect: "gearChance",
    minStars: 4,
    value: [0.25, 0.5],
    weight: 9,
  },
  {
    id: "scholar",
    nameKo: "현자의 기록",
    kind: "econ",
    effect: "exp",
    minStars: 4,
    value: [0.15, 0.3],
    weight: 11,
  },
  {
    id: "scrollHoard",
    nameKo: "소환서 수집",
    kind: "econ",
    effect: "scrollChance",
    minStars: 4,
    value: [0.3, 0.6],
    weight: 10,
  },
  {
    id: "battleOpening",
    nameKo: "선공 개진",
    kind: "combat",
    effect: "startMana",
    minStars: 4,
    value: [0.1, 0.2],
    weight: 11,
  },
  {
    id: "manaSpring",
    nameKo: "진액 샘",
    kind: "combat",
    effect: "manaRegen",
    minStars: 4,
    value: [0.08, 0.15],
    weight: 11,
  },
  {
    id: "leaderRoar",
    nameKo: "지휘의 포효",
    kind: "combat",
    effect: "allyAtk",
    minStars: 4,
    value: [0.05, 0.1],
    weight: 10,
  },
  {
    id: "bulwark",
    nameKo: "불굴의 방벽",
    kind: "combat",
    effect: "summonerHp",
    minStars: 4,
    value: [0.08, 0.15],
    weight: 11,
  },
  {
    id: "keenSense",
    nameKo: "예리한 감응",
    kind: "combat",
    effect: "boardSense",
    minStars: 4,
    value: [0.1, 0.2],
    weight: 10,
  },
  {
    id: "giantSlayer",
    nameKo: "거수 사냥",
    kind: "combat",
    effect: "bossAtk",
    minStars: 4,
    value: [0.1, 0.18],
    weight: 8,
  },
];

export function getGearAffix(id: GearAffixId): GearAffixDef | undefined {
  return GEAR_AFFIXES.find((a) => a.id === id);
}

export function isGearAffixId(raw: unknown): raw is GearAffixId {
  return typeof raw === "string" && GEAR_AFFIXES.some((a) => a.id === raw);
}

export const GEAR_STAT_KEYS: readonly GearStatKey[] = [
  "manaRegenBonus",
  "manaMaxBonus",
  "boardSenseBonus",
  "startManaPct",
  "skillPowerBonus",
  "summonerHpBonus",
  "summonerDefBonus",
  "leaderAtkBonus",
] as const;

/** Stats stored as whole numbers; the rest keep 4 decimals. */
const GEAR_INT_STATS: readonly GearStatKey[] = [
  "manaMaxBonus",
  "summonerHpBonus",
  "summonerDefBonus",
] as const;

/** Typical ★1 main-stat magnitude per axis — substat rolls scale off this. */
const GEAR_STAT_SCALE: Record<GearStatKey, number> = {
  manaRegenBonus: 0.12,
  manaMaxBonus: 10,
  boardSenseBonus: 0.08,
  startManaPct: 0.05,
  skillPowerBonus: 0.06,
  summonerHpBonus: 40,
  summonerDefBonus: 4,
  leaderAtkBonus: 0.01,
};

/** Main stat variance band — wider at higher ★. */
const GEAR_ROLL_RANGE: Record<GearStars, [number, number]> = {
  1: [0.9, 1.1],
  2: [0.9, 1.1],
  3: [0.88, 1.14],
  4: [0.86, 1.18],
  5: [0.85, 1.22],
};

function hashStringToSeed(raw: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Independent xorshift32 stream per salt so adding a roll never shifts others. */
function seededStream(seed: number, salt: string): () => number {
  let s = (seed ^ hashStringToSeed(salt)) >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return () => {
    s ^= (s << 13) >>> 0;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= (s << 5) >>> 0;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function normalizeGearRollSeed(raw: unknown, fallbackId: string): number {
  const n = Number(raw);
  if (Number.isFinite(n) && n !== 0) return Math.abs(Math.floor(n)) >>> 0;
  return hashStringToSeed(fallbackId || "gear");
}

function roundStat(key: GearStatKey, value: number): number {
  return GEAR_INT_STATS.includes(key)
    ? Math.round(value)
    : Number(value.toFixed(4));
}

/** Main stat variance factor for a piece. */
export function gearRollPct(stars: GearStars, rollSeed: number): number {
  const [lo, hi] = GEAR_ROLL_RANGE[normalizeGearStars(stars)];
  const rng = seededStream(rollSeed, "main");
  return Number((lo + rng() * (hi - lo)).toFixed(3));
}

function subStatCount(stars: GearStars, rng: () => number): number {
  switch (normalizeGearStars(stars)) {
    case 1:
      return 0;
    case 2:
    case 3:
      return 1;
    case 4:
      return 2;
    default:
      return rng() < 0.25 ? 3 : 2;
  }
}

/** Random secondary lines, drawn only from axes the slot does not already carry. */
export function rollGearSubStats(
  slot: GearSlot,
  stars: GearStars,
  rollSeed: number,
): GearSubStat[] {
  const rng = seededStream(rollSeed, "sub");
  const count = subStatCount(stars, rng);
  if (count <= 0) return [];
  const base = baseBonusesForSlot(slot, stars);
  const pool = GEAR_STAT_KEYS.filter((key) => !base[key]);
  const out: GearSubStat[] = [];
  const available = [...pool];
  const mul = gearStarMul(stars);
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length) % available.length;
    const key = available.splice(idx, 1)[0]!;
    const raw = GEAR_STAT_SCALE[key] * (0.25 + rng() * 0.3) * mul;
    const value = roundStat(key, raw);
    if (value <= 0) continue;
    out.push({ stat: key, value });
  }
  return out;
}

/** Special abilities: none below ★4, one at ★4, two distinct at ★5. */
export function rollGearAffixes(
  slot: GearSlot,
  stars: GearStars,
  rollSeed: number,
): GearAffixRoll[] {
  const s = normalizeGearStars(stars);
  if (s < 4) return [];
  const count = s === 5 ? 2 : 1;
  const rng = seededStream(rollSeed, "affix");
  const pool = GEAR_AFFIXES.filter(
    (def) => s >= def.minStars && (!def.slots || def.slots.includes(slot)),
  );
  const out: GearAffixRoll[] = [];
  const available = [...pool];
  for (let i = 0; i < count && available.length > 0; i++) {
    const total = available.reduce((n, def) => n + def.weight, 0);
    let roll = rng() * total;
    let picked = available[available.length - 1]!;
    for (const def of available) {
      roll -= def.weight;
      if (roll <= 0) {
        picked = def;
        break;
      }
    }
    available.splice(available.indexOf(picked), 1);
    const [lo, hi] = picked.value;
    out.push({
      id: picked.id,
      value: Number((lo + rng() * (hi - lo)).toFixed(3)),
    });
  }
  return out;
}

const MATERIAL_WEIGHTS: { value: GearMaterialId; w: number }[] = GEAR_MATERIALS.map(
  (m) => ({ value: m.id, w: 1 }),
);

const DEFAULT_SET_BY_SLOT: Record<GearSlot, GearSetId> = {
  weapon: "assault",
  top: "guardian",
  bottom: "guardian",
  shoes: "mana",
  ring: "assault",
  necklace: "sense",
};

/** ★1 gray → ★5 red (same palette as inv-grade). */
export function gearStarsToInvGrade(
  stars: number,
): "gray" | "green" | "blue" | "purple" | "red" {
  const n = Math.max(1, Math.min(5, Math.floor(stars) || 1));
  return (["gray", "green", "blue", "purple", "red"] as const)[n - 1]!;
}

/** Player-facing gear tier label — follows ★ count, not the hidden quality roll. */
export function gearStarsToQuality(stars: number): GearQuality {
  const n = Math.max(1, Math.min(5, Math.floor(stars) || 1));
  return (["normal", "advanced", "rare", "epic", "legend"] as const)[n - 1]!;
}

/** Per-★ combat multiplier — steep curve so ★5 reads clearly above ★1. */
const GEAR_STAR_MUL: Record<GearStars, number> = {
  1: 1,
  2: 1.26,
  3: 1.58,
  4: 1.96,
  5: 2.45,
};

export function gearStarMul(stars: GearStars): number {
  return GEAR_STAR_MUL[normalizeGearStars(stars)];
}

/** Tier label multiplier (일반→전설) — stacks with ★ for readable grade jumps. */
export function gearQualityMul(quality: GearQuality): number {
  switch (quality) {
    case "advanced":
      return 1.14;
    case "rare":
      return 1.32;
    case "epic":
      return 1.54;
    case "legend":
      return 1.8;
    default:
      return 1;
  }
}

export function normalizeGearStars(raw: unknown): GearStars {
  const n = Math.floor(Number(raw));
  if (n >= 1 && n <= 5) return n as GearStars;
  return 1;
}

export function normalizeGearQuality(raw: unknown): GearQuality {
  if (
    raw === "normal" ||
    raw === "advanced" ||
    raw === "rare" ||
    raw === "epic" ||
    raw === "legend"
  ) {
    return raw;
  }
  return "normal";
}

export function isGearSlot(raw: string): raw is GearSlot {
  return (GEAR_SLOTS as readonly string[]).includes(raw);
}

/** Map legacy slot ids onto the redesigned 6 slots. */
export function migrateGearSlot(raw: string | undefined | null): GearSlot {
  switch (raw) {
    case "weapon":
      return "weapon";
    case "top":
    case "robe":
    case "armor":
      return "top";
    case "bottom":
    case "cloak":
      return "bottom";
    case "shoes":
    case "accessory":
      return "shoes";
    case "ring":
      return "ring";
    case "necklace":
    case "orb":
    case "helm":
      return "necklace";
    default:
      return "shoes";
  }
}

const WEAPON_NAMES: Record<Element, string[]> = {
  fire: ["염화검", "작열창", "폭염검", "광염대검", "멸화창"],
  water: ["해연검", "파도창", "심해검", "해류대검", "청해창"],
  wind: ["질풍검", "폭풍창", "돌풍검", "천풍대검", "극풍창"],
  light: ["성휘검", "광염창", "성광검", "천광대검", "섬광창"],
  dark: ["심연검", "그림자창", "암흑검", "심연대검", "망령창"],
};

const DROP_NAMES: Record<Exclude<GearSlot, "weapon">, string[]> = {
  top: ["수호 상의", "비늘 상의", "요새 상의", "철벽 상의", "성역 상의"],
  bottom: ["지휘 하의", "전장 하의", "결속 하의", "궤도 하의", "정예 하의"],
  shoes: ["진액 신발", "질주 신발", "감응 신발", "신속 신발", "천벌 신발"],
  ring: ["결속 반지", "돌격 반지", "진액 반지", "현란 반지", "결정 반지"],
  necklace: ["감응 목걸이", "국면 목걸이", "따냄 목걸이", "명상 목걸이", "영광 목걸이"],
};

function gearStarNameIndex(stars: GearStars, poolLen: number): number {
  if (poolLen <= 0) return 0;
  return Math.min(Math.max(1, stars) - 1, poolLen - 1);
}

/** Display name keyed by slot/element and ★1–5 (not stored nameKo). */
export function gearDisplayNameKo(piece: GearPiece): string {
  const stars = normalizeGearStars(piece.stars);
  if (piece.slot === "weapon") {
    const el = piece.element ?? "light";
    const pool = WEAPON_NAMES[el];
    return pool[gearStarNameIndex(stars, pool.length)] ?? piece.nameKo;
  }
  const pool = DROP_NAMES[piece.slot];
  return pool[gearStarNameIndex(stars, pool.length)] ?? piece.nameKo;
}

function gearNameKoForSlot(
  slot: GearSlot,
  stars: GearStars,
  element?: Element,
): string {
  if (slot === "weapon") {
    const el = element ?? "light";
    const pool = WEAPON_NAMES[el];
    return pool[gearStarNameIndex(stars, pool.length)] ?? pool[0]!;
  }
  const pool = DROP_NAMES[slot];
  return pool[gearStarNameIndex(stars, pool.length)] ?? pool[0]!;
}

function emptyBonus(): GearSetBonus {
  return {
    manaRegenBonus: 0,
    manaMaxBonus: 0,
    boardSenseBonus: 0,
    startManaPct: 0,
    skillPowerBonus: 0,
    summonerHpBonus: 0,
    summonerDefBonus: 0,
    leaderAtkBonus: 0,
  };
}

function mergeBonus(
  into: GearSetBonus,
  add: Partial<GearSetBonus> | undefined,
): void {
  if (!add) return;
  into.manaRegenBonus += add.manaRegenBonus ?? 0;
  into.manaMaxBonus += add.manaMaxBonus ?? 0;
  into.boardSenseBonus += add.boardSenseBonus ?? 0;
  into.startManaPct += add.startManaPct ?? 0;
  into.skillPowerBonus += add.skillPowerBonus ?? 0;
  into.summonerHpBonus += add.summonerHpBonus ?? 0;
  into.summonerDefBonus += add.summonerDefBonus ?? 0;
  into.leaderAtkBonus += add.leaderAtkBonus ?? 0;
}

export function getGearSet(id: GearSetId): GearSetDef | undefined {
  return GEAR_SETS.find((s) => s.id === id);
}

export function isGearSetId(raw: string): raw is GearSetId {
  return (
    raw === "mana" ||
    raw === "assault" ||
    raw === "guardian" ||
    raw === "sense" ||
    raw === "tempo"
  );
}

export function isGearMaterialId(raw: string): raw is GearMaterialId {
  return raw === "cloth" || raw === "leather" || raw === "chain" || raw === "plate";
}

export function normalizeGearMaterial(raw: unknown): GearMaterialId {
  if (typeof raw === "string" && isGearMaterialId(raw)) return raw;
  return "cloth";
}

export function getGearMaterial(id: GearMaterialId): GearMaterialDef {
  return GEAR_MATERIALS.find((m) => m.id === id) ?? GEAR_MATERIALS[0]!;
}

function applyMaterialBonuses<
  T extends Pick<
    GearPiece,
    | "manaRegenBonus"
    | "manaMaxBonus"
    | "boardSenseBonus"
    | "startManaPct"
    | "skillPowerBonus"
    | "summonerHpBonus"
    | "summonerDefBonus"
    | "leaderAtkBonus"
  >,
>(bonuses: T, materialId: GearMaterialId): T {
  const mul = getGearMaterial(materialId).statMul;
  const out = { ...bonuses };
  for (const key of Object.keys(mul) as (keyof GearSetBonus)[]) {
    const factor = mul[key];
    if (factor == null || out[key] == null) continue;
    const v = out[key];
    if (typeof v === "number") {
      (out as Record<string, number>)[key] =
        key === "summonerHpBonus" || key === "summonerDefBonus" || key === "manaMaxBonus"
          ? Math.round(v * factor)
          : Number((v * factor).toFixed(4));
    }
  }
  return out;
}

function scaleStat(base: number, stars: GearStars): number {
  const tierQuality = gearStarsToQuality(stars);
  return base * gearStarMul(stars) * gearQualityMul(tierQuality);
}

function baseBonusesForSlot(
  slot: GearSlot,
  stars: GearStars,
): Pick<
  GearPiece,
  | "manaRegenBonus"
  | "manaMaxBonus"
  | "boardSenseBonus"
  | "startManaPct"
  | "skillPowerBonus"
  | "summonerHpBonus"
  | "summonerDefBonus"
  | "leaderAtkBonus"
> {
  const s = (n: number) => scaleStat(n, stars);
  switch (slot) {
    case "weapon":
      return {
        skillPowerBonus: s(0.06),
        manaRegenBonus: s(0.02),
        manaMaxBonus: 0,
        boardSenseBonus: 0,
        startManaPct: 0,
        summonerHpBonus: 0,
        summonerDefBonus: 0,
        leaderAtkBonus: 0,
      };
    case "top":
      return {
        summonerHpBonus: Math.round(s(40)),
        summonerDefBonus: Math.round(s(4)),
        manaMaxBonus: Math.round(s(2)),
        manaRegenBonus: 0,
        boardSenseBonus: 0,
        startManaPct: 0,
        skillPowerBonus: 0,
        leaderAtkBonus: 0,
      };
    case "bottom":
      return {
        summonerHpBonus: Math.round(s(25)),
        summonerDefBonus: Math.round(s(2)),
        leaderAtkBonus: s(0.008),
        manaRegenBonus: 0,
        manaMaxBonus: 0,
        boardSenseBonus: 0,
        startManaPct: 0,
        skillPowerBonus: 0,
      };
    case "shoes":
      return {
        manaRegenBonus: s(0.12),
        manaMaxBonus: Math.round(s(10)),
        startManaPct: s(0.05),
        boardSenseBonus: s(0.01),
        skillPowerBonus: 0,
        summonerHpBonus: 0,
        summonerDefBonus: 0,
        leaderAtkBonus: 0,
      };
    case "ring":
      return {
        skillPowerBonus: s(0.02),
        leaderAtkBonus: s(0.01),
        manaRegenBonus: 0,
        manaMaxBonus: 0,
        boardSenseBonus: 0,
        startManaPct: 0,
        summonerHpBonus: 0,
        summonerDefBonus: 0,
      };
    case "necklace":
      return {
        boardSenseBonus: s(0.08),
        skillPowerBonus: s(0.01),
        manaRegenBonus: 0,
        manaMaxBonus: 0,
        startManaPct: 0,
        summonerHpBonus: 0,
        summonerDefBonus: 0,
        leaderAtkBonus: 0,
      };
  }
}

type GearBonusFields = Pick<
  GearPiece,
  | "manaRegenBonus"
  | "manaMaxBonus"
  | "boardSenseBonus"
  | "startManaPct"
  | "skillPowerBonus"
  | "summonerHpBonus"
  | "summonerDefBonus"
  | "leaderAtkBonus"
>;

function applyRollVariance<T extends GearBonusFields>(bonuses: T, rollPct: number): T {
  const out = { ...bonuses };
  for (const key of GEAR_STAT_KEYS) {
    const v = out[key];
    if (!v) continue;
    (out as Record<string, number>)[key] = roundStat(key, v * rollPct);
  }
  return out;
}

function addSubStats<T extends GearBonusFields>(
  bonuses: T,
  subStats: GearSubStat[],
): T {
  if (!subStats.length) return bonuses;
  const out = { ...bonuses };
  for (const sub of subStats) {
    const cur = out[sub.stat] ?? 0;
    (out as Record<string, number>)[sub.stat] = roundStat(
      sub.stat,
      cur + sub.value,
    );
  }
  return out;
}

function basePiece(
  partial: Omit<
    GearPiece,
    | keyof GearBonusFields
    | "stars"
    | "quality"
    | "rollSeed"
    | "rollPct"
    | "subStats"
    | "affixes"
  > &
    Partial<
      GearBonusFields &
        Pick<
          GearPiece,
          | "stars"
          | "quality"
          | "element"
          | "rollSeed"
          | "rollPct"
          | "subStats"
          | "affixes"
        >
    >,
  opts?: { variance?: boolean },
): GearPiece {
  const stars = normalizeGearStars(partial.stars ?? 1);
  const quality = gearStarsToQuality(stars);
  const materialId =
    partial.slot === "weapon" ? undefined : normalizeGearMaterial(partial.materialId);
  const variance = opts?.variance ?? true;
  const rollSeed = normalizeGearRollSeed(partial.rollSeed, partial.id);
  const rollPct = variance ? gearRollPct(stars, rollSeed) : 1;
  const subStats = variance ? rollGearSubStats(partial.slot, stars, rollSeed) : [];
  const affixes = variance ? rollGearAffixes(partial.slot, stars, rollSeed) : [];
  let scaled = baseBonusesForSlot(partial.slot, stars);
  if (materialId) scaled = applyMaterialBonuses(scaled, materialId);
  scaled = applyRollVariance(scaled, rollPct);
  scaled = addSubStats(scaled, subStats);
  return {
    ...scaled,
    ...partial,
    stars,
    quality,
    materialId,
    rollSeed,
    rollPct,
    subStats,
    affixes,
  };
}

export function createEmptyGear(): SummonerGear {
  return {
    weapon: null,
    top: null,
    bottom: null,
    shoes: null,
    ring: null,
    necklace: null,
  };
}

/** Unupgraded default loadout from older saves — not a real drop. */
export function isDefaultStarterGear(piece: GearPiece | null | undefined): boolean {
  if (!piece || (piece.enhance ?? 0) > 0) return false;
  const id = piece.id ?? "";
  return (
    /^wpn_starter_(fire|water|wind|light|dark)$/.test(id) ||
    id === "top_guardian" ||
    id === "bottom_command" ||
    id === "shoes_mana" ||
    id === "ring_bond" ||
    id === "necklace_sense"
  );
}

/** Catalog piece — canonical values, no roll variance. */
function fixedPiece(partial: Parameters<typeof basePiece>[0]): GearPiece {
  return basePiece(partial, { variance: false });
}

export function createStarterGear(element: Element = "light"): SummonerGear {
  const weaponNames = WEAPON_NAMES[element];
  return {
    weapon: basePiece({
      id: `wpn_starter_${element}`,
      slot: "weapon",
      nameKo: weaponNames[0]!,
      enhance: 0,
      setId: "assault",
      element,
      stars: 1,
      quality: "normal",
    }),
    top: basePiece({
      id: "top_guardian",
      slot: "top",
      nameKo: "수호 상의",
      enhance: 0,
      setId: "guardian",
      materialId: "plate",
      stars: 1,
      quality: "normal",
    }),
    bottom: basePiece({
      id: "bottom_command",
      slot: "bottom",
      nameKo: "지휘 하의",
      enhance: 0,
      setId: "guardian",
      materialId: "chain",
      stars: 1,
      quality: "normal",
    }),
    shoes: basePiece({
      id: "shoes_mana",
      slot: "shoes",
      nameKo: "진액 신발",
      enhance: 0,
      setId: "mana",
      materialId: "leather",
      stars: 1,
      quality: "normal",
    }),
    ring: basePiece({
      id: "ring_bond",
      slot: "ring",
      nameKo: "결속 반지",
      enhance: 0,
      setId: "assault",
      materialId: "plate",
      stars: 1,
      quality: "normal",
    }),
    necklace: basePiece({
      id: "necklace_sense",
      slot: "necklace",
      nameKo: "감응 목걸이",
      enhance: 0,
      setId: "sense",
      materialId: "cloth",
      stars: 1,
      quality: "normal",
    }),
  };
}

/** Ensure optional combat fields exist on a piece (legacy saves). */
export function normalizeGearPiece(
  piece: GearPiece | (Partial<GearPiece> & { slot?: string }),
  fallbackSlot?: GearSlot,
): GearPiece {
  const slot = migrateGearSlot(piece.slot ?? fallbackSlot ?? "shoes");
  const setId =
    piece.setId && isGearSetId(piece.setId)
      ? piece.setId
      : DEFAULT_SET_BY_SLOT[slot];
  const stars = normalizeGearStars(piece.stars);
  const quality = gearStarsToQuality(stars);
  const element =
    slot === "weapon"
      ? ELEMENTS.includes(piece.element as Element)
        ? (piece.element as Element)
        : "light"
      : undefined;
  const materialId = slot === "weapon" ? undefined : normalizeGearMaterial(piece.materialId);
  const enhance = Math.max(
    0,
    Math.min(MAX_GEAR_ENHANCE, Math.floor(Number(piece.enhance) || 0)),
  );
  const id = piece.id ?? `gear_${slot}_migrated`;
  let normalized = basePiece({
    id,
    slot,
    nameKo:
      piece.nameKo ??
      (slot === "weapon"
        ? WEAPON_NAMES[element ?? "light"][0]!
        : DROP_NAMES[slot][0]!),
    enhance: 0,
    setId,
    stars,
    quality,
    element,
    materialId,
    rollSeed: normalizeGearRollSeed(piece.rollSeed, id),
  });
  for (let i = 0; i < enhance; i++) {
    normalized = bumpGearEnhance(normalized);
  }
  return normalized;
}

type LegacySummonerGear = Partial<SummonerGear> & {
  robe?: GearPiece;
  accessory?: GearPiece;
  orb?: GearPiece;
  cloak?: GearPiece;
  armor?: GearPiece;
  helm?: GearPiece;
};

/** Keep equipped pieces; do not invent a default loadout. */
export function normalizeSummonerGear(
  gear: LegacySummonerGear | null | undefined,
  element: Element = "light",
): SummonerGear {
  if (!gear) return createEmptyGear();
  const slotOf = (
    src: GearPiece | undefined,
    slot: GearSlot,
    weaponElement?: Element,
  ): GearPiece | null => {
    if (!src) return null;
    const piece =
      slot === "weapon"
        ? normalizeGearPiece(
            { ...src, element: src.element ?? weaponElement ?? element },
            "weapon",
          )
        : normalizeGearPiece(src, slot);
    return slot === "weapon"
      ? { ...piece, element: piece.element ?? weaponElement ?? element }
      : piece;
  };
  return {
    weapon: slotOf(gear.weapon, "weapon", element),
    top: slotOf(gear.top ?? gear.robe ?? gear.armor, "top"),
    bottom: slotOf(gear.bottom ?? gear.cloak, "bottom"),
    shoes: slotOf(gear.shoes ?? gear.accessory, "shoes"),
    ring: slotOf(gear.ring, "ring"),
    necklace: slotOf(gear.necklace ?? gear.orb ?? gear.helm, "necklace"),
  };
}

export function gearPieces(gear: SummonerGear): GearPiece[] {
  const g = normalizeSummonerGear(gear);
  return [g.weapon, g.top, g.bottom, g.shoes, g.ring, g.necklace].filter(
    (p): p is GearPiece => p != null,
  );
}

/** Drop unenhanced default loadout pieces from older saves. */
export function stripUnenhancedStarterGear(gear: SummonerGear): SummonerGear {
  const g = normalizeSummonerGear(gear);
  return {
    weapon: isDefaultStarterGear(g.weapon) ? null : g.weapon,
    top: isDefaultStarterGear(g.top) ? null : g.top,
    bottom: isDefaultStarterGear(g.bottom) ? null : g.bottom,
    shoes: isDefaultStarterGear(g.shoes) ? null : g.shoes,
    ring: isDefaultStarterGear(g.ring) ? null : g.ring,
    necklace: isDefaultStarterGear(g.necklace) ? null : g.necklace,
  };
}

export function summarizeGearSets(gear: SummonerGear): GearSetProgress[] {
  const counts: Partial<Record<GearSetId, number>> = {};
  for (const p of gearPieces(gear)) {
    counts[p.setId] = (counts[p.setId] ?? 0) + 1;
  }
  return GEAR_SETS.map((def) => {
    const count = counts[def.id] ?? 0;
    return {
      setId: def.id,
      nameKo: def.nameKo,
      count,
      active2: count >= 2,
      active4: count >= 4,
      active6: count >= 6,
    };
  });
}

/** Aggregate 2/4/6pc set bonuses for equipped gear. */
export function gearSetBonuses(gear: SummonerGear): GearSetBonus {
  const out = emptyBonus();
  for (const prog of summarizeGearSets(gear)) {
    if (!prog.active2) continue;
    const def = getGearSet(prog.setId)!;
    mergeBonus(out, def.bonus2);
    if (prog.active4) mergeBonus(out, def.bonus4);
    if (prog.active6) mergeBonus(out, def.bonus6);
  }
  return out;
}

export function emptyGearAffixTotals(): GearAffixTotals {
  return {
    battleGoldMul: 1,
    expMul: 1,
    symbolChanceMul: 1,
    gearChanceMul: 1,
    scrollChanceMul: 1,
    crystalChanceMul: 1,
    startManaPctAdd: 0,
    manaRegenMul: 1,
    boardSenseMul: 1,
    allyAtkAdd: 0,
    summonerHpMul: 1,
    bossAtkAdd: 0,
  };
}

/**
 * Special abilities on equipped pieces; the same id fires once at its best roll.
 * Reads the pieces as stored (saves are normalized on load), so this stays cheap
 * enough to call per battle and per reward payout.
 */
export function gearActiveAffixes(gear: SummonerGear): GearAffixRoll[] {
  const best = new Map<GearAffixId, number>();
  const slots = [
    gear.weapon,
    gear.top,
    gear.bottom,
    gear.shoes,
    gear.ring,
    gear.necklace,
  ];
  for (const piece of slots) {
    if (!piece) continue;
    for (const roll of piece.affixes ?? []) {
      if (!isGearAffixId(roll?.id)) continue;
      const value = Number(roll.value);
      if (!Number.isFinite(value) || value <= 0) continue;
      if (value > (best.get(roll.id) ?? 0)) best.set(roll.id, value);
    }
  }
  return [...best.entries()].map(([id, value]) => ({ id, value }));
}

/** Aggregate active special abilities into one effect bundle. */
export function gearAffixTotals(gear: SummonerGear): GearAffixTotals {
  const out = emptyGearAffixTotals();
  for (const roll of gearActiveAffixes(gear)) {
    const def = getGearAffix(roll.id);
    if (!def) continue;
    switch (def.effect) {
      case "battleGold":
        out.battleGoldMul += roll.value;
        break;
      case "exp":
        out.expMul += roll.value;
        break;
      case "symbolChance":
        out.symbolChanceMul += roll.value;
        break;
      case "gearChance":
        out.gearChanceMul += roll.value;
        break;
      case "scrollChance":
        out.scrollChanceMul += roll.value;
        break;
      case "crystalChance":
        out.crystalChanceMul += roll.value;
        break;
      case "startMana":
        out.startManaPctAdd += roll.value;
        break;
      case "manaRegen":
        out.manaRegenMul += roll.value;
        break;
      case "boardSense":
        out.boardSenseMul += roll.value;
        break;
      case "allyAtk":
        out.allyAtkAdd += roll.value;
        break;
      case "summonerHp":
        out.summonerHpMul += roll.value;
        break;
      case "bossAtk":
        out.bossAtkAdd += roll.value;
        break;
    }
  }
  return out;
}

/** Sum leader ATK% from pieces + active set bonuses. */
export function gearLeaderAtkPct(gear: SummonerGear): number {
  const g = normalizeSummonerGear(gear);
  const pieces = gearPieces(g).reduce(
    (n, p) => n + (p.leaderAtkBonus ?? 0),
    0,
  );
  return pieces + gearSetBonuses(g).leaderAtkBonus;
}

/** Mana cost to go from `enhance` → `enhance+1` (steeper past +8). */
export function gearEnhanceManaCost(enhance: number): number {
  const base = 250 + enhance * 150;
  const late = Math.max(0, enhance - 8) * 100;
  return base + late;
}

/** Crystal cost from +12 onward (0 below): 2 / 4 / 6. */
export function gearEnhanceCrystalCost(enhance: number): number {
  if (enhance < 12) return 0;
  return 2 + (enhance - 12) * 2;
}

/** Mana cost to re-affix a piece to another gear set. */
export const GEAR_SET_AFFIX_MANA = 450;

/**
 * Per-step stat multiplier when going from `enhance` → `enhance+1`.
 * Ramps past +9 (same band as mana/crystal enhance costs).
 */
export function gearEnhanceStepMul(enhance: number): number {
  const e = Math.max(0, Math.min(MAX_GEAR_ENHANCE - 1, Math.floor(enhance) || 0));
  if (e < 6) return 1 + e * 0.055;
  if (e < 10) return 1.38 + (e - 6) * 0.12;
  if (e < 12) return 1.92 + (e - 10) * 0.28;
  return 2.56 + (e - 12) * 0.42;
}

function addEnhanceInt(current: number, delta: number, mul: number): number {
  return Math.round(current + delta * mul);
}

function addEnhanceFrac(current: number, delta: number, mul: number): number {
  return Number((current + delta * mul).toFixed(4));
}

/** Apply +1 enhance bonuses in place (returns new piece). */
export function bumpGearEnhance(piece: GearPiece): GearPiece {
  const next = piece.enhance + 1;
  const mul = gearEnhanceStepMul(piece.enhance);
  if (piece.slot === "weapon") {
    return {
      ...piece,
      enhance: next,
      skillPowerBonus: addEnhanceFrac(piece.skillPowerBonus, 0.03, mul),
      manaRegenBonus: addEnhanceFrac(piece.manaRegenBonus, 0.005, mul),
    };
  }
  if (piece.slot === "top") {
    return {
      ...piece,
      enhance: next,
      summonerHpBonus: addEnhanceInt(piece.summonerHpBonus, 25, mul),
      summonerDefBonus: addEnhanceInt(piece.summonerDefBonus, 3, mul),
      manaMaxBonus: addEnhanceInt(piece.manaMaxBonus, 2, mul),
    };
  }
  if (piece.slot === "bottom") {
    return {
      ...piece,
      enhance: next,
      summonerHpBonus: addEnhanceInt(piece.summonerHpBonus, 15, mul),
      summonerDefBonus: addEnhanceInt(piece.summonerDefBonus, 2, mul),
      leaderAtkBonus: addEnhanceFrac(piece.leaderAtkBonus, 0.004, mul),
    };
  }
  if (piece.slot === "shoes") {
    return {
      ...piece,
      enhance: next,
      manaRegenBonus: addEnhanceFrac(piece.manaRegenBonus, 0.04, mul),
      manaMaxBonus: addEnhanceInt(piece.manaMaxBonus, 5, mul),
      startManaPct: addEnhanceFrac(piece.startManaPct, 0.01, mul),
    };
  }
  if (piece.slot === "ring") {
    return {
      ...piece,
      enhance: next,
      skillPowerBonus: addEnhanceFrac(piece.skillPowerBonus, 0.01, mul),
      leaderAtkBonus: addEnhanceFrac(piece.leaderAtkBonus, 0.005, mul),
      manaRegenBonus: addEnhanceFrac(piece.manaRegenBonus, 0.01, mul),
    };
  }
  return {
    ...piece,
    enhance: next,
    boardSenseBonus: addEnhanceFrac(piece.boardSenseBonus, 0.025, mul),
    skillPowerBonus: addEnhanceFrac(piece.skillPowerBonus, 0.005, mul),
    manaRegenBonus: addEnhanceFrac(piece.manaRegenBonus, 0.01, mul),
  };
}

export function describeGear(piece: GearPiece): string {
  const set = getGearSet(piece.setId)?.nameKo ?? piece.setId;
  return `${gearDisplayNameKo(piece)} +${piece.enhance} [${set}]`;
}

/** True if a weapon can be worn by the given summoner element. */
export function canEquipGearOnElement(
  piece: GearPiece,
  element: Element,
): boolean {
  if (piece.slot !== "weapon") return true;
  return (piece.element ?? "light") === element;
}

/** Mana refund when selling a bag piece (scales harder past +9). */
export function gearSellMana(piece: GearPiece): number {
  const base = 100 + piece.enhance * 85;
  const late = piece.enhance >= 9 ? (piece.enhance - 8) * 120 : 0;
  const leader = Math.round((piece.leaderAtkBonus ?? 0) * 500);
  const grade = piece.stars * 8 + (piece.quality === "legend" ? 40 : 0);
  const affix = (piece.affixes ?? []).length * 120;
  return base + late + leader + grade + affix;
}

/** Partial crystal refund for +12+ enhance investment (~50%). */
export function gearSellCrystal(piece: GearPiece): number {
  let spent = 0;
  for (let e = 12; e < piece.enhance; e++) {
    spent += gearEnhanceCrystalCost(e);
  }
  return Math.floor(spent / 2);
}

export interface GearCodexEntry {
  key: string;
  piece: GearPiece;
}

/** Stable codex species key — slot/element/material + ★ (ignores set/quality/enhance). */
export function gearCodexKey(
  piece: Pick<GearPiece, "slot" | "stars" | "element" | "materialId">,
): string {
  const stars = normalizeGearStars(piece.stars);
  if (piece.slot === "weapon") {
    const el = piece.element ?? "light";
    return `weapon:${el}:${stars}`;
  }
  const mat = normalizeGearMaterial(piece.materialId);
  return `${piece.slot}:${mat}:${stars}`;
}

export function buildGearCodexPiece(params: {
  slot: GearSlot;
  stars: GearStars;
  element?: Element;
  materialId?: GearMaterialId;
}): GearPiece {
  const { slot, stars } = params;
  const element = slot === "weapon" ? params.element ?? "light" : undefined;
  const materialId =
    slot === "weapon" ? undefined : normalizeGearMaterial(params.materialId);
  const nameKo = gearNameKoForSlot(slot, stars, element);
  return fixedPiece({
    id: `codex_${gearCodexKey({ slot, stars, element, materialId })}`,
    slot,
    nameKo,
    enhance: 0,
    setId: DEFAULT_SET_BY_SLOT[slot],
    stars,
    quality: gearStarsToQuality(stars),
    element,
    materialId,
  });
}

function buildGearCodexEntries(): GearCodexEntry[] {
  const out: GearCodexEntry[] = [];
  for (const el of ELEMENTS) {
    for (let s = 1; s <= 5; s++) {
      const stars = s as GearStars;
      const piece = buildGearCodexPiece({ slot: "weapon", stars, element: el });
      out.push({ key: gearCodexKey(piece), piece });
    }
  }
  const armorSlots: Exclude<GearSlot, "weapon">[] = [
    "top",
    "bottom",
    "shoes",
    "ring",
    "necklace",
  ];
  for (const slot of armorSlots) {
    for (const mat of GEAR_MATERIALS) {
      for (let s = 1; s <= 5; s++) {
        const stars = s as GearStars;
        const piece = buildGearCodexPiece({ slot, stars, materialId: mat.id });
        out.push({ key: gearCodexKey(piece), piece });
      }
    }
  }
  return out;
}

export const GEAR_CODEX_ENTRIES: GearCodexEntry[] = buildGearCodexEntries();

export function gearCodexEntryByKey(key: string): GearCodexEntry | undefined {
  return GEAR_CODEX_ENTRIES.find((entry) => entry.key === key);
}

/** Starting unequipped gear bag size. */
export const GEAR_BAG_BASE_SLOTS = 20;
/** Slots added per expand purchase. */
export const GEAR_BAG_EXPAND_STEP = 10;
/** Hard cap after repeated expands. */
export const GEAR_BAG_MAX_SLOTS = 100;
/** @deprecated Use GEAR_BAG_BASE_SLOTS; kept as the default bag size. */
export const MAX_GEAR_BAG = GEAR_BAG_BASE_SLOTS;

const STAR_WEIGHTS: { value: GearStars; w: number }[] = [
  { value: 1, w: 40 },
  { value: 2, w: 30 },
  { value: 3, w: 20 },
  { value: 4, w: 8 },
  { value: 5, w: 2 },
];

const QUALITY_WEIGHTS: { value: GearQuality; w: number }[] = [
  { value: "normal", w: 45 },
  { value: "advanced", w: 30 },
  { value: "rare", w: 15 },
  { value: "epic", w: 8 },
  { value: "legend", w: 2 },
];

function pickWeighted<T>(
  weights: { value: T; w: number }[],
  rng: () => number,
): T {
  const total = weights.reduce((n, x) => n + x.w, 0);
  let roll = rng() * total;
  for (const row of weights) {
    roll -= row.w;
    if (roll <= 0) return row.value;
  }
  return weights[weights.length - 1]!.value;
}

export type RollGearDropOpts = {
  preferredSlot?: GearSlot;
  preferredElement?: Element;
  starWeights?: { value: GearStars; w: number }[];
  qualityWeights?: { value: GearQuality; w: number }[];
  /** Floor the rolled ★ — deep vault floors guarantee a grade. */
  minStars?: GearStars;
};

/** Roll a wearable piece (random slot/set/stars/quality; weapons get element). */
export function rollGearDrop(
  rng: () => number = Math.random,
  idPrefix = "gear_drop",
  preferredSlotOrOpts?: GearSlot | RollGearDropOpts,
): GearPiece {
  const opts: RollGearDropOpts =
    typeof preferredSlotOrOpts === "string"
      ? { preferredSlot: preferredSlotOrOpts }
      : preferredSlotOrOpts ?? {};
  const slot =
    opts.preferredSlot ??
    GEAR_SLOTS[Math.floor(rng() * GEAR_SLOTS.length) % GEAR_SLOTS.length]!;
  const setId =
    GEAR_SETS[Math.floor(rng() * GEAR_SETS.length) % GEAR_SETS.length]!.id;
  const rolledStars = pickWeighted(opts.starWeights ?? STAR_WEIGHTS, rng);
  const stars = normalizeGearStars(
    Math.max(rolledStars, opts.minStars ? normalizeGearStars(opts.minStars) : 1),
  );
  const quality = gearStarsToQuality(stars);
  const materialId =
    slot === "weapon" ? undefined : pickWeighted(MATERIAL_WEIGHTS, rng);
  const element =
    slot === "weapon"
      ? opts.preferredElement && ELEMENTS.includes(opts.preferredElement)
        ? opts.preferredElement
        : ELEMENTS[Math.floor(rng() * ELEMENTS.length) % ELEMENTS.length]!
      : undefined;
  const nameKo = gearNameKoForSlot(slot, stars, element);
  // The seed falls out of the id hash — the id already carries a random draw,
  // so this does not consume another one from `rng`.
  let piece = basePiece({
    id: `${idPrefix}_${slot}_${Math.floor(rng() * 1e6)}`,
    slot,
    nameKo,
    enhance: 0,
    setId,
    stars,
    quality,
    materialId,
    element,
  });
  const bumps = Math.floor(rng() * 3); // +0..+2
  for (let i = 0; i < bumps; i++) {
    piece = bumpGearEnhance(piece);
  }
  return piece;
}

/** Public art stem without extension, e.g. `weapon-fire-s3` or `top-cloth-s5`. */
export function gearArtStem(piece: GearPiece): string {
  const stars = normalizeGearStars(piece.stars);
  if (piece.slot === "weapon") {
    const el = piece.element ?? "light";
    return `weapon-${el}-s${stars}`;
  }
  const mat = normalizeGearMaterial(piece.materialId);
  return `${piece.slot}-${mat}-s${stars}`;
}

export function gearArtFilename(piece: GearPiece, ext = "webp"): string {
  return `${gearArtStem(piece)}.${ext}`;
}

/** Primary WebP path + ordered fallbacks for `<img onerror>`. */
export function gearArtSrcPaths(
  piece: GearPiece,
  activeElement: Element = "light",
): { primary: string; fallbacks: string[] } {
  const primary = `/art/ui/gear/${gearArtFilename(piece)}`;
  const fallbacks: string[] = [];
  if (piece.slot === "weapon") {
    const el = piece.element ?? activeElement;
    fallbacks.push(`/art/ui/gear/weapon-${el}.webp`);
    fallbacks.push(`/art/ui/gear/weapon-${el}.svg`);
    fallbacks.push(`/art/ui/gear/${piece.slot}-${piece.setId}.webp`);
  } else {
    const mat = normalizeGearMaterial(piece.materialId);
    fallbacks.push(`/art/ui/gear/${piece.slot}-${mat}.webp`);
    fallbacks.push(`/art/ui/gear/${piece.slot}-${piece.setId}.webp`);
  }
  fallbacks.push(`/art/ui/gear/${piece.slot}.webp`);
  fallbacks.push(`/art/ui/gear/${piece.slot}.svg`);
  return { primary, fallbacks };
}
