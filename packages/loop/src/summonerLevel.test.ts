import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addActiveSummonerExp,
  applyRewards,
  createNewSave,
  createSummonerRoster,
  syncSummonerMirrors,
  accountLevelOf,
  unlockAdditionalSummoner,
  withUnlockedSummoners,
  chooseStarterSummoner,
  SUMMONER_ELEMENTS,
} from "./loop.js";
import { migrateSave } from "./migrateSave.js";
import { getStage } from "stonesummoner-data";

describe("shared summoner level", () => {
  it("seeds every kit with the same level", () => {
    const roster = createSummonerRoster({ level: 8, exp: 40 });
    assert.equal(roster.fire.level, 8);
    assert.equal(roster.dark.exp, 40);
    assert.equal(roster.light.awaken, 0);
  });

  it("flattens split saves to the highest kit", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, level: 6, exp: 10 },
        fire: { ...save.summoners.fire, level: 9, exp: 80 },
      },
      island: { ...save.island, summonerLevel: 4, summonerExp: 3 },
    };
    save = syncSummonerMirrors(save);
    assert.equal(accountLevelOf(save), 9);
    for (const el of SUMMONER_ELEMENTS) {
      assert.equal(save.summoners[el].level, 9);
      assert.equal(save.summoners[el].exp, 80);
    }
    assert.equal(save.island.summonerLevel, 9);
    assert.equal(save.island.summonerExp, 80);
  });

  it("writes battle exp onto every kit", () => {
    const save = syncSummonerMirrors({
      ...createNewSave(0),
      summoners: createSummonerRoster({ level: 9, exp: 80 }),
      island: { ...createNewSave(0).island, summonerLevel: 9, summonerExp: 80 },
    });
    const gained = addActiveSummonerExp(save, 20);
    assert.equal(gained.save.island.summonerExp, 100);
    assert.equal(gained.save.summoners.water.exp, 100);
    assert.equal(
      gained.save.summoners.dark.level,
      gained.save.summoners.light.level,
    );
  });

  it("lets an unlocked kit inherit the shared level", () => {
    const picked = chooseStarterSummoner(createNewSave(0), "fire");
    const at5 = syncSummonerMirrors({
      ...picked,
      summoners: {
        ...picked.summoners,
        fire: { ...picked.summoners.fire, level: 5 },
      },
      island: { ...picked.island, summonerLevel: 5 },
    });
    const unlocked = unlockAdditionalSummoner(at5, "water");
    assert.equal(unlocked.save.summoners.water.level, 5);
    assert.equal(unlocked.save.summoners.fire.level, 5);
  });

  it("emits one summoner exp track", () => {
    const stage = getStage("garen_1_1")!;
    const { reward } = applyRewards(createNewSave(0), stage, true, () => 0.99);
    const kinds = (reward.expTracks ?? []).map((t) => t.kind);
    assert.equal(kinds.filter((k) => k === "user").length, 0);
    assert.equal(kinds.filter((k) => k === "summoner").length, 1);
  });

  it("migrateSave promotes the highest kit to every element", () => {
    const base = createNewSave(0);
    const round = migrateSave({
      ...base,
      activeSummoner: "fire",
      summoners: {
        ...base.summoners,
        fire: { ...base.summoners.fire, level: 12, awaken: 2 },
      },
    });
    assert.ok(round);
    assert.equal(round!.summoners.fire.level, 12);
    assert.equal(round!.summoners.light.level, 12);
    assert.equal(round!.island.summonerLevel, 12);
    assert.equal(round!.summoners.fire.awaken, 2);
    assert.equal(round!.summoners.light.awaken, 0);
  });

  it("keeps unlock slots on the shared level", () => {
    const fresh = createNewSave(0);
    assert.equal(withUnlockedSummoners(fresh, ["fire"]).activeSummoner, "fire");
  });
});
