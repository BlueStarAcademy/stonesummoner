import fs from "node:fs";

const p = "packages/data/src/data.test.ts";
let c = fs.readFileSync(p, "utf8");
c = c.replace(
  /it\("has 10 families[\s\S]*?assert\.equal\(els\.size, 5\);\s*\}\s*\}\);/,
  `it("has 50 families × 5 elements and 16 symbol sets", () => {
    assert.equal(MONSTERS.length, 250);
    assert.equal(SYMBOL_SETS.length, 16);
    assert.ok(getMonster("wolf_fighter_fire"));
    assert.ok(getMonster("lotus_dancer_wind"));
    assert.ok(getMonster("abyss_priest_dark"));
    assert.ok(getMonster("magic_archer_fire"));
    assert.ok(getMonster("cinder_imp_fire"));
    // Legacy ids still resolve
    assert.equal(getMonster("fire_fang")?.id, "wolf_fighter_fire");
    assert.equal(getMonster("seokrang_fire")?.id, "wolf_fighter_fire");
    const families = new Set(MONSTERS.map((m) => m.familyId));
    assert.equal(families.size, 50);
    const byStars = [1, 2, 3, 4, 5].map(
      (s) =>
        new Set(
          MONSTERS.filter((m) => m.naturalStars === s).map((m) => m.familyId),
        ).size,
    );
    assert.deepEqual(byStars, [10, 10, 12, 12, 6]);
    for (const fam of families) {
      const variants = MONSTERS.filter((m) => m.familyId === fam);
      assert.equal(variants.length, 5);
      const name = variants[0]!.nameKo;
      assert.ok(variants.every((v) => v.nameKo === name));
      const els = new Set(variants.map((v) => v.element));
      assert.equal(els.size, 5);
    }
  });`,
);
fs.writeFileSync(p, c, "utf8");
console.log("patched", p);
