/** Phase 1 combat skill effects. */
export type SkillEffect =
  | { kind: "damage"; target: "single" | "all_enemies"; coeff: number }
  | { kind: "heal"; target: "self" | "ally_lowest"; coeff: number }
  | { kind: "shield"; target: "self"; coeff: number }
  | { kind: "mana"; amount: number };

export interface SkillDef {
  id: string;
  nameKo: string;
  /** Turns of cooldown after use. S1 is usually 0. */
  cooldown: number;
  effects: SkillEffect[];
}

export function basicStrike(
  nameKo: string,
  coeff: number,
  id = "s1",
): SkillDef {
  return {
    id,
    nameKo,
    cooldown: 0,
    effects: [{ kind: "damage", target: "single", coeff }],
  };
}
