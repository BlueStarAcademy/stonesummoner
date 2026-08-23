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

export function gearStarMul(stars: GearStars): number {
  return 0.7 + ((stars - 1) / 4) * 0.65;
}

export function gearQualityMul(quality: GearQuality): number {
  switch (quality) {
    case "advanced":
      return 1.08;
    case "rare":
      return 1.16;
    case "epic":
      return 1.28;
    case "legend":
      return 1.4;
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
  fire: ["염화검", "작열창"],
  water: ["해연검", "파도창"],
  wind: ["질풍검", "폭풍창"],
  light: ["성휘검", "광염창"],
  dark: ["심연검", "그림자창"],
};

const DROP_NAMES: Record<Exclude<GearSlot, "weapon">, string[]> = {
  top: ["수호 상의", "비늘 상의", "요새 상의"],
  bottom: ["지휘 하의", "전장 하의", "결속 하의"],
  shoes: ["진액 신발", "질주 신발", "감응 신발"],
  ring: ["결속 반지", "돌격 반지", "진액 반지"],
  necklace: ["감응 목걸이", "국면 목걸이", "따냄 목걸이"],
};

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

function scaleStat(base: number, stars: GearStars, quality: GearQuality): number {
  return base * gearStarMul(stars) * gearQualityMul(quality);
}

function baseBonusesForSlot(
  slot: GearSlot,
  stars: GearStars,
  quality: GearQuality,
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
  const s = (n: number) => scaleStat(n, stars, quality);
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

function basePiece(
  partial: Omit<
    GearPiece,
    | "manaRegenBonus"
    | "manaMaxBonus"
    | "boardSenseBonus"
    | "startManaPct"
    | "skillPowerBonus"
    | "summonerHpBonus"
    | "summonerDefBonus"
    | "leaderAtkBonus"
    | "stars"
    | "quality"
  > &
    Partial<
      Pick<
        GearPiece,
        | "manaRegenBonus"
        | "manaMaxBonus"
        | "boardSenseBonus"
        | "startManaPct"
        | "skillPowerBonus"
        | "summonerHpBonus"
        | "summonerDefBonus"
        | "leaderAtkBonus"
        | "stars"
        | "quality"
        | "element"
      >
    >,
): GearPiece {
  const stars = normalizeGearStars(partial.stars ?? 1);
  const quality = normalizeGearQuality(partial.quality ?? "normal");
  const scaled = baseBonusesForSlot(partial.slot, stars, quality);
  return {
    ...scaled,
    ...partial,
    stars,
    quality,
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
      stars: 1,
      quality: "normal",
    }),
    bottom: basePiece({
      id: "bottom_command",
      slot: "bottom",
      nameKo: "지휘 하의",
      enhance: 0,
      setId: "guardian",
      stars: 1,
      quality: "normal",
    }),
    shoes: basePiece({
      id: "shoes_mana",
      slot: "shoes",
      nameKo: "진액 신발",
      enhance: 0,
      setId: "mana",
      stars: 1,
      quality: "normal",
    }),
    ring: basePiece({
      id: "ring_bond",
      slot: "ring",
      nameKo: "결속 반지",
      enhance: 0,
      setId: "assault",
      stars: 1,
      quality: "normal",
    }),
    necklace: basePiece({
      id: "necklace_sense",
      slot: "necklace",
      nameKo: "감응 목걸이",
      enhance: 0,
      setId: "sense",
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
  const quality = normalizeGearQuality(piece.quality);
  const element =
    slot === "weapon"
      ? ELEMENTS.includes(piece.element as Element)
        ? (piece.element as Element)
        : "light"
      : undefined;
  const scaled = baseBonusesForSlot(slot, stars, quality);
  return {
    id: piece.id ?? `gear_${slot}_migrated`,
    slot,
    nameKo:
      piece.nameKo ??
      (slot === "weapon"
        ? WEAPON_NAMES[element ?? "light"][0]!
        : DROP_NAMES[slot][0]!),
    stars,
    quality,
    enhance: piece.enhance ?? 0,
    setId,
    element,
    manaRegenBonus: piece.manaRegenBonus ?? scaled.manaRegenBonus,
    manaMaxBonus: piece.manaMaxBonus ?? scaled.manaMaxBonus,
    boardSenseBonus: piece.boardSenseBonus ?? scaled.boardSenseBonus,
    startManaPct: piece.startManaPct ?? scaled.startManaPct,
    skillPowerBonus: piece.skillPowerBonus ?? scaled.skillPowerBonus,
    summonerHpBonus: piece.summonerHpBonus ?? scaled.summonerHpBonus,
    summonerDefBonus: piece.summonerDefBonus ?? scaled.summonerDefBonus,
    leaderAtkBonus: piece.leaderAtkBonus ?? scaled.leaderAtkBonus,
  };
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

/** Sum leader ATK% from pieces + active set bonuses. */
export function gearLeaderAtkPct(gear: SummonerGear): number {
  const g = normalizeSummonerGear(gear);
  const pieces = gearPieces(g).reduce(
    (n, p) => n + (p.leaderAtkBonus ?? 0),
    0,
  );
  return pieces + gearSetBonuses(g).leaderAtkBonus;
}

/** Mana cost to go from `enhance` → `enhance+1` (steeper past +9). */
export function gearEnhanceManaCost(enhance: number): number {
  const base = 100 + enhance * 60;
  const late = Math.max(0, enhance - 8) * 40;
  return base + late;
}

/** Crystal cost from +12 onward (0 below). */
export function gearEnhanceCrystalCost(enhance: number): number {
  if (enhance < 12) return 0;
  return 1 + (enhance - 12);
}

/** Mana cost to re-affix a piece to another gear set. */
export const GEAR_SET_AFFIX_MANA = 180;

/** Apply +1 enhance bonuses in place (returns new piece). */
export function bumpGearEnhance(piece: GearPiece): GearPiece {
  const next = piece.enhance + 1;
  if (piece.slot === "weapon") {
    return {
      ...piece,
      enhance: next,
      skillPowerBonus: piece.skillPowerBonus + 0.03,
      manaRegenBonus: piece.manaRegenBonus + 0.005,
    };
  }
  if (piece.slot === "top") {
    return {
      ...piece,
      enhance: next,
      summonerHpBonus: piece.summonerHpBonus + 25,
      summonerDefBonus: piece.summonerDefBonus + 3,
      manaMaxBonus: piece.manaMaxBonus + 2,
    };
  }
  if (piece.slot === "bottom") {
    return {
      ...piece,
      enhance: next,
      summonerHpBonus: piece.summonerHpBonus + 15,
      summonerDefBonus: piece.summonerDefBonus + 2,
      leaderAtkBonus: piece.leaderAtkBonus + 0.004,
    };
  }
  if (piece.slot === "shoes") {
    return {
      ...piece,
      enhance: next,
      manaRegenBonus: piece.manaRegenBonus + 0.04,
      manaMaxBonus: piece.manaMaxBonus + 5,
      startManaPct: piece.startManaPct + 0.01,
    };
  }
  if (piece.slot === "ring") {
    return {
      ...piece,
      enhance: next,
      skillPowerBonus: piece.skillPowerBonus + 0.01,
      leaderAtkBonus: piece.leaderAtkBonus + 0.005,
      manaRegenBonus: piece.manaRegenBonus + 0.01,
    };
  }
  return {
    ...piece,
    enhance: next,
    boardSenseBonus: piece.boardSenseBonus + 0.025,
    skillPowerBonus: piece.skillPowerBonus + 0.005,
    manaRegenBonus: piece.manaRegenBonus + 0.01,
  };
}

export function describeGear(piece: GearPiece): string {
  const set = getGearSet(piece.setId)?.nameKo ?? piece.setId;
  const star = `★${piece.stars}`;
  return `${piece.nameKo} ${star} +${piece.enhance} [${set}]`;
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
  const base = 40 + piece.enhance * 35;
  const late = piece.enhance >= 9 ? (piece.enhance - 8) * 50 : 0;
  const leader = Math.round((piece.leaderAtkBonus ?? 0) * 500);
  const grade = piece.stars * 8 + (piece.quality === "legend" ? 40 : 0);
  return base + late + leader + grade;
}

/** Partial crystal refund for +12+ enhance investment (~50%). */
export function gearSellCrystal(piece: GearPiece): number {
  let spent = 0;
  for (let e = 12; e < piece.enhance; e++) {
    spent += gearEnhanceCrystalCost(e);
  }
  return Math.floor(spent / 2);
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
  const stars = pickWeighted(opts.starWeights ?? STAR_WEIGHTS, rng);
  const quality = pickWeighted(opts.qualityWeights ?? QUALITY_WEIGHTS, rng);
  const element =
    slot === "weapon"
      ? opts.preferredElement && ELEMENTS.includes(opts.preferredElement)
        ? opts.preferredElement
        : ELEMENTS[Math.floor(rng() * ELEMENTS.length) % ELEMENTS.length]!
      : undefined;
  const nameKo =
    slot === "weapon"
      ? WEAPON_NAMES[element!][
          Math.floor(rng() * WEAPON_NAMES[element!].length) %
            WEAPON_NAMES[element!].length
        ]!
      : DROP_NAMES[slot][
          Math.floor(rng() * DROP_NAMES[slot].length) % DROP_NAMES[slot].length
        ]!;
  let piece = basePiece({
    id: `${idPrefix}_${slot}_${Math.floor(rng() * 1e6)}`,
    slot,
    nameKo,
    enhance: 0,
    setId,
    stars,
    quality,
    element,
  });
  const bumps = Math.floor(rng() * 3); // +0..+2
  for (let i = 0; i < bumps; i++) {
    piece = bumpGearEnhance(piece);
  }
  return piece;
}
