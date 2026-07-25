/** Summoner gear — 무기 · 로브 · 장신구 · 마법구 · 망토 · 반지 (+얕은 세트) */

export type GearSlot =
  | "weapon"
  | "robe"
  | "accessory"
  | "orb"
  | "cloak"
  | "ring";

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
  enhance: number;
  setId: GearSetId;
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
  weapon: GearPiece;
  robe: GearPiece;
  accessory: GearPiece;
  orb: GearPiece;
  cloak: GearPiece;
  ring: GearPiece;
}

export const MAX_GEAR_ENHANCE = 15;

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
  robe: "guardian",
  accessory: "mana",
  orb: "sense",
  cloak: "guardian",
  ring: "assault",
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
      >
    >,
): GearPiece {
  return {
    manaRegenBonus: 0,
    manaMaxBonus: 0,
    boardSenseBonus: 0,
    startManaPct: 0,
    skillPowerBonus: 0,
    summonerHpBonus: 0,
    summonerDefBonus: 0,
    leaderAtkBonus: 0,
    ...partial,
  };
}

export function createStarterGear(): SummonerGear {
  return {
    weapon: basePiece({
      id: "wpn_circle_blade",
      slot: "weapon",
      nameKo: "진문검",
      enhance: 0,
      setId: "assault",
      skillPowerBonus: 0.06,
    }),
    robe: basePiece({
      id: "robe_guardian",
      slot: "robe",
      nameKo: "수호 로브",
      enhance: 0,
      setId: "guardian",
      summonerHpBonus: 40,
      summonerDefBonus: 4,
    }),
    accessory: basePiece({
      id: "acc_mana_circuit",
      slot: "accessory",
      nameKo: "진액 회로",
      enhance: 0,
      setId: "mana",
      manaRegenBonus: 0.12,
      manaMaxBonus: 10,
      startManaPct: 0.05,
    }),
    orb: basePiece({
      id: "orb_board_sense",
      slot: "orb",
      nameKo: "감응 수정",
      enhance: 0,
      setId: "sense",
      boardSenseBonus: 0.08,
    }),
    cloak: basePiece({
      id: "cloak_command",
      slot: "cloak",
      nameKo: "지휘 망토",
      enhance: 0,
      setId: "guardian",
      summonerHpBonus: 25,
      summonerDefBonus: 2,
      leaderAtkBonus: 0.008,
    }),
    ring: basePiece({
      id: "ring_bond",
      slot: "ring",
      nameKo: "결속 반지",
      enhance: 0,
      setId: "assault",
      skillPowerBonus: 0.02,
      leaderAtkBonus: 0.01,
    }),
  };
}

/** Ensure optional combat fields exist on a piece (legacy saves). */
export function normalizeGearPiece(
  piece: GearPiece,
  fallbackSlot?: GearSlot,
): GearPiece {
  const slot = piece.slot ?? fallbackSlot ?? "accessory";
  const setId =
    piece.setId && isGearSetId(piece.setId)
      ? piece.setId
      : DEFAULT_SET_BY_SLOT[slot];
  return {
    id: piece.id,
    slot,
    nameKo: piece.nameKo,
    enhance: piece.enhance ?? 0,
    setId,
    manaRegenBonus: piece.manaRegenBonus ?? 0,
    manaMaxBonus: piece.manaMaxBonus ?? 0,
    boardSenseBonus: piece.boardSenseBonus ?? 0,
    startManaPct: piece.startManaPct ?? 0,
    skillPowerBonus: piece.skillPowerBonus ?? 0,
    summonerHpBonus: piece.summonerHpBonus ?? 0,
    summonerDefBonus: piece.summonerDefBonus ?? 0,
    leaderAtkBonus: piece.leaderAtkBonus ?? 0,
  };
}

/** Fill missing slots on legacy 2/4-slot saves. */
export function normalizeSummonerGear(
  gear: Partial<SummonerGear> | null | undefined,
): SummonerGear {
  const starter = createStarterGear();
  if (!gear) return starter;
  return {
    weapon: normalizeGearPiece(gear.weapon ?? starter.weapon, "weapon"),
    robe: normalizeGearPiece(gear.robe ?? starter.robe, "robe"),
    accessory: normalizeGearPiece(
      gear.accessory ?? starter.accessory,
      "accessory",
    ),
    orb: normalizeGearPiece(gear.orb ?? starter.orb, "orb"),
    cloak: normalizeGearPiece(gear.cloak ?? starter.cloak, "cloak"),
    ring: normalizeGearPiece(gear.ring ?? starter.ring, "ring"),
  };
}

