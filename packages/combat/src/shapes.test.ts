import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Board } from "stonesummoner-board";
import { detectShapeBonuses, randomStarPoints, starPoints } from "./shapes.js";

describe("shape bonuses (module B)", () => {
  it("lists star points for 9x9", () => {
    assert.equal(starPoints(9).length, 5);
    assert.equal(starPoints(13).length, 9);
  });

  it("randomizes star seats with a stable count", () => {
    const a = randomStarPoints(7, () => 0.11);
    const b = randomStarPoints(7, () => 0.73);
    assert.equal(a.length, 5);
    assert.equal(b.length, 5);
    const keys = (pts: { x: number; y: number }[]) =>
      pts.map((p) => `${p.x},${p.y}`).sort().join("|");
    assert.notEqual(keys(a), keys(b));
    for (const p of a) {
      assert.ok(p.x >= 0 && p.x < 7 && p.y >= 0 && p.y < 7);
    }
  });

  it("detects corner and star on play", () => {
    const b = new Board(9);
    b.play("black", { x: 0, y: 0 });
    const corner = detectShapeBonuses(b, "black", { x: 0, y: 0 });
    assert.ok(corner.some((s) => s.id === "corner"));

    b.play("white", { x: 1, y: 1 });
    b.play("black", { x: 4, y: 4 });
    const star = detectShapeBonuses(b, "black", { x: 4, y: 4 });
    assert.ok(star.some((s) => s.id === "star"));
  });

  it("detects star control when 3 stars owned", () => {
    const b = new Board(9);
    b.play("black", { x: 2, y: 2 });
    b.play("white", { x: 0, y: 1 });
    b.play("black", { x: 2, y: 6 });
    b.play("white", { x: 0, y: 2 });
    b.play("black", { x: 4, y: 4 });
    const bonuses = detectShapeBonuses(b, "black", { x: 4, y: 4 });
    assert.ok(bonuses.some((s) => s.id === "star_control"));
  });

  it("detects axis chain of 3", () => {
    const b = new Board(5);
    b.play("black", { x: 1, y: 2 });
    b.play("white", { x: 0, y: 0 });
    b.play("black", { x: 2, y: 2 });
    b.play("white", { x: 0, y: 1 });
    b.play("black", { x: 3, y: 2 });
    const after = detectShapeBonuses(b, "black", { x: 3, y: 2 });
    assert.ok(after.some((x) => x.id === "axis"));
  });
});
