import type { Element } from "./types.js";
import type { Point } from "stonesummoner-board";

/** Module E/F battle feature flags. */
export interface BattleModules {
  /** Element affinity border + summoner stone bonus. */
  moduleE?: boolean;
  /** Boss board: victory point, mana seal, stone absorb. */
  moduleF?: boolean;
}

export function pickCircleElement(rng: () => number = Math.random): Element {
  const pool: Element[] = ["fire", "water", "wind", "light", "dark"];
  return pool[Math.floor(rng() * pool.length) % pool.length]!;
}

/** Center-ish victory point for boss boards. */
export function bossVictoryPoint(size: number): Point {
  const m = Math.floor(size / 2);
  return { x: m, y: m };
}
