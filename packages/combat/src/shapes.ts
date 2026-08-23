import type { Board, Point, StoneColor } from "stonesummoner-board";

export type ShapeBonusId =
  | "corner"
  | "star"
  | "star_control"
  | "tiger"
  | "kosumi"
  | "axis";

export interface ShapeBonus {
  id: ShapeBonusId;
  labelKo: string;
  amplifyDelta: number;
  mana: number;
  skillAmplifyBonus?: number;
  /** Fraction of unit max HP as shield. */
  shieldPct?: number;
}

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/** How many 화점 seats a board of this size carries. */
export function starPointCount(size: number): number {
  if (size <= 5) return 1;
  if (size <= 9) return 5;
  return 9;
}

/** Classic Go-style 화점 layout (tests / fallback). */
export function starPoints(size: number): Point[] {
  if (size <= 5) return [{ x: 2, y: 2 }];
  if (size === 7) {
    return [
      { x: 2, y: 2 },
      { x: 2, y: 4 },
      { x: 4, y: 2 },
      { x: 4, y: 4 },
      { x: 3, y: 3 },
    ];
  }
  if (size === 9) {
    return [
      { x: 2, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 2 },
      { x: 6, y: 6 },
      { x: 4, y: 4 },
    ];
  }
  // 13×13 and larger: 3-3 style ring + center
  const a = 3;
  const b = size - 4;
  const m = Math.floor(size / 2);
  return [
    { x: a, y: a },
    { x: a, y: b },
    { x: b, y: a },
    { x: b, y: b },
    { x: m, y: m },
    { x: a, y: m },
    { x: b, y: m },
    { x: m, y: a },
    { x: m, y: b },
  ];
}

export function allBoardPoints(size: number, avoid: Point[] = []): Point[] {
  const banned = new Set(avoid.map((p) => `${p.x},${p.y}`));
  const pool: Point[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!banned.has(`${x},${y}`)) pool.push({ x, y });
    }
  }
  return pool;
}

/** Fisher–Yates sample; `rng` is expected in [0, 1). */
export function shufflePickPoints(
  pool: Point[],
  count: number,
  rng: () => number,
): Point[] {
  const arr = pool.map((p) => ({ x: p.x, y: p.y }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr.slice(0, Math.min(Math.max(0, count), arr.length));
}

/** Battle-start 화점: same count as the classic layout, any unique cells. */
export function randomStarPoints(
  size: number,
  rng: () => number,
  avoid: Point[] = [],
): Point[] {
  return shufflePickPoints(
    allBoardPoints(size, avoid),
    starPointCount(size),
    rng,
  );
}

export function pickRandomPoint(
  size: number,
  rng: () => number,
  avoid: Point[] = [],
): Point {
  const pool = allBoardPoints(size, avoid);
  if (!pool.length) {
    const m = Math.floor(size / 2);
    return { x: m, y: m };
  }
  const i = Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)));
  return pool[i]!;
}

function isCorner(size: number, p: Point): boolean {
  const last = size - 1;
  return (
    (p.x === 0 || p.x === last) && (p.y === 0 || p.y === last)
  );
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function inBounds(size: number, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
}

/** Empty point with exactly one liberty and ≥3 own adjacent stones (호구 근사). */
function detectTigerMouth(
  board: Board,
  color: StoneColor,
  last: Point,
): boolean {
  for (const d of DIRS) {
    const e = { x: last.x + d.x, y: last.y + d.y };
    if (!inBounds(board.size, e)) continue;
    if (board.at(e) !== null) continue;
    let ownAdj = 0;
    let emptyAdj = 0;
    for (const d2 of DIRS) {
      const n = { x: e.x + d2.x, y: e.y + d2.y };
      if (!inBounds(board.size, n)) continue;
      const cell = board.at(n);
      if (cell === color) ownAdj++;
      else if (cell === null) emptyAdj++;
    }
    if (ownAdj >= 3 && emptyAdj <= 1) return true;
  }
  return false;
}

/** Diagonal own neighbor (콧수염/코스미 ≈ 쌍립 스텁). */
function hasKosumi(board: Board, color: StoneColor, last: Point): boolean {
  const diags = [
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ];
  for (const d of diags) {
    const n = { x: last.x + d.x, y: last.y + d.y };
    if (!inBounds(board.size, n)) continue;
    if (board.at(n) === color) return true;
  }
  return false;
}

/** Straight chain of 3+ own stones (축 연결 스텁). */
function hasAxisChain(board: Board, color: StoneColor, last: Point): boolean {
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
  ] as const) {
    let count = 1;
    for (const dir of [1, -1] as const) {
      let x = last.x + dx * dir;
      let y = last.y + dy * dir;
      while (inBounds(board.size, { x, y }) && board.at({ x, y }) === color) {
        count += 1;
        x += dx * dir;
        y += dy * dir;
      }
    }
    if (count >= 3) return true;
  }
  return false;
}

/**
 * Module B: detect shape bonuses after a successful play at `last`.
 */
export function detectShapeBonuses(
  board: Board,
  color: StoneColor,
  last: Point,
  stars: Point[] = starPoints(board.size),
): ShapeBonus[] {
  const out: ShapeBonus[] = [];

  if (isCorner(board.size, last)) {
    out.push({
      id: "corner",
      labelKo: "귀 점유",
      amplifyDelta: 0.02,
      mana: 20,
      skillAmplifyBonus: 0.03,
    });
  }

  if (stars.some((s) => samePoint(s, last))) {
    out.push({
      id: "star",
      labelKo: "화점",
      amplifyDelta: 0.03,
      mana: 16,
    });
  }

  const starOwned = stars.filter((s) => board.at(s) === color).length;
  if (starOwned >= 3) {
    out.push({
      id: "star_control",
      labelKo: "화점 지배",
      amplifyDelta: 0.05,
      mana: 18,
      skillAmplifyBonus: 0.05,
    });
  }

  if (detectTigerMouth(board, color, last)) {
    out.push({
      id: "tiger",
      labelKo: "호구",
      amplifyDelta: 0.02,
      mana: 15,
      shieldPct: 0.1,
    });
  }

  if (hasKosumi(board, color, last)) {
    out.push({
      id: "kosumi",
      labelKo: "쌍립",
      amplifyDelta: 0.015,
      mana: 15,
    });
  }

  if (hasAxisChain(board, color, last)) {
    out.push({
      id: "axis",
      labelKo: "축 연결",
      amplifyDelta: 0.025,
      mana: 16,
      shieldPct: 0.08,
    });
  }

  return out;
}
