/** Summoner gear — 무기 · 로브 · 장신구 · 마법구 */

export type GearSlot = "weapon" | "robe" | "accessory" | "orb";

export interface GearPiece {
  id: string;
  slot: GearSlot;
  nameKo: string;
  enhance: number;
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
}

export interface SummonerGear {
  weapon: GearPiece;
  robe: GearPiece;
  accessory: GearPiece;
  orb: GearPiece;
}

export const MAX_GEAR_ENHANCE = 9;

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
      skillPowerBonus: 0.06,
    }),
    robe: basePiece({
      id: "robe_guardian",
      slot: "robe",
      nameKo: "수호 로브",
      enhance: 0,
      summonerHpBonus: 40,
      summonerDefBonus: 4,
    }),
    accessory: basePiece({
      id: "acc_mana_circuit",
      slot: "accessory",
      nameKo: "진액 회로",
      enhance: 0,
      manaRegenBonus: 0.12,
      manaMaxBonus: 10,
      startManaPct: 0.05,
    }),
    orb: basePiece({
      id: "orb_board_sense",
      slot: "orb",
      nameKo: "감응 수정",
      enhance: 0,
      boardSenseBonus: 0.08,
    }),
  };
}

/** Ensure optional combat fields exist on a piece (legacy saves). */
export function normalizeGearPiece(
  piece: GearPiece,
  fallbackSlot?: GearSlot,
): GearPiece {
  const slot = piece.slot ?? fallbackSlot ?? "accessory";
  return {
    id: piece.id,
    slot,
    nameKo: piece.nameKo,
    enhance: piece.enhance ?? 0,
    manaRegenBonus: piece.manaRegenBonus ?? 0,
    manaMaxBonus: piece.manaMaxBonus ?? 0,
    boardSenseBonus: piece.boardSenseBonus ?? 0,
    startManaPct: piece.startManaPct ?? 0,
    skillPowerBonus: piece.skillPowerBonus ?? 0,
    summonerHpBonus: piece.summonerHpBonus ?? 0,
    summonerDefBonus: piece.summonerDefBonus ?? 0,
  };
}

/** Fill missing weapon/robe on legacy 2-slot saves. */
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
  };
}

export function gearEnhanceManaCost(enhance: number): number {
  return 100 + enhance * 60;
}

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
  return {
    ...piece,
    enhance: next,
    boardSenseBonus: piece.boardSenseBonus + 0.025,
    manaRegenBonus: piece.manaRegenBonus + 0.01,
  };
}

export function describeGear(piece: GearPiece): string {
  return `${piece.nameKo} +${piece.enhance}`;
}
