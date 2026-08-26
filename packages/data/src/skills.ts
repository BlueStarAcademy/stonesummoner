/** Phase 2 combat skill effects (SW-style kits). */
export type StatModAxis = "atk" | "def" | "spd" | "critRate" | "critDmg" | "accuracy";

export type CcKind = "stun" | "freeze" | "sleep";

export type SkillEffect =
  | { kind: "damage"; target: "single" | "all_enemies"; coeff: number }
  | { kind: "heal"; target: "self" | "ally_lowest" | "all_allies"; coeff: number }
  | { kind: "shield"; target: "self" | "all_allies"; coeff: number }
  | { kind: "mana"; amount: number }
  | {
      kind: "buff";
      target: "self" | "all_allies";
      axis: StatModAxis;
      /** Additive fraction, e.g. 0.2 = +20%. */
      amount: number;
      turns: number;
    }
  | {
      kind: "debuff";
      target: "single" | "all_enemies";
      axis: StatModAxis;
      /** Reduction fraction, e.g. 0.2 = -20%. */
      amount: number;
      turns: number;
    }
  | {
      kind: "dot";
      target: "single" | "all_enemies";
      /** Fraction of caster ATK per tick. */
      coeff: number;
      turns: number;
    }
  | {
      kind: "cc";
      target: "single" | "all_enemies";
      cc: CcKind;
      turns: number;
      /** 0..1 apply chance before ACC/RES (stub). */
      chance?: number;
    }
  | { kind: "strip"; target: "single" | "all_enemies"; count?: number }
  | { kind: "cleanse"; target: "self" | "all_allies"; count?: number }
  | { kind: "provoke"; target: "single"; turns: number };

export interface SkillDef {
  id: string;
  nameKo: string;
  /** Flavor description (no numeric combat stats). */
  descKo?: string;
  /** Battle VFX routing override. */
  vfxFamily?: "melee" | "bolt" | "nova" | "support";
  /** Projectile travels as a glowing orb (capture / trap skills). */
  orbBolt?: boolean;
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
    descKo: "적 1명에게 피해를 입힙니다.",
    cooldown: 0,
    effects: [{ kind: "damage", target: "single", coeff }],
  };
}

export function dmg(
  nameKo: string,
  cooldown: number,
  coeff: number,
  target: "single" | "all_enemies" = "single",
  id = "s2",
): SkillDef {
  return {
    id,
    nameKo,
    descKo:
      target === "all_enemies"
        ? "모든 적에게 피해를 입힙니다."
        : "적 1명에게 피해를 입힙니다.",
    cooldown,
    effects: [{ kind: "damage", target, coeff }],
  };
}
