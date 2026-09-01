/** Phase 2 combat skill effects (SW-style kits). */
export type StatModAxis = "atk" | "def" | "spd" | "critRate" | "critDmg" | "accuracy";

export type CcKind = "stun" | "freeze" | "sleep";

export type DamageScalingSource = "atk" | "maxHp" | "def" | "spd" | "targetMaxHp";
export type EnemyTarget = "single" | "all_enemies";
export type AllyTarget = "self" | "ally_lowest" | "all_allies";

export type SkillEffect =
  | {
      kind: "damage";
      target: EnemyTarget;
      coeff: number;
      /** Defaults to ATK for backwards compatibility. */
      source?: DamageScalingSource;
      /** Normalizes non-ATK source values while preserving the base skill budget. */
      sourceFactor?: number;
      /** Fraction of DEF ignored, from 0 (none) to 1 (all). */
      ignoreDef?: number;
    }
  | { kind: "heal"; target: AllyTarget; coeff: number }
  | { kind: "hot"; target: AllyTarget; coeff: number; turns: number }
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
      target: EnemyTarget;
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
  | { kind: "heal_block"; target: EnemyTarget; turns: number; chance?: number }
  | { kind: "silence"; target: EnemyTarget; turns: number; chance?: number }
  | {
      kind: "atb";
      target: AllyTarget | EnemyTarget;
      /** Positive fills and negative drains the 0–100 attack bar. */
      amount: number;
    }
  | {
      kind: "revive";
      target: "ally_lowest";
      /** Fraction of max HP restored on revival. */
      hpFraction: number;
    }
  | {
      kind: "cooldown";
      target: AllyTarget | EnemyTarget;
      direction: "decrease" | "increase";
      amount: number;
    }
  | {
      kind: "damage_share";
      target: "self" | "ally_lowest" | "all_allies";
      fraction: number;
      turns: number;
    }
  | {
      kind: "reflect";
      target: "self" | "all_allies";
      fraction: number;
      turns: number;
    }
  | { kind: "provoke"; target: "single"; turns: number; chance?: number };

export interface SkillDef {
  id: string;
  nameKo: string;
  /** Flavor description (no numeric combat stats). */
  descKo?: string;
  /** Stable art/VFX identity. */
  vfxId?: string;
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
