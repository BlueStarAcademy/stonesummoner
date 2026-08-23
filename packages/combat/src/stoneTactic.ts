import type { Board, Point, StoneColor } from "stonesummoner-board";

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const DIAG: Point[] = [
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

export interface ExpertStoneHints {
  hasToken?: (p: Point) => boolean;
  baitLure?: (p: Point) => boolean;
  openingBias?: boolean;
  stars?: Point[];
}

function key(p: Point): string {
  return `${p.x},${p.y}`;
}

function inBounds(size: number, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
}

type GroupInfo = { stones: Point[]; libs: Point[] };

function groupsOf(board: Board, color: StoneColor): GroupInfo[] {
  const seen = new Set<string>();
  const out: GroupInfo[] = [];
  const size = board.size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = { x, y };
      if (board.at(p) !== color) continue;
      const k = key(p);
      if (seen.has(k)) continue;
      const stones = board.group(p);
      for (const s of stones) seen.add(key(s));
      out.push({ stones, libs: board.libertiesOfGroup(stones) });
    }
  }
  return out;
}

function edgePenalty(size: number, p: Point): number {
  const last = size - 1;
  const dx = Math.min(p.x, last - p.x);
  const dy = Math.min(p.y, last - p.y);
  const ring = Math.min(dx, dy);
  if (ring === 0) return 42;
  if (ring === 1 && size >= 7) return 10;
  return 0;
}

function openingShapeBonus(
  size: number,
  p: Point,
  stoneCount: number,
  stars?: Point[],
): number {
  if (stoneCount > 6) return 0;
  const m = (size - 1) / 2;
  const dist = Math.abs(p.x - m) + Math.abs(p.y - m);
  let s = Math.max(0, (size - dist) * 6);
  const hoshi =
    stars ??
    (size >= 7
      ? [
          { x: 2, y: 2 },
          { x: 2, y: size - 3 },
          { x: size - 3, y: 2 },
          { x: size - 3, y: size - 3 },
          { x: Math.floor(m), y: Math.floor(m) },
        ]
      : []);
  if (hoshi.some((h) => h.x === p.x && h.y === p.y)) s += 38;
  return s;
}

function neighborCounts(
  board: Board,
  p: Point,
  color: StoneColor,
): { own: number; opp: number; empty: number; diagOwn: number } {
  const opp = color === "black" ? "white" : "black";
  let own = 0;
  let oppN = 0;
  let empty = 0;
  for (const d of DIRS) {
    const q = { x: p.x + d.x, y: p.y + d.y };
    if (!inBounds(board.size, q)) continue;
    const c = board.at(q);
    if (c === color) own += 1;
    else if (c === opp) oppN += 1;
    else empty += 1;
  }
  let diagOwn = 0;
  for (const d of DIAG) {
    const q = { x: p.x + d.x, y: p.y + d.y };
    if (!inBounds(board.size, q)) continue;
    if (board.at(q) === color) diagOwn += 1;
  }
  return { own, opp: oppN, empty, diagOwn };
}

function immediateOpponentCapture(board: Board, opp: StoneColor): number {
  const threats = new Map<string, Point>();
  const mine = opp === "black" ? "white" : "black";
  for (const g of groupsOf(board, mine)) {
    if (g.libs.length === 1) threats.set(key(g.libs[0]!), g.libs[0]!);
  }
  for (const g of groupsOf(board, opp)) {
    if (g.libs.length === 1) threats.set(key(g.libs[0]!), g.libs[0]!);
  }
  let best = 0;
  for (const p of threats.values()) {
    const trial = board.clone();
    const r = trial.play(opp, p);
    if (r.ok && r.capturedCount > best) best = r.capturedCount;
  }
  return best;
}

function countStones(board: Board): number {
  let n = 0;
  const size = board.size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board.at({ x, y })) n += 1;
    }
  }
  return n;
}

/**
 * Strong Go-like scoring for enemy auto-play on 5×5 / 7×7.
 * Prioritizes life-and-death, then shape, then combat tokens.
 */
export function scoreExpertStone(
  board: Board,
  color: StoneColor,
  point: Point,
  hints: ExpertStoneHints = {},
): number {
  const beforeOwn = groupsOf(board, color);
  const beforeOpp = groupsOf(board, color === "black" ? "white" : "black");
  const trial = board.clone();
  const played = trial.play(color, point);
  if (!played.ok) return Number.NEGATIVE_INFINITY;

  let score = 0;
  const cap = played.capturedCount;
  score += cap * 1200 + cap * cap * 90;

  for (const g of beforeOwn) {
    if (g.libs.length === 1 && g.libs[0]!.x === point.x && g.libs[0]!.y === point.y) {
      score += 780 * g.stones.length;
    }
  }
  for (const g of beforeOpp) {
    if (g.libs.length === 1 && g.libs[0]!.x === point.x && g.libs[0]!.y === point.y) {
      score += 80 * g.stones.length;
    } else if (
      g.libs.length === 2 &&
      g.libs.some((l) => l.x === point.x && l.y === point.y)
    ) {
      score += 95 * g.stones.length;
    }
  }

  const afterOwn = groupsOf(trial, color);
  const afterOpp = groupsOf(trial, color === "black" ? "white" : "black");
  const playedGroup = afterOwn.find((g) =>
    g.stones.some((s) => s.x === point.x && s.y === point.y),
  );
  if (playedGroup && playedGroup.libs.length === 1 && cap === 0) {
    score -= 820 * playedGroup.stones.length;
  }
  for (const g of afterOwn) {
    if (g.libs.length === 1) score -= 120 * g.stones.length;
    else score += Math.min(4, g.libs.length) * 9 * Math.sqrt(g.stones.length);
  }
  let oppAtariGroups = 0;
  for (const g of afterOpp) {
    if (g.libs.length === 1) {
      score += 240 * g.stones.length;
      oppAtariGroups += 1;
    } else if (g.libs.length === 2) {
      score += 28 * g.stones.length;
    }
  }
  if (oppAtariGroups >= 2) score += 160;

  const recap = immediateOpponentCapture(trial, color === "black" ? "white" : "black");
  score -= recap * 1100;

  const nb = neighborCounts(board, point, color);
  score += nb.own * 52;
  score += nb.diagOwn * 14;
  score += nb.opp * 16;
  if (nb.own >= 4 && nb.opp === 0 && cap === 0) score -= 240;
  if (nb.empty === 0 && cap === 0 && nb.own >= 2) score -= 60;

  const edge = edgePenalty(board.size, point);
  const urgent = cap > 0 || score > 600;
  if (!urgent) score -= edge;

  const stones = countStones(board);
  score += openingShapeBonus(board.size, point, stones, hints.stars);
  if (hints.openingBias) {
    const m = (board.size - 1) / 2;
    score += Math.max(0, board.size - (Math.abs(point.x - m) + Math.abs(point.y - m))) * 10;
  }
  if (hints.hasToken?.(point)) score += 36;
  if (hints.baitLure?.(point)) score += 220;
  return score;
}

export function pickExpertStone(
  board: Board,
  color: StoneColor,
  legal: Point[],
  hints: ExpertStoneHints = {},
): Point | null {
  if (legal.length === 0) return null;
  let best = legal[0]!;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const p of legal) {
    const s = scoreExpertStone(board, color, p, hints);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return best;
}
