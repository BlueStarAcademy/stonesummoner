import type { Element } from "./types.js";

const ADVANTAGE: Record<Element, Element | null> = {
  fire: "wind",
  water: "fire",
  wind: "water",
  light: "dark",
  dark: "light",
};

export function elementMultiplier(attacker: Element, defender: Element): number {
  if (ADVANTAGE[attacker] === defender) return 1.15;
  if (ADVANTAGE[defender] === attacker) return 0.85;
  return 1;
}

export function defenseMitigation(def: number): number {
  return 1000 / (1000 + Math.max(0, def));
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
}

export function computeDamage(input: DamageInput): DamageResult {
  const rng = input.rng ?? Math.random;
  const crit = rng() < input.critRate / 100;
  const critMul = crit ? 1 + input.critDmg / 100 : 1;
  const base =
    input.skillCoeff *
    input.atk *
    elementMultiplier(input.attackerElement, input.defenderElement) *
    critMul;
  const raw =
    base * input.amplify * defenseMitigation(input.defenderDef) * (0.95 + rng() * 0.1);
  return { damage: Math.max(1, Math.round(raw)), crit };
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
