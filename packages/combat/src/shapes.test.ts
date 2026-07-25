import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Board } from "stonesummoner-board";
import { detectShapeBonuses, starPoints } from "./shapes.js";

describe("shape bonuses (module B)", () => {
  it("lists star points for 9x9", () => {
    assert.equal(starPoints(9).length, 5);
    assert.equal(starPoints(13).length, 9);
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
});
