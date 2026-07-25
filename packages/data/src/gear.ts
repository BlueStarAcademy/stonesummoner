/** Phase 1 summoner gear — 장신구(마나 회로) · 마법구(국면 감응) */

export type GearSlot = "accessory" | "orb";

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
}

export interface SummonerGear {
  accessory: GearPiece;
  orb: GearPiece;
}

export const MAX_GEAR_ENHANCE = 9;

export function createStarterGear(): SummonerGear {
  return {
    accessory: {
      id: "acc_mana_circuit",
      slot: "accessory",
      nameKo: "진액 회로",
      enhance: 0,
      manaRegenBonus: 0.12,
      manaMaxBonus: 10,
      boardSenseBonus: 0,
      startManaPct: 0.05,
    },
    orb: {
      id: "orb_board_sense",
      slot: "orb",
      nameKo: "감응 수정",
      enhance: 0,
      manaRegenBonus: 0,
      manaMaxBonus: 0,
      boardSenseBonus: 0.08,
      startManaPct: 0,
    },
  };
}

export function gearEnhanceManaCost(enhance: number): number {
  return 100 + enhance * 60;
}

/** Apply +1 enhance bonuses in place (returns new piece). */
export function bumpGearEnhance(piece: GearPiece): GearPiece {
  const next = piece.enhance + 1;
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
