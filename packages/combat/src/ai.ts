import type { Point } from "stonesummoner-board";
import type { TeamId, Unit } from "./types.js";

export function teamStoneColor(team: TeamId): "black" | "white" {
  return team === "ally" ? "black" : "white";
}

/** Prefer capture moves, else center-ish empty point. */
export function pickAutoStone(
  legal: Point[],
  boardSize: number,
  evaluateCapture: (p: Point) => number,
): Point | null {
  if (legal.length === 0) return null;
  let best = legal[0]!;
  let bestScore = -Infinity;
  const cx = (boardSize - 1) / 2;
  const cy = (boardSize - 1) / 2;
  for (const p of legal) {
    const cap = evaluateCapture(p);
    const dist = Math.abs(p.x - cx) + Math.abs(p.y - cy);
    const score = cap * 100 - dist;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

export function pickDefaultTarget(enemies: Unit[]): Unit | null {
  const alive = enemies.filter((u) => u.alive);
  if (alive.length === 0) return null;
  const summoner = alive.find((u) => u.kind === "summoner");
  if (summoner) return summoner;
  return alive.reduce((a, b) => (a.hp <= b.hp ? a : b));
}
