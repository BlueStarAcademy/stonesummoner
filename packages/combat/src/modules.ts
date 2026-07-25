import type { Element } from "./types.js";
import type { Point } from "stonesummoner-board";
import type { StageDef } from "stonesummoner-data";

/** Magic-circle module flags (Module H content wiring). */
export interface BattleModules {
  /** Shape bonuses (corners, stars). */
  moduleB?: boolean;
  /** Circle events (meteor, fog, …). */
  moduleC?: boolean;
  /** Capture shop after large captures. */
  moduleD?: boolean;
  /** Element affinity + summoner stone + dual layer. */
  moduleE?: boolean;
  /** Boss board: victory point, mana seal, absorb. */
  moduleF?: boolean;
  /** Brilliant-move (묘수) mission. */
  moduleG?: boolean;
  /** Arena mana race — first to full mana gets Amp. */
  manaRace?: boolean;
  /** Forbidden center zone (금기구역) — usually with moduleC. */
  forbidZone?: boolean;
  /** Dual boards (쌍국) — Module F. */
  dualBoard?: boolean;
}

/** Module H: map stage mode → active modules. */
export function modulesForStage(stage: StageDef): BattleModules {
  switch (stage.mode) {
    case "depth":
      return { moduleB: true };
    case "trial":
      return {
        moduleC: true,
        moduleD: true,
        moduleE: true,
        moduleG: true,
        forbidZone: true,
      };
    case "arena":
      return { moduleD: true, manaRace: true };
    case "world_arena":
      return { moduleD: true, moduleE: true, manaRace: true };
    case "guild_raid":
      return {
        moduleB: true,
        moduleE: true,
        moduleF: true,
        forbidZone: true,
        dualBoard: true,
      };
    case "weekday":
      return { moduleB: true, moduleG: true };
    case "equip":
      return { moduleB: true, moduleD: true, moduleG: true };
    case "scenario":
    default:
      return {
        moduleB: stage.boardSize >= 9,
        moduleG: stage.stage >= 3 || stage.boardSize >= 7,
      };
  }
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

/** Forbidden zone points (금기구역): center, or 3×3 on large boards. */
export function forbiddenZonePoints(size: number): Point[] {
  const m = Math.floor(size / 2);
  if (size <= 7) return [{ x: m, y: m }];
  const pts: Point[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      pts.push({ x: m + dx, y: m + dy });
    }
  }
  return pts;
}

export const BRILLIANT_MISSION_GOAL = 3;
/** Auto-switch dual boards every N stone summons. */
export const DUAL_BOARD_SWITCH_INTERVAL = 6;
