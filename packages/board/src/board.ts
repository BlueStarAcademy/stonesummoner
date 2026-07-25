import type { Cell, PlayOutcome, Point, StoneColor } from "./types.js";

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function key(p: Point): string {
  return `${p.x},${p.y}`;
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.slice());
}

/**
 * Combat Go board: liberties, capture, no-suicide, simple ko.
 * No territory scoring — battle uses unit HP.
 */
export class Board {
  readonly size: number;
  private grid: Cell[][];
  private koPoint: Point | null = null;
  private historyHashes: string[] = [];

  constructor(size = 9) {
    if (size < 5 || size > 19) {
      throw new Error(`Unsupported board size: ${size}`);
    }
    this.size = size;
    this.grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null),
    );
  }

  static fromGrid(grid: Cell[][]): Board {
    const size = grid.length;
    const b = new Board(size);
    b.grid = cloneBoard(grid);
    return b;
  }

  getBoard(): Cell[][] {
    return cloneBoard(this.grid);
  }

  getKoPoint(): Point | null {
    return this.koPoint ? { ...this.koPoint } : null;
  }

  /** Wipe all stones and ko (same size). Used for empowered 9×9 circle reset. */
  clear(): void {
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => null),
    );
    this.koPoint = null;
    this.historyHashes = [];
  }

  inBounds(p: Point): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.size && p.y < this.size;
  }

  at(p: Point): Cell {
    if (!this.inBounds(p)) return null;
    return this.grid[p.y]![p.x]!;
  }

  /** Module C / effects: clear a stone without capture rules (event wipe). */
  forceClear(p: Point): boolean {
    if (!this.inBounds(p) || this.at(p) === null) return false;
    this.grid[p.y]![p.x] = null;
    this.koPoint = null;
    return true;
  }

  /** Rare item: flip stone color without capture resolution. */
  forceFlip(p: Point): boolean {
    if (!this.inBounds(p)) return false;
    const c = this.at(p);
    if (c === null) return false;
    this.grid[p.y]![p.x] = c === "black" ? "white" : "black";
    this.koPoint = null;
    return true;
  }

  private neighbors(p: Point): Point[] {
    return DIRS.map((d) => ({ x: p.x + d.x, y: p.y + d.y })).filter((q) =>
      this.inBounds(q),
    );
  }

  /** Connected group of same color including start. */
  group(start: Point): Point[] {
    const color = this.at(start);
    if (!color) return [];
    const seen = new Set<string>();
    const out: Point[] = [];
    const stack = [start];
    while (stack.length) {
      const p = stack.pop()!;
      const k = key(p);
      if (seen.has(k)) continue;
      seen.add(k);
      if (this.at(p) !== color) continue;
      out.push(p);
      for (const n of this.neighbors(p)) stack.push(n);
    }
    return out;
  }

  libertiesOfGroup(group: Point[]): Point[] {
    const libs = new Map<string, Point>();
    for (const p of group) {
      for (const n of this.neighbors(p)) {
        if (this.at(n) === null) libs.set(key(n), n);
      }
    }
    return [...libs.values()];
  }

  liberties(p: Point): Point[] {
    return this.libertiesOfGroup(this.group(p));
  }

  private removeGroup(group: Point[]): void {
    for (const p of group) {
      this.grid[p.y]![p.x] = null;
    }
  }

  private hash(): string {
    return this.grid.map((row) => row.map((c) => (c === "black" ? "B" : c === "white" ? "W" : ".")).join("")).join("/");
  }

  opponent(color: StoneColor): StoneColor {
    return color === "black" ? "white" : "black";
  }

  /**
   * Attempt to play a stone. Mutates board on success.
   */
  play(color: StoneColor, point: Point): PlayOutcome {
    if (!this.inBounds(point)) {
      return { ok: false, reason: "out_of_bounds" };
    }
    if (this.at(point) !== null) {
      return { ok: false, reason: "occupied" };
    }
    if (this.koPoint && this.koPoint.x === point.x && this.koPoint.y === point.y) {
      return { ok: false, reason: "ko" };
    }

    const snapshot = cloneBoard(this.grid);
    const prevKo = this.koPoint;

    this.grid[point.y]![point.x] = color;

    const opp = this.opponent(color);
    const captured: Point[] = [];
    const capturedGroups: Point[][] = [];

    for (const n of this.neighbors(point)) {
      if (this.at(n) !== opp) continue;
      const g = this.group(n);
      if (this.libertiesOfGroup(g).length === 0) {
        capturedGroups.push(g);
      }
    }

    // Deduplicate stones across adjacent captured groups
    const capSet = new Set<string>();
    for (const g of capturedGroups) {
      for (const p of g) {
        const k = key(p);
        if (!capSet.has(k)) {
          capSet.add(k);
          captured.push(p);
        }
      }
      this.removeGroup(g);
    }

    const ownGroup = this.group(point);
    if (this.libertiesOfGroup(ownGroup).length === 0) {
      this.grid = snapshot;
      this.koPoint = prevKo;
      return { ok: false, reason: "suicide" };
    }

    // Simple ko: exactly one stone captured and that point is the only liberty of the new stone group of size 1
    if (captured.length === 1 && ownGroup.length === 1) {
      this.koPoint = captured[0]!;
    } else {
      this.koPoint = null;
    }

    this.historyHashes.push(this.hash());

    return {
      ok: true,
      color,
      point: { ...point },
      captured,
      capturedCount: captured.length,
      board: this.getBoard(),
    };
  }

  /** Empty intersections (legal not checked). */
  emptyPoints(): Point[] {
    const pts: Point[] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y]![x] === null) pts.push({ x, y });
      }
    }
    return pts;
  }

  /** Points where `color` can legally play. */
  legalMoves(color: StoneColor): Point[] {
    const moves: Point[] = [];
    for (const p of this.emptyPoints()) {
      const trial = Board.fromGrid(this.grid);
      trial.koPoint = this.koPoint ? { ...this.koPoint } : null;
      const r = trial.play(color, p);
      if (r.ok) moves.push(p);
    }
    return moves;
  }
}