export function gearPieces(gear: SummonerGear): GearPiece[] {
  const g = normalizeSummonerGear(gear);
  return [g.weapon, g.robe, g.accessory, g.orb, g.cloak, g.ring];
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
  if (piece.slot === "robe") {
    return {
      ...piece,
      enhance: next,
      summonerHpBonus: piece.summonerHpBonus + 25,
      summonerDefBonus: piece.summonerDefBonus + 3,
      manaMaxBonus: piece.manaMaxBonus + 2,
    };
  }
  if (piece.slot === "accessory") {
    return {
      ...piece,
      enhance: next,
      manaRegenBonus: piece.manaRegenBonus + 0.04,
      manaMaxBonus: piece.manaMaxBonus + 5,
      startManaPct: piece.startManaPct + 0.01,
    };
  }
  if (piece.slot === "cloak") {
    return {
      ...piece,
      enhance: next,
      summonerHpBonus: piece.summonerHpBonus + 15,
      summonerDefBonus: piece.summonerDefBonus + 2,
      leaderAtkBonus: piece.leaderAtkBonus + 0.004,
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
    manaRegenBonus: piece.manaRegenBonus + 0.01,
  };
}

export function describeGear(piece: GearPiece): string {
  const set = getGearSet(piece.setId)?.nameKo ?? piece.setId;
  return `${piece.nameKo} +${piece.enhance} [${set}]`;
}

/** Mana refund when selling a bag piece. */
export function gearSellMana(piece: GearPiece): number {
  return 40 + piece.enhance * 30 + Math.round((piece.leaderAtkBonus ?? 0) * 500);
}

/** Max unequipped gear pieces in the bag. */
export const MAX_GEAR_BAG = 20;

const GEAR_SLOTS: GearSlot[] = [
  "weapon",
  "robe",
  "accessory",
  "orb",
  "cloak",
  "ring",
];

const DROP_NAMES: Record<GearSlot, string[]> = {
  weapon: ["진문검", "돌격 단검", "개방의 칼"],
  robe: ["수호 로브", "비늘 로브", "요새 옷"],
  accessory: ["진액 회로", "마나 반지끈", "충전 팔찌"],
  orb: ["감응 수정", "국면의 눈", "따냄 구슬"],
  cloak: ["지휘 망토", "전장의 망토", "결속 외투"],
  ring: ["결속 반지", "돌격 반지", "진액 반지"],
};

/** Weekly equip dungeon: roll a wearable piece for a random (or fixed) slot. */
export function rollGearDrop(
  rng: () => number = Math.random,
  idPrefix = "gear_drop",
  preferredSlot?: GearSlot,
): GearPiece {
  const slot =
    preferredSlot ??
    GEAR_SLOTS[Math.floor(rng() * GEAR_SLOTS.length) % GEAR_SLOTS.length]!;
  const setId =
    GEAR_SETS[Math.floor(rng() * GEAR_SETS.length) % GEAR_SETS.length]!.id;
  const names = DROP_NAMES[slot];
  const nameKo = names[Math.floor(rng() * names.length) % names.length]!;
  let piece = basePiece({
    id: `${idPrefix}_${slot}_${Math.floor(rng() * 1e6)}`,
    slot,
    nameKo,
    enhance: 0,
    setId,
    skillPowerBonus: slot === "weapon" || slot === "ring" ? 0.05 : 0,
    summonerHpBonus: slot === "robe" || slot === "cloak" ? 35 : 0,
    summonerDefBonus: slot === "robe" || slot === "cloak" ? 3 : 0,
    manaRegenBonus: slot === "accessory" ? 0.1 : 0,
    manaMaxBonus: slot === "accessory" ? 8 : 0,
    startManaPct: slot === "accessory" ? 0.04 : 0,
    boardSenseBonus: slot === "orb" ? 0.07 : 0,
    leaderAtkBonus:
      slot === "cloak" ? 0.008 : slot === "ring" ? 0.01 : 0,
  });
  const bumps = Math.floor(rng() * 3); // +0..+2
  for (let i = 0; i < bumps; i++) {
    piece = bumpGearEnhance(piece);
  }
  return piece;
}
