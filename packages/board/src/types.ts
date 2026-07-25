/** StoneSummoner magic-circle board types */

export type StoneColor = "black" | "white";

export type Cell = StoneColor | null;

export interface Point {
  x: number;
  y: number;
}

export interface PlayResult {
  ok: true;
  color: StoneColor;
  point: Point;
  captured: Point[];
  capturedCount: number;
  board: Cell[][];
}

export interface PlayError {
  ok: false;
  reason: "out_of_bounds" | "occupied" | "suicide" | "ko";
}

export type PlayOutcome = PlayResult | PlayError;
