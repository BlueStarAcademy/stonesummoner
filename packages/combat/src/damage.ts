import type { Element } from "./types.js";

/**
 * Summoners War–style affinity:
 * fire → wind → water → fire; light ⇄ dark.
 * Value = the element this attacker is strong against.
 */
const ADVANTAGE: Record<Element, Element> = {
  fire: "wind",
  water: "fire",
  wind: "water",
  light: "dark",
  dark: "light",
};

export type ElementRelation = "advantage" | "disadvantage" | "neutral";

/** Relation of `attacker` toward `defender` (SW triangle + light/dark). */
export function elementRelation(
  attacker: Element,
  defender: Element,
): ElementRelation {
  if (ADVANTAGE[attacker] === defender) return "advantage";
  if (ADVANTAGE[defender] === attacker) return "disadvantage";
  return "neutral";
}

export function elementMultiplier(attacker: Element, defender: Element): number {
  const rel = elementRelation(attacker, defender);
  if (rel === "advantage") return 1.15;
  if (rel === "disadvantage") return 0.85;
  return 1;
}

/** Extra crit rate (percentage points) on elemental advantage — SW rule. */
export const ELEMENT_ADVANTAGE_CRIT_BONUS = 15;

/** Summoners War defense reduction. */
export function defenseMitigation(def: number): number {
  return 1000 / (1140 + 3.5 * Math.max(0, def));
}

export interface DamageInput {
  atk: number;
  skillCoeff: number;
  attackerElement: Element;
  defenderElement: Element;
  defenderDef: number;
  amplify: number;
  critRate: number;
  critDmg: number;
  rng?: () => number;
}

export interface DamageResult {
  damage: number;
  crit: boolean;
  elementRelation: ElementRelation;
}

export function computeDamage(input: DamageInput): DamageResult {
  const rng = input.rng ?? Math.random;
  const rel = elementRelation(input.attackerElement, input.defenderElement);
  const critRate =
    input.critRate + (rel === "advantage" ? ELEMENT_ADVANTAGE_CRIT_BONUS : 0);
  const crit = rng() < critRate / 100;
  const critMul = crit ? 1 + input.critDmg / 100 : 1;
  const base =
    input.skillCoeff *
    input.atk *
    elementMultiplier(input.attackerElement, input.defenderElement) *
    critMul;
  const raw =
    base *
    input.amplify *
    defenseMitigation(input.defenderDef) *
    (0.95 + rng() * 0.1);
  return {
    damage: Math.max(1, Math.round(raw)),
    crit,
    elementRelation: rel,
  };
}

/** Clamp amplify with phase cap and optional power-gap cap. */
export function clampAmplify(
  value: number,
  phaseCap: number,
  powerGapCap = 1.25,
): number {
  const cap = Math.min(phaseCap, powerGapCap);
  return Math.min(cap, Math.max(0.85, value));
}
