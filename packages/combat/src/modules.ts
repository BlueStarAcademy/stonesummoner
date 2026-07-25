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
}

/** Module H: map stage mode → active modules. */
export function modulesForStage(stage: StageDef): BattleModules {
  switch (stage.mode) {
    case "depth":
      return { moduleB: true };
    case "trial":
      return { moduleC: true, moduleD: true, moduleE: true, moduleG: true };
    case "arena":
      return { moduleD: true, manaRace: true };
    case "world_arena":
      return { moduleD: true, moduleE: true, manaRace: true };
    case "guild_raid":
      return { moduleB: true, moduleE: true, moduleF: true };
    case "weekday":
      return { moduleB: true, moduleG: true };
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

export const BRILLIANT_MISSION_GOAL = 3;
