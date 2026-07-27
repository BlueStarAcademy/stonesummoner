import type { Point } from "stonesummoner-board";
import { gainsForBoardEvent, classifyCapture } from "./boardEvents.js";
import type { TeamId, Unit } from "./types.js";

export function teamStoneColor(team: TeamId): "black" | "white" {
  return team === "ally" ? "black" : "white";
}

export interface StoneEval {
  capturedCount: number;
  hasToken: boolean;
  /** Opposite-team AI lure from 미끼돌. */
  baitLure?: boolean;
}

export interface StoneSuggestion {
  point: Point;
  rank: number;
  score: number;
  capturedCount: number;
  amplifyDelta: number;
  skillAmplifyBonus: number;
  /** Flat mana (safe place / items). Capture mana uses captureManaFrac × manaMax. */
  manaGain: number;
  /** Next monster hit: FinalDamage × (1 + captureDamageBonus). */
  captureDamageBonus: number;
  /** Summoner mana += manaMax × captureManaFrac. */
  captureManaFrac: number;
  hasToken: boolean;
}

/** Prefer capture moves, else center-ish empty point. */
export function pickAutoStone(
  legal: Point[],
  boardSize: number,
  evaluateCapture: (p: Point) => number,
): Point | null {
  const ranked = rankStoneSuggestions(legal, boardSize, (p) => ({
    capturedCount: Math.max(0, evaluateCapture(p)),
    hasToken: false,
  }));
  return ranked[0]?.point ?? null;
}

/**
 * Top-N stone candidates for semi-auto UI (default 3).
 * Score: captures ≫ token ≫ center proximity.
 * `openingBias` (포석 보너스) further prefers center after empowered reset.
 */
export function rankStoneSuggestions(
  legal: Point[],
  boardSize: number,
  evaluate: (p: Point) => StoneEval,
  manaMul = 1,
  limit = 3,
  openingBias = 0,
): StoneSuggestion[] {
  if (legal.length === 0) return [];
  const cx = (boardSize - 1) / 2;
  const cy = (boardSize - 1) / 2;

  const scored = legal.map((p) => {
    const ev = evaluate(p);
    const cap = Math.max(0, ev.capturedCount);
    const dist = Math.abs(p.x - cx) + Math.abs(p.y - cy);
    const tokenBonus = ev.hasToken ? 2.5 : 0;
    const baitBonus = ev.baitLure ? 45 : 0;
    const openBonus =
      openingBias > 0 ? Math.max(0, boardSize - dist) * openingBias : 0;
    const score =
      cap * 100 + tokenBonus * 10 + baitBonus + openBonus - dist;
    const kind = classifyCapture(cap);
    const gains = gainsForBoardEvent(kind, cap, manaMul);
    const magnet = ev.hasToken
      ? gainsForBoardEvent("item_magnet", 0, manaMul)
      : null;
    return {
      point: p,
      score,
      capturedCount: cap,
      amplifyDelta: gains.amplifyDelta + (magnet?.amplifyDelta ?? 0),
      skillAmplifyBonus:
        gains.skillAmplifyBonus + (magnet?.skillAmplifyBonus ?? 0),
      manaGain: Math.round(gains.mana + (magnet?.mana ?? 0)),
      captureDamageBonus: gains.captureDamageBonus,
      captureManaFrac: gains.captureManaFrac,
      hasToken: ev.hasToken,
      rank: 0,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
}

export function pickDefaultTarget(enemies: Unit[]): Unit | null {
  /** Summoners are backline support — never valid attack targets. */
  const alive = enemies.filter((u) => u.alive && u.kind === "monster");
  if (alive.length === 0) return null;
  return alive.reduce((a, b) => (a.hp <= b.hp ? a : b));
}

/** Alive combat summons (monsters only). */
export function aliveSummons(units: Unit[], team?: TeamId): Unit[] {
  return units.filter(
    (u) => u.alive && u.kind === "monster" && (team ? u.team === team : true),
  );
}
