import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStarterGear, createSymbol, getStage, CHAPTER1_STAGES } from "stonesummoner-data";
import {
  createNewSave,
  createStageBattle,
  EQUIP_VAULT_WEEKLY_LIMIT,
  homeCollect,
  isoWeekKey,
  isStageUnlocked,
  isDifficultyOpen,
  nextStageInProgression,
  listGear,
  listRoster,
  listSymbols,
  runBuyEnergy,
  runBuyGrindstone,
  GRINDSTONE_BUY_CRYSTAL_COST,
  SCROLL_PREMIUM_BUY_CRYSTAL_COST,
  catalogShopRemaining,
  catalogShopBoughtToday,
  runExpandSymbolBag,
  symbolBagCapacity,
  symbolBagExpandCost,
  SYMBOL_BAG_BASE_SLOTS,
  SYMBOL_BAG_EXPAND_STEP,
  SYMBOL_BAG_MAX_SLOTS,
  runBuyGlory,
  runBuyScroll,
  runCraftEssence,
  runCraftScroll,
  runDemoLoop,
  runEnhance,
  runPowerUpMonster,
  runEnhanceGear,
  runAffixGearSet,
  runEquipGearBag,
  runSellGearBag,
  getActiveGear,
  withActiveGear,
  runAwakenSummoner,
  runAwakenMonster,
  setActiveSummoner,
  runUnlockSkillNode,
  awakenManaCost,
  awakenCrystalCost,
  summonerAwakenMatCost,
  awakenMinLevel,
  awakenLeaderAtkPct,
  MAX_SUMMONER_AWAKEN,
  runEnhanceSymbol,
  runEquipSymbol,
  runUnequipSymbol,
  runEvolve,
  runFeedSameMonster,
  runFusion,
  runGrindSymbol,
  unclaimedMailCount,
  runClaimMail,
  runClaimDailyMission,
  runImprintSymbol,
  runJoinGuild,
  runGuildCheckIn,
  guildLeaderboard,
  runClaimSeasonReward,
  runPracticeDojo,
  runBuyCircleInscription,
  runSellSymbol,
  runSetArenaBans,
  runSetArenaDefense,
  runSetParty,
  runSavePartyPreset,
  runLoadPartyPreset,
  runChangeProfileNickname,
  runSetProfileIcon,
  runSkillUp,
  runSortie,
  runSummon,
  runUpgradeBuilding,
  runBuyShopOffer,
  getDailyShopOffers,
  runRecipeFusion,
  ARENA_ATTACKS_DAILY,
  RAID_BOSS_MAX_HP,
  RAID_ATTEMPTS_DAILY,
  GUILD_WEEK_CONTRIB_GOAL,
  applyRewards,
  rollStageCrystalDrop,
  stageCrystalDropChance,
  monsterExpToNext,
  monsterMaxLevel,
  addOwnedMonsterExp,
} from "./loop.js";
import {
  claimableMainQuestCount,
  isMainQuestComplete,
  isMainQuestUnlocked,
  runClaimMainQuest,
} from "./mainQuest.js";
import { migrateSave } from "./migrateSave.js";
import { expForStage } from "./progress.js";
import { FUSION_RECIPES, isFusionOnlyFamily } from "stonesummoner-data";

describe("game loop", () => {
  it("collects mana from pond", () => {
    const save = createNewSave(0);
    const r = homeCollect(save, 3_600_000);
    assert.ok(r.save.island.mana > save.island.mana);
    assert.match(r.message, /골드 연못/);
  });

  it("upgrades mana pond", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, mana: 5000, energy: 50 } };
    const up = runUpgradeBuilding(save, "mana_pond");
    assert.match(up.message, /Lv\.2/);
    assert.equal(
      up.save.island.buildings.find((b) => b.id === "mana_pond")!.level,
      2,
    );
    save = up.save;
    const beforeCrystal = save.island.crystal;
    const r = runSortie(save, "garen_1_1", { rng: () => 0.1 });
    if (r.reward?.victory) {
      assert.equal(r.save.island.crystal, beforeCrystal + (r.reward.crystal ?? 0));
    }
  });

  it("drops stage crystals rarely like Summoners War extras", () => {
    const early = getStage("garen_1_1")!;
    assert.equal(stageCrystalDropChance(early), 0.08);
    assert.equal(stageCrystalDropChance(getStage("giant_b10")!), 0.05);
    assert.equal(stageCrystalDropChance(getStage("arena_rookie")!), 0);
    assert.equal(rollStageCrystalDrop(early, () => 0.99), 0);
    assert.equal(rollStageCrystalDrop(early, () => 0.1), 0);
    const hit = rollStageCrystalDrop(early, () => 0.01);
    assert.equal(hit, 1);

    const miss = applyRewards(createNewSave(0), early, true, () => 0.99);
    assert.equal(miss.reward.crystal ?? 0, 0);
    const granted = applyRewards(createNewSave(0), early, true, () => 0.01);
    assert.equal(granted.reward.crystal, 1);
    assert.equal(
      granted.save.island.crystal,
      createNewSave(0).island.crystal + 1,
    );
  });

  it("runs sortie with energy cost and reward", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, energy: 50 } };
    const r = runSortie(save, "garen_1_1", { rng: () => 0.1 });
    assert.equal(r.save.island.energy, 47);
    assert.ok(r.reward);
    if (r.reward?.victory) {
      assert.ok(r.reward.mana > 0);
      assert.ok(r.save.clearedStages.includes("garen_1_1"));
      assert.ok((r.reward.summonerExp ?? 0) > 0);
    }
  });

  it("runs phase2 arena glory and depth unlock", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: [
        "garen_1_1",
        "garen_1_2",
        "garen_1_3",
        "garen_1_4",
        "garen_1_5",
        "garen_1_6",
        "garen_1_7",
      ],
      island: { ...save.island, mana: 8000, energy: 80, summonerLevel: 10 },
      gloryPoints: 100,
    };
    assert.equal(isStageUnlocked(save, "giant_b1"), true);
    assert.equal(isStageUnlocked(save, "giant_b2"), false);
    assert.equal(isStageUnlocked(save, "tower_2_1"), true);
    assert.equal(isStageUnlocked(save, "arena_rookie"), true);
    assert.equal(nextStageInProgression(save, getStage("giant_b1")!), null);

    const giantClear = {
      ...save,
      clearedStages: [...save.clearedStages, "giant_b1"],
    };
    assert.equal(isStageUnlocked(giantClear, "giant_b2"), true);
    assert.equal(nextStageInProgression(giantClear, getStage("giant_b1")!)?.id, "giant_b2");
    assert.equal(
      nextStageInProgression(
        { ...giantClear, clearedStages: [...giantClear.clearedStages, "giant_b10"] },
        getStage("giant_b10")!,
      ),
      null,
    );

    const arena = runSortie(save, "arena_rookie", { rng: () => 0.1 });
    if (arena.reward?.victory) {
      assert.ok((arena.reward.glory ?? 0) >= 25);
      assert.ok(arena.save.gloryPoints >= save.gloryPoints);
    }

    const buy = runBuyGlory(save, "ancient_sword");
    assert.match(buy.message, /고대의 검/);
    assert.equal(buy.save.gloryLevels.ancient_sword, 1);
  });

  it("drops summoner gear randomly from scenario clears", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, energy: 50 } };
    const r = runSortie(save, "garen_1_1", { rng: () => 0.01 });
    assert.ok(r.reward?.victory);
    assert.ok(r.reward?.gear, "scenario clear should be able to drop summoner gear");
    assert.ok(
      (r.save.gearBag ?? []).some((g) => g.id === r.reward!.gear!.id),
    );
  });

  it("drops gear from equip vault dungeon", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3", "garen_1_4"],
      island: { ...save.island, energy: 40, mana: 5000 },
    };
    assert.equal(isStageUnlocked(save, "equip_vault_1"), true);
    assert.equal(isStageUnlocked(save, "equip_vault_boss"), false);

    const r = runSortie(save, "equip_vault_1", { rng: () => 0.01 });
    assert.ok(r.reward);
    assert.equal(r.save.equipVaultWeekEntries, 1);
    if (r.reward?.victory) {
      assert.ok(r.reward.gear, "equip dungeon should drop gear at high chance");
      assert.ok(
        (r.save.gearBag ?? []).some((g) => g.id === r.reward!.gear!.id),
      );
      assert.match(r.reward.expNote, /가방/);
      save = r.save;
      const eq = runEquipGearBag(save, 0);
      assert.match(eq.message, /장착/);
      assert.equal(eq.save.gear[r.reward.gear.slot]?.id, r.reward.gear.id);
    }
  });

  it("limits equip vault entries per ISO week", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3", "garen_1_4"],
      island: { ...save.island, energy: 100 },
      equipVaultWeekKey: isoWeekKey(),
      equipVaultWeekEntries: EQUIP_VAULT_WEEKLY_LIMIT,
    };
    const blocked = runSortie(save, "equip_vault_1", { rng: () => 0.01 });
    assert.match(blocked.message, /주간 입장 한도/);
    assert.equal(blocked.save.equipVaultWeekEntries, EQUIP_VAULT_WEEKLY_LIMIT);
  });

  it("locks later stages until previous clear", () => {
    const save = createNewSave(0);
    assert.equal(isStageUnlocked(save, "garen_1_1"), true);
    assert.equal(isStageUnlocked(save, "garen_1_2"), false);
    const locked = runSortie(save, "garen_1_2", { rng: () => 0.1 });
    assert.match(locked.message, /잠김/);
  });

  it("unlocks chapter 3 after tower_2_7 clear", () => {
    const base = createNewSave(0);
    assert.equal(isStageUnlocked(base, "ruins_3_1"), false);
    const save = {
      ...base,
      clearedStages: [
        "garen_1_1",
        "garen_1_2",
        "garen_1_3",
        "garen_1_4",
        "garen_1_5",
        "garen_1_6",
        "garen_1_7",
        "tower_2_1",
        "tower_2_2",
        "tower_2_3",
        "tower_2_4",
        "tower_2_5",
        "tower_2_6",
        "tower_2_7",
      ],
    };
    assert.equal(isStageUnlocked(save, "ruins_3_1"), true);
    assert.equal(isStageUnlocked(save, "ruins_3_2"), false);
  });

  it("fuses same-species and unlocks guild raid", () => {
    let save = createNewSave(0);
    const id = save.roster[0]!.monsterId;
    save = {
      ...save,
      island: { ...save.island, mana: 5000, summonerLevel: 17 },
      roster: [
        ...save.roster,
        {
          ...save.roster[0]!,
          uid: "fuse_donor",
          monsterId: id,
          level: 8,
          evolve: 0,
        },
      ],
      clearedStages: [
        "garen_1_1",
        "garen_1_2",
        "garen_1_3",
        "garen_1_4",
        "garen_1_5",
        "garen_1_6",
        "garen_1_7",
        "tower_2_1",
        "tower_2_2",
        "tower_2_3",
        "tower_2_4",
        "tower_2_5",
        "tower_2_6",
        "tower_2_7",
      ],
    };
    assert.equal(isStageUnlocked(save, "guild_raid_boss"), true);
    assert.equal(isStageUnlocked(save, "warena_qual"), true);

    const before = save.roster.length;
    const fuse = runFusion(save, "0", "fuse_donor");
    assert.match(fuse.message, /융합/);
    assert.equal(fuse.save.roster.length, before - 1);
    assert.equal(fuse.save.roster[0]!.evolve, 1);

    const raid = runSortie(
      { ...fuse.save, island: { ...fuse.save.island, energy: 20 } },
      "guild_raid_boss",
      { rng: () => 0.1, maxTurns: 120 },
    );
    assert.ok(raid.reward || /승리|패배|출정/.test(raid.message));
    if (raid.reward?.victory) {
      assert.ok((raid.save.guildContribution ?? 0) > 0);
      assert.ok((raid.reward.contribution ?? 0) > 0);
    }

    const banned = runSetArenaBans(raid.save, [
      "storm_spearmaster_light",
      "lotus_dancer_wind",
    ]);
    assert.deepEqual(banned.save.arenaBanIds, [
      "storm_spearmaster_light",
      "lotus_dancer_wind",
    ]);
    const battle = createStageBattle(
      getStage("warena_qual")!,
      banned.save,
      { banEnemyIds: banned.save.arenaBanIds },
    );
    const enemyMons = battle.units.filter(
      (u) => u.team === "enemy" && u.kind === "monster",
    );
    assert.equal(enemyMons.length, 2);
    assert.ok(!enemyMons.some((u) => /폭풍창술사|연꽃무희/.test(u.name)));
  });

  it("crafts scroll/essence and buys energy", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      jinmunStones: 5,
      island: {
        ...save.island,
        mana: 2000,
        crystal: 30,
        energy: 10,
        summonerLevel: 19,
      },
    };
    const energy = runBuyEnergy(save, 1);
    assert.match(energy.message, /에너지/);
    assert.equal(energy.save.island.crystal, 20);
    save = energy.save;

    const essence = runCraftEssence(save);
    assert.match(essence.message, /정수/);
    assert.equal(essence.save.jinmunStones, 4);
    save = essence.save;

    const craft = runCraftScroll(save);
    assert.match(craft.message, /제작/);
    assert.equal(craft.save.scrollsMystic, (save.scrollsMystic ?? 0) + 1);
  });

  it("expands symbol bag slots with rising crystal cost capped at 100", () => {
    let save = createNewSave(0);
    assert.equal(symbolBagCapacity(save), SYMBOL_BAG_BASE_SLOTS);
    assert.equal(symbolBagExpandCost(save), 10);

    save = {
      ...save,
      island: { ...save.island, crystal: 10_000 },
    };

    const first = runExpandSymbolBag(save);
    assert.equal(first.save.symbolBagSlots, SYMBOL_BAG_BASE_SLOTS + SYMBOL_BAG_EXPAND_STEP);
    assert.equal(first.save.island.crystal, 10_000 - 10);
    assert.equal(symbolBagExpandCost(first.save), 20);
    save = first.save;

    for (let i = 0; i < 8; i++) {
      const r = runExpandSymbolBag(save);
      save = r.save;
    }
    // After 9 expands: slots 190, next cost should be 100
    assert.equal(symbolBagCapacity(save), 190);
    assert.equal(symbolBagExpandCost(save), 100);

    const tenth = runExpandSymbolBag(save);
    assert.equal(tenth.save.symbolBagSlots, 200);
    assert.equal(symbolBagExpandCost(tenth.save), 100);
    save = tenth.save;

    const broke = runExpandSymbolBag({
      ...save,
      island: { ...save.island, crystal: 50 },
    });
    assert.match(broke.message, /크리스탈 부족/);
    assert.equal(broke.save.symbolBagSlots, save.symbolBagSlots);

    const maxed = runExpandSymbolBag({
      ...save,
      symbolBagSlots: SYMBOL_BAG_MAX_SLOTS,
      island: { ...save.island, crystal: 999 },
    });
    assert.match(maxed.message, /최대/);
    assert.equal(symbolBagExpandCost(maxed.save), null);
  });

  it("sells symbols and runs practice dojo", () => {
    let save = createNewSave(0);
    const before = save.symbols.length;
    const sell = runSellSymbol(save, "0");
    assert.match(sell.message, /판매/);
    assert.equal(sell.save.symbols.length, before - 1);
    assert.ok(sell.save.island.mana > save.island.mana);

    save = {
      ...sell.save,
      island: { ...sell.save.island, summonerLevel: 8 },
    };
    const drill = runPracticeDojo(save);
    assert.equal(drill.save.dojoDrills, 1);
    assert.equal(drill.save.dojoDrillsToday, 1);
    assert.equal(drill.save.jinmunStones, (save.jinmunStones ?? 0) + 1);
    assert.match(drill.message, /진문 수련/);
    assert.ok(drill.save.island.mana > save.island.mana);
    let s = drill.save;
    s = runPracticeDojo(s).save;
    const third = runPracticeDojo(s);
    assert.equal(third.save.dojoDrills, 3);
    assert.equal(third.save.dojoDrillsToday, 3);
    assert.equal(third.save.jinmunStones, (save.jinmunStones ?? 0) + 3);
    const blocked = runPracticeDojo(third.save);
    assert.match(blocked.message, /한도/);
    assert.equal(blocked.save.jinmunStones, third.save.jinmunStones);

    let g = { ...third.save, island: { ...third.save.island, summonerLevel: 12 } };
    const join = runJoinGuild(g, "진문수호");
    assert.equal(join.save.guildName, "진문수호");
    g = join.save;
    const check = runGuildCheckIn(g, Date.parse("2026-07-25T12:00:00Z"));
    assert.match(check.message, /출석/);
    assert.ok((check.save.guildContribution ?? 0) > (g.guildContribution ?? 0));
    const again = runGuildCheckIn(check.save, Date.parse("2026-07-25T18:00:00Z"));
    assert.match(again.message, /이미 출석/);
    const ranks = guildLeaderboard(check.save);
    assert.ok(ranks.some((r) => r.self));
    assert.ok(ranks[0]!.contribution >= ranks[ranks.length - 1]!.contribution);

    let season = {
      ...check.save,
      arenaSeasonWins: 3,
      seasonRewardsClaimed: 0,
    };
    const claim = runClaimSeasonReward(season);
    assert.match(claim.message, /시즌 보상/);
    assert.equal(claim.save.seasonRewardsClaimed, 1);
    const locked = runClaimSeasonReward(claim.save);
    assert.match(locked.message, /잠김/);
  });

  it("buys circle inscriptions and raises start mana", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      jinmunStones: 20,
      island: { ...save.island, summonerLevel: 8 },
    };
    const before = createStageBattle(getStage("garen_1_1")!, save);
    const r = runBuyCircleInscription(save, "start_mana");
    assert.match(r.message, /각인/);
    assert.equal(r.save.circleInscriptions.start_mana, 1);
    assert.equal(r.save.jinmunStones, 18);
    const after = createStageBattle(getStage("garen_1_1")!, r.save);
    assert.ok(after.allySummoner.mana > before.allySummoner.mana);
    const amp = runBuyCircleInscription(r.save, "amplify_cap");
    const ampBattle = createStageBattle(getStage("garen_1_1")!, amp.save);
    assert.ok(ampBattle.phaseAmplifyCap() > after.phaseAmplifyCap());
  });

  it("sets party from roster indices", () => {
    const save = createNewSave(0);
    const r = runSetParty(save, ["3", "0", "1"]);
    assert.equal(r.save.party.length, 3);
    assert.match(r.message, /파티 편성/);
  });

  it("evolves monster when level and costs met", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      roster: save.roster.map((m, i) =>
        i === 0 ? { ...m, level: 10, evolve: 0 } : m,
      ),
      island: { ...save.island, mana: 5000, crystal: 50 },
    };
    const blocked = runEvolve(
      {
        ...save,
        roster: save.roster.map((m, i) =>
          i === 0 ? { ...m, level: 5 } : m,
        ),
      },
      "0",
    );
    assert.match(blocked.message, /조건 미달/);

    const ok = runEvolve(save, "0");
    assert.match(ok.message, /진화/);
    assert.equal(ok.save.roster[0]!.evolve, 1);
    assert.ok(ok.save.island.mana < save.island.mana);
  });

  it("awakens monster with level/mana/crystal/mat gates", () => {
    let save = createNewSave(0);
    const el = "fire" as const;
    // starter_0 is cinder_imp_fire
    save = {
      ...save,
      roster: save.roster.map((m, i) =>
        i === 0 ? { ...m, level: 14, awaken: 0 } : m,
      ),
      island: { ...save.island, mana: 5000, crystal: 50 },
      awakenMats: { [el]: 20 },
    };
    const lowLv = runAwakenMonster(
      {
        ...save,
        roster: save.roster.map((m, i) =>
          i === 0 ? { ...m, level: 5 } : m,
        ),
      },
      "0",
    );
    assert.match(lowLv.message, /조건 미달/);

    const noMat = runAwakenMonster(
      { ...save, awakenMats: { [el]: 0 } },
      "0",
    );
    assert.match(noMat.message, /진화재료/);

    const ok = runAwakenMonster(save, "0");
    assert.match(ok.message, /각성/);
    assert.equal(ok.save.roster[0]!.awaken, 1);
    assert.equal(ok.save.awakenMats[el], 10);
    assert.ok(ok.save.island.mana < save.island.mana);

    const maxed = runAwakenMonster(ok.save, "0");
    assert.match(maxed.message, /이미 각성/);

    const before = createStageBattle(getStage("garen_1_1")!, save);
    const after = createStageBattle(getStage("garen_1_1")!, ok.save);
    const allyBefore = before.units.find((u) => u.id === save.roster[0]!.uid);
    const allyAfter = after.units.find((u) => u.id === ok.save.roster[0]!.uid);
    assert.ok(allyBefore && allyAfter);
    assert.ok(allyAfter!.stats.atk > allyBefore!.stats.atk);
    assert.ok(allyAfter!.stats.hp > allyBefore!.stats.hp);
  });

  it("enhance randomly levels a skill", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      roster: save.roster.map((m, i) =>
        i === 0
          ? { ...m, level: 1, skillLevels: [1, 1, 1] as [number, number, number] }
          : m,
      ),
      island: { ...save.island, mana: 5000 },
    };
    const before = save.roster[0]!.skillLevels.slice() as [
      number,
      number,
      number,
    ];
    const enh = runEnhance(save, "0");
    assert.match(enh.message, /강화/);
    assert.equal(enh.save.roster[0]!.level, 2);
    const after = enh.save.roster[0]!.skillLevels;
    const bumped =
      after[0]! > before[0]! ||
      after[1]! > before[1]! ||
      after[2]! > before[2]!;
    assert.equal(bumped, true);
  });

  it("powers up from fodder EXP and levels a matching monster skill", () => {
    let save = createNewSave(0);
    const target = { ...save.roster[0]!, level: 1, exp: 0, skillLevels: [1, 1, 1] as [number, number, number] };
    const matching = {
      ...target,
      uid: "power-up-matching",
      level: 3,
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    const other = {
      ...save.roster[1]!,
      uid: "power-up-other",
      level: 2,
    };
    save = {
      ...save,
      roster: [target, matching, other],
      party: [target.uid, other.uid],
      island: { ...save.island, mana: 5000 },
    };

    const partyFodder = runPowerUpMonster(save, target.uid, [other.uid], () => 0);
    assert.match(partyFodder.message, /파티/);
    assert.equal(partyFodder.save.roster.some((m) => m.uid === other.uid), true);

    save = { ...save, party: [target.uid] };
    const result = runPowerUpMonster(save, target.uid, [matching.uid, other.uid], () => 0);

    const updated = result.save.roster.find((m) => m.uid === target.uid)!;
    assert.match(result.message, /EXP/);
    assert.ok(updated.level > target.level || (updated.exp ?? 0) > 0);
    assert.equal(updated.skillLevels[0], 2);
    assert.equal(result.save.roster.some((m) => m.uid === matching.uid), false);
    assert.equal(result.save.roster.some((m) => m.uid === other.uid), false);
  });

  it("feed same monster randomly skills up and consumes fodder", () => {
    let save = createNewSave(0);
    const base = save.roster[0]!;
    const fodder = {
      ...base,
      uid: "fodder-1",
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    save = {
      ...save,
      island: { ...save.island, mana: 5000 },
      skillMats: 10,
      roster: [
        { ...base, skillLevels: [1, 1, 1] as [number, number, number] },
        fodder,
        ...save.roster.slice(1),
      ],
    };
    const manaBefore = save.island.mana;
    const matsBefore = save.skillMats;
    const r = runFeedSameMonster(save, base.uid, fodder.uid);
    assert.match(r.message, /스킬업/);
    assert.equal(r.save.roster.some((m) => m.uid === fodder.uid), false);
    const t = r.save.roster.find((m) => m.uid === base.uid)!;
    assert.ok(t.skillLevels.some((lv) => lv > 1));
    assert.ok(r.save.island.mana < manaBefore);
    assert.equal(r.save.skillMats, matsBefore - 3);
  });

  it("skills up S2 when level and mana met", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      roster: save.roster.map((m, i) =>
        i === 0
          ? { ...m, level: 5, skillLevels: [1, 1, 1] as [number, number, number] }
          : m,
      ),
      island: { ...save.island, mana: 3000 },
      skillMats: 10,
    };
    const blocked = runSkillUp(
      {
        ...save,
        roster: save.roster.map((m, i) =>
          i === 0 ? { ...m, level: 3 } : m,
        ),
      },
      "0",
      1,
    );
    assert.match(blocked.message, /조건 미달/);

    const ok = runSkillUp(save, "0", 1);
    assert.match(ok.message, /스킬업/);
    assert.equal(ok.save.roster[0]!.skillLevels[1], 2);
    assert.ok(ok.save.island.mana < save.island.mana);
    assert.equal(ok.save.skillMats, 7);
  });

  it("buys scrolls and imprints symbol slots 2/4/6", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      island: { ...save.island, mana: 2000, crystal: 40 },
      imprintStones: 3,
    };
    const buy = runBuyScroll(save, 2);
    assert.match(buy.message, /소환서 2장/);
    assert.equal(buy.save.scrolls, save.scrolls + 2);
    save = buy.save;

    const slot4 = { ...createSymbol("hwalro", 4, "imp_test"), mainStat: "CRI Dmg%", mainValue: 11 };
    const slot2 = { ...createSymbol("hwalro", 2, "imp_s2"), mainStat: "ATK%", mainValue: 11 };
    save = { ...save, symbols: [...save.symbols, slot4, slot2] };
    const blocked = runImprintSymbol(save, "0"); // slot 1 starter
    assert.match(blocked.message, /각인 불가/);

    const ok = runImprintSymbol(save, "imp_test", () => 0.9);
    assert.match(ok.message, /각인/);
    assert.equal(ok.save.imprintStones, save.imprintStones - 1);
    const updated = ok.save.symbols.find((s) => s.id === "imp_test")!;
    assert.ok(
      updated.mainStat !== "CRI Dmg%" || updated.mainValue !== 11,
    );

    const ok2 = runImprintSymbol(ok.save, "imp_s2", () => 0.9);
    assert.match(ok2.message, /각인/);
    assert.equal(ok2.save.imprintStones, ok.save.imprintStones - 1);
  });

  it("grinds symbol prefix for mana and grindstone", () => {
    let save = createNewSave(0);
    const bare = {
      ...save.symbols[0]!,
      substats: [] as { stat: string; value: number }[],
      prefixStat: null as string | null,
      prefixValue: null as number | null,
    };
    save = {
      ...save,
      symbols: [bare, ...save.symbols.slice(1)],
      island: { ...save.island, mana: 500 },
      grindstones: 3,
    };
    const ok = runGrindSymbol(save, "0", () => 0);
    assert.match(ok.message, /연마/);
    assert.equal(ok.save.island.mana, save.island.mana - 150);
    assert.equal(ok.save.grindstones, 2);
    const sym = ok.save.symbols[0]!;
    assert.ok(sym.prefixStat);
    assert.ok((sym.prefixValue ?? 0) > 0);

    const noStone = runGrindSymbol(
      { ...ok.save, grindstones: 0 },
      "0",
      () => 0,
    );
    assert.match(noStone.message, /연마석/);
  });

  it("enhances substat with grindstone when subs exist", () => {
    let save = createNewSave(0);
    const withSubs = {
      ...save.symbols[0]!,
      substats: [
        { stat: "SPD+", value: 4 },
        { stat: "ATK%", value: 5 },
      ],
    };
    save = {
      ...save,
      symbols: [withSubs, ...save.symbols.slice(1)],
      island: { ...save.island, mana: 500 },
      grindstones: 2,
    };
    const before = withSubs.substats[0]!.value;
    const ok = runGrindSymbol(save, "0", () => 0);
    assert.match(ok.message, /부옵션/);
    assert.equal(ok.save.grindstones, 1);
    const next = ok.save.symbols[0]!;
    assert.ok((next.substats?.[0]?.value ?? 0) > before);
  });

  it("claims mailbox and daily wish mission rewards", () => {
    let save = createNewSave(0);
    assert.equal(unclaimedMailCount(save), 2);
    const mail = runClaimMail(save, "welcome_gift");
    assert.match(mail.message, /우편/);
    assert.equal(mail.save.island.mana, save.island.mana + 500);
    assert.deepEqual(mail.save.claimedMailIds, ["welcome_gift"]);
    save = mail.save;
    assert.equal(unclaimedMailCount(save), 1);

    const login = runClaimMail(save, "login_gift");
    assert.ok(login.save.island.energy >= save.island.energy);
    assert.equal(unclaimedMailCount(login.save), 0);

    const overflowBase = {
      ...login.save,
      claimedMailIds: [] as string[],
      island: {
        ...login.save.island,
        energy: login.save.island.energyMax ?? 100,
        energyMax: login.save.island.energyMax ?? 100,
      },
    };
    const overflow = runClaimMail(overflowBase, "login_gift");
    assert.equal(
      overflow.save.island.energy,
      (overflowBase.island.energyMax ?? 100) + 20,
    );
    assert.ok(overflow.save.island.energy > (overflow.save.island.energyMax ?? 100));

    const day = "2099-01-15";
    save = {
      ...login.save,
      island: {
        ...login.save.island,
        lastWishDay: day,
        mana: 100,
        energy: 50,
        energyMax: 100,
      },
      claimedMissionKeys: [],
    };
    const blocked = runClaimDailyMission(save, "wish", Date.parse(`${day}T12:00:00Z`));
    // wish done — should claim
    assert.match(blocked.message, /일일 미션/);
    assert.equal(blocked.save.island.mana, 300);
    assert.equal(blocked.save.island.energy, 60);
    const again = runClaimDailyMission(
      blocked.save,
      "wish",
      Date.parse(`${day}T12:00:00Z`),
    );
    assert.match(again.message, /이미/);

    save = {
      ...blocked.save,
      dojoDrillDay: day,
      dojoDrillsToday: 1,
      claimedMissionKeys: blocked.save.claimedMissionKeys,
      island: { ...blocked.save.island, mana: 100, energy: 40, energyMax: 100 },
    };
    const dojo = runClaimDailyMission(
      save,
      "dojo",
      Date.parse(`${day}T12:00:00Z`),
    );
    assert.match(dojo.message, /일일 미션/);
    assert.equal(dojo.save.island.mana, 250);
  });

  it("claims one-time main quest rewards from stages and cairos", () => {
    let save = createNewSave(0);
    assert.equal(claimableMainQuestCount(save), 0);
    assert.equal(isMainQuestUnlocked(save, "forest1"), true);
    assert.equal(isMainQuestUnlocked(save, "forest3"), false);

    const blocked = runClaimMainQuest(save, "forest1");
    assert.match(blocked.message, /완료되지 않았습니다/);

    save = { ...save, clearedStages: ["garen_1_1"] };
    assert.equal(isMainQuestComplete(save, "forest1"), true);
    assert.equal(isMainQuestUnlocked(save, "forest3"), true);
    assert.equal(claimableMainQuestCount(save), 1);

    const claimed = runClaimMainQuest(save, "forest1");
    assert.match(claimed.message, /메인 퀘스트/);
    assert.equal(claimed.save.island.mana, save.island.mana + 300);
    assert.ok(claimed.save.claimedMainQuestIds.includes("forest1"));
    const again = runClaimMainQuest(claimed.save, "forest1");
    assert.match(again.message, /이미/);

    save = {
      ...claimed.save,
      clearedStages: ["garen_1_1", "garen_1_3", "garen_1_5", "giant_b1"],
      grindstones: 1,
    };
    assert.equal(isMainQuestUnlocked(save, "giantB1"), true);
    const giant = runClaimMainQuest(save, "giantB1");
    assert.match(giant.message, /연마석/);
    assert.equal(giant.save.grindstones, 2);
  });

  it("raises energy max and unlocks buildings on account level-up", () => {
    let save = createNewSave(0);
    assert.equal(save.island.energyMax, 100);
    // Level active summoner from 6 → 7 to unlock wish_temple (+2 energy max).
    // SW curve: Lv.6→7 needs 3110 EXP; leave a little room so one Normal clear tips it.
    save = {
      ...save,
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, level: 6, exp: 3050 },
      },
      island: {
        ...save.island,
        summonerLevel: 6,
        energyMax: 100 + (6 - 1) * 2,
      },
    };
    const beforeMax = save.island.energyMax;
    const stage = getStage("garen_1_1")!;
    const { save: next, reward } = applyRewards(save, stage, true, () => 0.99);
    assert.ok((reward.levelsGained ?? 0) >= 1);
    assert.ok(next.island.energyMax >= beforeMax + 2);
    assert.ok(next.island.buildings.some((b) => b.id === "wish_temple"));
    assert.ok((reward.unlockedBuildingIds ?? []).includes("wish_temple"));

    // Non-max element level-up should not raise account energy max.
    save = {
      ...next,
      activeSummoner: "fire",
      summoners: {
        ...next.summoners,
        light: { ...next.summoners.light, level: 10 },
        fire: { ...next.summoners.fire, level: 3, exp: 90 },
      },
      island: {
        ...next.island,
        summonerLevel: 10,
        energyMax: 100 + (10 - 1) * 2,
      },
    };
    const capped = applyRewards(save, stage, true, () => 0.99);
    assert.equal(capped.save.island.energyMax, save.island.energyMax);
  });

  it("uses Summoners War account and monster EXP curves with difficulty scaling", () => {
    const stage = getStage("garen_1_1")!;
    assert.equal(expForStage(stage, "normal"), 68);
    assert.equal(expForStage(stage, "hard"), Math.round(68 * 6.96));
    assert.equal(expForStage(stage, "hell"), Math.round(68 * 14.61));

    const mon = {
      uid: "t1",
      monsterId: "cinder_imp_fire",
      level: 1,
      exp: 0,
      symbolSlots: [null, null, null, null, null, null] as (
        | string
        | null
      )[],
      evolve: 0,
      awaken: 0,
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    assert.equal(monsterMaxLevel(mon), 15);
    assert.equal(monsterExpToNext(mon), 460);
    const leveled = addOwnedMonsterExp(mon, 460);
    assert.equal(leveled.monster.level, 2);
    assert.equal(leveled.monster.exp, 0);

    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, energy: 50 } };
    const hardLocked = applyRewards(save, stage, true, () => 0.99, "normal");
    assert.ok(hardLocked.save.clearedStages.includes("garen_1_1"));
    assert.equal(hardLocked.save.clearedHardStages.includes("garen_1_1"), false);
    const hardClear = applyRewards(
      hardLocked.save,
      stage,
      true,
      () => 0.99,
      "hard",
    );
    assert.ok(hardClear.save.clearedHardStages.includes("garen_1_1"));
    assert.ok((hardClear.reward.summonerExp ?? 0) > (hardLocked.reward.summonerExp ?? 0));
  });

  it("opens scenario hard only after every stage on the map is cleared on normal", () => {
    const first = getStage("garen_1_1")!;
    const boss = getStage("garen_1_7")!;
    const map2 = getStage("tower_2_1")!;
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, energy: 50 } };

    assert.equal(isDifficultyOpen(save, first, "normal"), true);
    assert.equal(isDifficultyOpen(save, first, "hard"), false);
    const blocked = runSortie(save, "garen_1_1", {
      rng: () => 0.1,
      difficulty: "hard",
    });
    assert.match(blocked.message, /난이도/);

    save = { ...save, clearedStages: ["garen_1_1"] };
    assert.equal(isDifficultyOpen(save, first, "hard"), false);

    const chapter1Ids = CHAPTER1_STAGES.map((s) => s.id);
    save = { ...save, clearedStages: chapter1Ids };
    assert.equal(isDifficultyOpen(save, first, "hard"), true);
    assert.equal(isDifficultyOpen(save, boss, "hard"), true);
    assert.equal(isDifficultyOpen(save, map2, "hard"), false);
    assert.equal(isDifficultyOpen(save, first, "hell"), false);

    save = { ...save, clearedHardStages: chapter1Ids };
    assert.equal(isDifficultyOpen(save, first, "hell"), true);
    assert.equal(isDifficultyOpen(save, map2, "hell"), false);
  });

  it("scenario normal drops almost only ★1 symbols (rare ★2)", () => {
    const stage = getStage("garen_1_1")!;
    let ones = 0;
    let twos = 0;
    let threes = 0;
    let high = 0;
    for (let seed = 0; seed < 60; seed++) {
      let n = 0;
      const rng = () => {
        n += 1;
        if (n === 1) return 0;
        return ((seed * 13 + n * 97) % 1000) / 1000;
      };
      const save = createNewSave(0);
      const { reward } = applyRewards(
        { ...save, island: { ...save.island, energy: 50 }, symbols: [] },
        stage,
        true,
        rng,
        "normal",
      );
      const stars = reward.symbol?.stars;
      if (stars == null) continue;
      if (stars === 1) ones += 1;
      else if (stars === 2) twos += 1;
      else if (stars === 3) threes += 1;
      else high += 1;
      const gearStars = reward.gear?.stars;
      if (gearStars != null) {
        assert.ok(gearStars >= 1 && gearStars <= 3);
      }
      if (reward.symbol) {
        assert.ok(
          reward.symbol.quality === "normal" ||
            reward.symbol.quality === "advanced" ||
            reward.symbol.quality === "rare",
        );
      }
    }
    assert.equal(high, 0);
    assert.ok(ones + twos + threes >= 50);
    assert.ok(ones > twos + threes);
  });

  it("summons and enhances monsters", () => {
    let save = createNewSave(0);
    assert.equal(save.roster.length, 4);
    assert.equal(save.scrolls, 5);

    const sum = runSummon(save, "normal", () => 0.1);
    assert.match(sum.message, /소환 성공/);
    assert.equal(sum.save.scrolls, 4);
    assert.equal(sum.save.roster.length, 5);
    save = sum.save;

    const premBefore = save.scrollsPremium ?? 0;
    const prem = runSummon(save, "premium", () => 0.2);
    assert.match(prem.message, /소환 성공/);
    assert.equal(prem.save.scrollsPremium, premBefore - 1);
    save = prem.save;

    const before = save.roster[0]!.level;
    const enh = runEnhance(save, "0");
    assert.match(enh.message, /강화/);
    assert.equal(enh.save.roster[0]!.level, before + 1);
    assert.ok(enh.save.island.mana < save.island.mana);
  });

  it("runs a 10-pull summon when scrolls allow", () => {
    let save = createNewSave(0);
    save = { ...save, scrolls: 12 };
    const multi = runSummon(save, "normal", () => 0.15, 10);
    assert.match(multi.message, /10연 소환/);
    assert.equal(multi.save.scrolls, 2);
    assert.equal(multi.save.roster.length, save.roster.length + 10);

    const short = runSummon(multi.save, "normal", () => 0.2, 10);
    assert.match(short.message, /부족/);
    assert.equal(short.save.scrolls, 2);
  });

  it("starts with no summoner gear equipped", () => {
    const save = createNewSave(0);
    assert.equal(save.gear.weapon, null);
    assert.equal(save.gear.top, null);
    assert.equal(save.gear.bottom, null);
    assert.equal(save.gear.shoes, null);
    assert.equal(save.gear.ring, null);
    assert.equal(save.gear.necklace, null);
    assert.equal(save.summoners.fire.gear?.weapon, null);
    assert.equal(listGear(save).length, 9);
    assert.match(listGear(save)[0]!, /미장착/);
  });

  it("enhances gear and symbols, equips drops", () => {
    let save = withActiveGear(createNewSave(0), createStarterGear("light"));
    assert.ok(save.gear.weapon);
    assert.ok(save.gear.top);
    assert.ok(save.gear.shoes);
    assert.equal(save.gear.weapon.element, "light");
    assert.equal(listGear(save).length, 9);
    assert.ok(listSymbols(save).length >= 2);

    const g = runEnhanceGear(save, "necklace");
    assert.match(g.message, /장비 강화/);
    assert.equal(g.save.gear.necklace?.enhance, 1);
    save = g.save;

    const w = runEnhanceGear(save, "weapon");
    assert.match(w.message, /장비 강화/);
    assert.equal(w.save.gear.weapon?.enhance, 1);
    assert.ok(
      (w.save.gear.weapon?.skillPowerBonus ?? 0) >
        (save.gear.weapon?.skillPowerBonus ?? 0),
    );
    save = w.save;

    const bottom = runEnhanceGear(save, "bottom");
    assert.match(bottom.message, /장비 강화/);
    assert.equal(bottom.save.gear.bottom?.enhance, 1);
    assert.ok(
      (bottom.save.gear.bottom?.leaderAtkBonus ?? 0) >
        (save.gear.bottom?.leaderAtkBonus ?? 0),
    );
    save = bottom.save;

    const ring = runEnhanceGear(save, "ring");
    assert.match(ring.message, /장비 강화/);
    assert.equal(ring.save.gear.ring?.enhance, 1);
    assert.ok(
      (ring.save.gear.ring?.leaderAtkBonus ?? 0) >
        (save.gear.ring?.leaderAtkBonus ?? 0),
    );
    save = ring.save;

    // Late enhance (+12) needs crystals (mutate active summoner gear, not legacy mirror alone)
    save = withActiveGear(
      { ...save, island: { ...save.island, mana: 50_000, crystal: 0 } },
      {
        ...getActiveGear(save),
        weapon: { ...getActiveGear(save).weapon!, enhance: 12 },
      },
    );
    const needCrystal = runEnhanceGear(save, "weapon");
    assert.match(needCrystal.message, /크리스탈/);
    save = {
      ...save,
      island: { ...save.island, crystal: 5 },
    };
    const late = runEnhanceGear(save, "weapon");
    assert.match(late.message, /크리스탈/);
    assert.equal(late.save.gear.weapon?.enhance, 13);
    assert.equal(late.save.island.crystal, 4);
    save = late.save;

    save = {
      ...save,
      gearBag: [{ ...save.gear.weapon!, enhance: 15, id: "sell_hi" }],
      island: { ...save.island, crystal: 0 },
    };
    const sold = runSellGearBag(save, 0);
    assert.match(sold.message, /크리스탈/);
    assert.equal(sold.save.island.crystal, 3);
    assert.ok(sold.save.island.mana > save.island.mana);
    save = { ...sold.save, gearBag: [] };

    const affix = runAffixGearSet(save, "necklace", "mana");
    assert.match(affix.message, /세트 부여/);
    assert.equal(affix.save.gear.necklace?.setId, "mana");
    assert.ok(affix.save.island.mana < save.island.mana);
    save = affix.save;

    const se = runEnhanceSymbol(save, "0");
    assert.match(se.message, /상징 강화/);
    assert.equal(se.save.symbols[0]!.enhance, 1);
    save = se.save;

    // Drop a symbol then equip on monster 1
    save = {
      ...save,
      symbols: [
        ...save.symbols,
        {
          id: "extra_s3",
          setId: "hwalro",
          slot: 3,
          stars: 6,
          enhance: 0,
          mainStat: "DEF+",
          mainValue: 22,
        },
      ],
    };
    const eq = runEquipSymbol(save, "1", String(save.symbols.length - 1));
    assert.match(eq.message, /장착/);
    assert.equal(eq.save.roster[1]!.symbolSlots[2], "extra_s3");
    const uq = runUnequipSymbol(eq.save, "1", 3);
    assert.match(uq.message, /해제/);
    assert.equal(uq.save.roster[1]!.symbolSlots[2], null);
  });

  it("awakens summoner with level/mana/crystal/elemental-essence gates", () => {
    let save = createNewSave(0);
    assert.equal(save.summonerAwaken, 0);
    assert.equal(awakenManaCost(0), 500);
    assert.equal(awakenCrystalCost(0), 3);
    assert.equal(summonerAwakenMatCost(0), 8);
    assert.equal(awakenMinLevel(0), 5);
    assert.equal(awakenLeaderAtkPct(2), 0.024);

    const locked = runAwakenSummoner(save);
    assert.match(locked.message, /해금|Lv/);
    assert.equal(locked.save.summonerAwaken, 0);

    save = {
      ...save,
      island: {
        ...save.island,
        mana: 2000,
        crystal: 20,
      },
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, level: 5 },
      },
      awakenMats: { light: summonerAwakenMatCost(0) },
    };
    const ok = runAwakenSummoner(save);
    assert.match(ok.message, /각성 \+1/);
    assert.equal(ok.save.summonerAwaken, 1);
    assert.equal(ok.save.summoners.light.awaken, 1);
    assert.equal(ok.save.island.mana, 2000 - 500);
    assert.equal(ok.save.island.crystal, 20 - 3);
    assert.equal(ok.save.awakenMats.light, 0);
    save = ok.save;

    const battle = createStageBattle(getStage("garen_1_1")!, {
      ...save,
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, awaken: 3 },
      },
    });
    const allySum = battle.units.find(
      (u) => u.kind === "summoner" && u.team === "ally",
    )!;
    assert.match(allySum.name, /각성3/);
    assert.ok(battle.allySummoner.skillPowerBonus >= 0.075);
    assert.ok(battle.allySummoner.manaMax >= 100 + 24);

    save = {
      ...save,
      island: { ...save.island, mana: 99999, crystal: 99 },
      summoners: {
        ...save.summoners,
        light: {
          ...save.summoners.light,
          level: 99,
          awaken: MAX_SUMMONER_AWAKEN,
        },
      },
    };
    const maxed = runAwakenSummoner(save);
    assert.match(maxed.message, /최대/);
    assert.equal(maxed.save.summonerAwaken, MAX_SUMMONER_AWAKEN);
  });

  it("switches active summoner per element", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      summoners: {
        ...save.summoners,
        fire: { level: 4, exp: 20, awaken: 1 },
        light: { level: 2, exp: 10, awaken: 0 },
      },
    };
    save = setActiveSummoner(save, "fire");
    assert.equal(save.activeSummoner, "fire");
    assert.equal(save.summonerAwaken, 1);
    assert.equal(save.island.summonerExp, 20);
    assert.equal(save.island.summonerLevel, 4);
    const battle = createStageBattle(getStage("garen_1_1")!, save);
    const allySum = battle.units.find(
      (u) => u.kind === "summoner" && u.team === "ally",
    )!;
    assert.match(allySum.name, /화염/);
    assert.equal(allySum.element, "fire");
  });

  it("unlocks summoner skill tree nodes with gates", () => {
    let save = createNewSave(0);
    assert.deepEqual(save.skillTree, []);
    const locked = runUnlockSkillNode(save, "root_mana");
    assert.match(locked.message, /Lv/);

    save = {
      ...save,
      island: { ...save.island, summonerLevel: 3, mana: 5000, crystal: 10 },
    };
    const root = runUnlockSkillNode(save, "root_mana");
    assert.match(root.message, /진액 회로/);
    assert.deepEqual(root.save.skillTree, ["root_mana"]);
    save = root.save;

    const need = runUnlockSkillNode(save, "mana_pool");
    assert.match(need.message, /Lv/);
    save = {
      ...save,
      island: { ...save.island, summonerLevel: 6 },
    };
    const mid = runUnlockSkillNode(save, "mana_pool");
    assert.match(mid.message, /심연 저장/);
    assert.ok(mid.save.skillTree.includes("mana_pool"));
    save = mid.save;

    const apexGate = runUnlockSkillNode(save, "abyss_well");
    assert.match(apexGate.message, /Lv/);
    save = {
      ...save,
      island: { ...save.island, summonerLevel: 10, crystal: 20 },
    };
    const apex = runUnlockSkillNode(save, "abyss_well");
    assert.match(apex.message, /심연 우물/);
    assert.ok(apex.save.skillTree.includes("abyss_well"));

    const battle = createStageBattle(getStage("garen_1_1")!, apex.save);
    assert.ok(battle.allySummoner.manaMax >= 100 + 12 + 20);
    assert.ok((battle.allySummoner.manaRegenPerTick ?? 0) >= 0.9);
  });

  it("scales enemy summoner pressure by stage", () => {
    const save = createNewSave(0);
    const early = createStageBattle(getStage("garen_1_1")!, save);
    const mid = createStageBattle(getStage("garen_1_4")!, save);
    const arena = createStageBattle(getStage("arena_veteran")!, save);
    assert.ok(
      mid.enemySummoner.manaRegenPerTick > early.enemySummoner.manaRegenPerTick,
    );
    assert.ok(mid.enemySummoner.boardSense > early.enemySummoner.boardSense);
    assert.ok(arena.enemySummoner.boardSense > early.enemySummoner.boardSense);
    assert.ok((arena.enemySummoner.skillPowerBonus ?? 0) > 0);
  });

  it("lists roster", () => {
    const lines = listRoster(createNewSave(0));
    assert.equal(lines.length, 4);
    assert.match(lines[0]!, /불꽃잡이|Lv/);
  });

  it("demo loop completes full home cycle", () => {
    const steps = runDemoLoop(() => 0.1);
    assert.equal(steps.length, 7);
    assert.match(steps[0]!.message, /골드/);
    assert.match(steps[1]!.message, /소환/);
    assert.match(steps[2]!.message, /강화/);
    assert.match(steps[3]!.message, /장비/);
    assert.match(steps[4]!.message, /상징/);
    assert.match(steps[5]!.message, /승리|패배/);
    assert.match(steps[6]!.message, /골드/);
  });

  it("rejects equipping a weapon for the wrong summoner element", () => {
    let save = withActiveGear(createNewSave(0), createStarterGear("light"));
    assert.equal(save.activeSummoner, "light");
    const fireWeapon = {
      ...createStarterGear("fire").weapon!,
      id: "bag_fire_wpn",
      enhance: 0,
    };
    save = { ...save, gearBag: [fireWeapon] };
    const blocked = runEquipGearBag(save, 0);
    assert.match(blocked.message, /전용/);
    assert.equal(blocked.save.gearBag?.length, 1);
    assert.equal(blocked.save.gear.weapon?.id, save.gear.weapon?.id);

    save = setActiveSummoner(blocked.save, "fire");
    const ok = runEquipGearBag(save, 0);
    assert.match(ok.message, /장착/);
    assert.equal(ok.save.gear.weapon?.id, "bag_fire_wpn");
    assert.equal(ok.save.gear.weapon?.element, "fire");
  });

  it("keeps separate gear sets per summoner element", () => {
    let save = withActiveGear(createNewSave(0), createStarterGear("light"));
    const lightWpn = save.gear.weapon!.id;
    save = withActiveGear(save, {
      ...getActiveGear(save),
      weapon: { ...getActiveGear(save).weapon!, enhance: 3 },
    });
    assert.equal(save.gear.weapon?.enhance, 3);

    save = setActiveSummoner(save, "water");
    assert.equal(save.activeSummoner, "water");
    assert.equal(save.gear.weapon, null);

    save = withActiveGear(save, createStarterGear("water"));
    assert.equal(save.gear.weapon?.element, "water");
    assert.equal(save.gear.weapon?.enhance, 0);
    assert.notEqual(save.gear.weapon?.id, lightWpn);

    save = setActiveSummoner(save, "light");
    assert.equal(save.gear.weapon?.enhance, 3);
    assert.equal(save.gear.weapon?.id, lightWpn);
  });

  it("sets arena defense and caps daily arena attacks", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3"],
      island: { ...save.island, summonerLevel: 5, energy: 50 },
    };
    const def = runSetArenaDefense(save);
    assert.ok(def.save.arenaDefense);
    assert.equal(def.save.arenaDefense!.party.length, save.party.length);
    save = { ...def.save, arenaAttacksToday: ARENA_ATTACKS_DAILY, arenaAttackDay: "2099-01-01" };
    const blocked = runSortie(save, "arena_rookie", {
      rng: () => 0.1,
      now: Date.parse("2099-01-01T12:00:00Z"),
    });
    assert.match(blocked.message, /한도/);
  });

  it("rotates daily shop offers and marks sold", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, mana: 50_000, crystal: 100 } };
    const offers = getDailyShopOffers("2099-06-01");
    assert.ok(offers.length >= 4 && offers.length <= 6);
    const offer = offers[0]!;
    const bought = runBuyShopOffer(save, offer.id, Date.parse("2099-06-01T12:00:00Z"), () => 0.2);
    assert.ok(bought.save.shopSoldIds.includes(offer.id));
    const again = runBuyShopOffer(
      bought.save,
      offer.id,
      Date.parse("2099-06-01T12:00:00Z"),
      () => 0.2,
    );
    assert.match(again.message, /이미 구매/);
  });

  it("buys grindstones from the shop for crystal", () => {
    let save = createNewSave(0);
    const before = save.grindstones ?? 0;
    save = { ...save, island: { ...save.island, crystal: 100 } };
    const bought = runBuyGrindstone(save, 2);
    assert.match(bought.message, /연마석/);
    assert.equal(bought.save.grindstones, before + 2);
    assert.equal(
      bought.save.island.crystal,
      100 - GRINDSTONE_BUY_CRYSTAL_COST * 2,
    );
  });

  it("sells premium scrolls for crystal and enforces catalog daily limits", () => {
    const now = Date.parse("2099-07-01T12:00:00Z");
    let save = createNewSave(0);
    save = {
      ...save,
      island: { ...save.island, mana: 50_000, crystal: 500 },
    };
    const premium = runBuyScroll(save, 1, "premium", now);
    assert.match(premium.message, /크리스탈/);
    assert.equal(
      premium.save.island.crystal,
      500 - SCROLL_PREMIUM_BUY_CRYSTAL_COST,
    );
    assert.equal(premium.save.scrollsPremium, (save.scrollsPremium ?? 0) + 1);
    assert.equal(catalogShopRemaining(premium.save, "scroll_premium", now), 2);

    save = {
      ...premium.save,
      shopBuyCounts: { ...premium.save.shopBuyCounts, scroll_premium: 3 },
    };
    const blocked = runBuyScroll(save, 1, "premium", now);
    assert.match(blocked.message, /한도/);
    assert.equal(blocked.save.island.crystal, save.island.crystal);

    const nextDay = runBuyScroll(
      blocked.save,
      1,
      "premium",
      Date.parse("2099-07-02T12:00:00Z"),
    );
    assert.match(nextDay.message, /크리스탈/);
    assert.equal(catalogShopBoughtToday(nextDay.save, "scroll_premium", Date.parse("2099-07-02T12:00:00Z")), 1);
  });

  it("chains trial floors and grants B3 token", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: ["garen_1_5", "trial_b1", "trial_b2"],
      island: { ...save.island, energy: 40 },
    };
    assert.equal(isStageUnlocked(save, "trial_b3"), true);
    const stage = getStage("trial_b3")!;
    const { save: next, reward } = applyRewards(save, stage, true, () => 0.9);
    assert.ok(reward.victory);
    assert.equal(next.trialTokens, 1);
    assert.equal(next.trialTitleUnlocked, true);
  });

  it("runs recipe fusion with matching fodder", () => {
    const recipe = FUSION_RECIPES[0]!;
    let save = createNewSave(0);
    const keeper = save.roster[0]!;
    const fodder = recipe.fodderMonsterIds.map((monsterId, i) => ({
      ...keeper,
      uid: `fodder_${i}`,
      monsterId,
      level: 1,
      evolve: 0,
    }));
    save = {
      ...save,
      island: { ...save.island, mana: 5000, summonerLevel: 1 },
      roster: [keeper, ...fodder],
    };
    const r = runRecipeFusion(
      save,
      recipe.id,
      fodder.map((m) => m.uid),
    );
    assert.match(r.message, /조합/);
    assert.equal(r.save.roster.length, 2);
    assert.ok(r.save.roster.some((m) => m.uid === keeper.uid));
    const made = r.save.roster.find((m) => m.uid === r.fusedUid);
    assert.equal(made?.monsterId, recipe.resultMonsterId);
    assert.equal(isFusionOnlyFamily("magma_knight"), true);
    assert.equal(isFusionOnlyFamily("cinder_imp"), false);
  });

  it("blocks locked combination recipes until summoner level", () => {
    const recipe = FUSION_RECIPES.find((x) => x.id === "recipe_dragon_knight")!;
    let save = createNewSave(0);
    const keeper = save.roster[0]!;
    const fodder = recipe.fodderMonsterIds.map((monsterId, i) => ({
      ...keeper,
      uid: `fodder_hi_${i}`,
      monsterId,
      level: 1,
      evolve: 0,
    }));
    save = {
      ...save,
      island: { ...save.island, mana: 20_000, summonerLevel: 8 },
      roster: [keeper, ...fodder],
    };
    const blocked = runRecipeFusion(
      save,
      recipe.id,
      fodder.map((m) => m.uid),
    );
    assert.match(blocked.message, /Lv\.17/);
  });

  it("tracks guild weekly contrib chest and raid boss hp", () => {
    let save = createNewSave(0);
    const now = Date.parse("2099-03-03T12:00:00Z");
    const weekKey = isoWeekKey(now);
    save = {
      ...save,
      island: { ...save.island, summonerLevel: 12 },
      guildName: "테스트길드",
      guildWeekKey: weekKey,
      guildWeekContrib: GUILD_WEEK_CONTRIB_GOAL - 15,
      guildChestClaimedWeek: null,
      raidBossHp: RAID_BOSS_MAX_HP,
      raidAttemptsDay: 0,
      raidAttemptDay: null,
      raidWeekKey: weekKey,
      clearedStages: ["garen_1_5"],
    };
    const joined = runJoinGuild(save, "테스트길드");
    save = joined.save;
    const check = runGuildCheckIn(save, now);
    assert.ok((check.save.guildWeekContrib ?? 0) >= GUILD_WEEK_CONTRIB_GOAL);
    assert.equal(check.save.guildChestClaimedWeek, weekKey);
    assert.ok((check.save.island.crystal ?? 0) >= save.island.crystal);

    save = {
      ...check.save,
      island: { ...check.save.island, energy: 50 },
      raidBossHp: RAID_BOSS_MAX_HP,
      raidAttemptsDay: 0,
      raidAttemptDay: "2099-03-03",
      raidWeekKey: weekKey,
    };
    const raid = runSortie(save, "guild_raid_boss", {
      rng: () => 0.05,
      now,
      maxTurns: 120,
    });
    assert.ok(raid.save.raidAttemptsDay >= 1);
    if (raid.reward?.victory) {
      assert.ok((raid.save.raidBossHp ?? RAID_BOSS_MAX_HP) < RAID_BOSS_MAX_HP);
    }
    save = {
      ...raid.save,
      raidAttemptsDay: RAID_ATTEMPTS_DAILY,
      raidAttemptDay: "2099-03-03",
    };
    const capped = runSortie(save, "guild_raid_boss", {
      rng: () => 0.05,
      now: Date.parse("2099-03-03T13:00:00Z"),
    });
    assert.match(capped.message, /한도/);
  });

  it("migrateSave preserves presets, premium scrolls, summoners, awaken", () => {
    const base = createNewSave(0);
    const raw = {
      ...base,
      scrollsPremium: 7,
      scrollsMystic: 3,
      activeSummoner: "fire" as const,
      activePartyPreset: 2,
      partyPresets: [
        { summoner: "fire" as const, party: [...base.party] },
        { summoner: "water" as const, party: [] as string[] },
        { summoner: "wind" as const, party: [...base.party].slice(0, 2) },
        { summoner: "light" as const, party: [] as string[] },
        { summoner: "dark" as const, party: [] as string[] },
      ],
      summoners: {
        ...base.summoners,
        fire: { ...base.summoners.fire, level: 12, awaken: 2 },
      },
      roster: base.roster.map((m, i) =>
        i === 0 ? { ...m, awaken: 1 as const } : m,
      ),
      skillMats: 9,
      awakenMats: { fire: 4 },
    };
    const round = migrateSave(JSON.parse(JSON.stringify(raw)));
    assert.ok(round);
    assert.equal(round!.scrollsPremium, 7);
    assert.equal(round!.scrollsMystic, 3);
    assert.equal(round!.activeSummoner, "fire");
    assert.equal(round!.activePartyPreset, 2);
    assert.equal(round!.partyPresets[2]?.summoner, "wind");
    assert.equal(round!.partyPresets[2]?.party.length, 2);
    assert.equal(round!.summoners.fire.level, 12);
    assert.equal(round!.roster[0]?.awaken, 1);
    assert.equal(round!.skillMats, 9);
    assert.equal(round!.awakenMats.fire, 4);
    assert.equal(round!.grindstones, base.grindstones);
    assert.deepEqual(round!.claimedMailIds, []);
    assert.deepEqual(round!.claimedMissionKeys, []);
    assert.deepEqual(round!.claimedMainQuestIds, []);
    assert.equal(round!.onboardRite, null);
  });

  it("migrateSave strips unenhanced default starter gear", () => {
    const base = createNewSave(0);
    const raw = {
      ...base,
      gear: createStarterGear("light"),
      summoners: {
        ...base.summoners,
        light: { ...base.summoners.light, gear: createStarterGear("light") },
        fire: { ...base.summoners.fire, gear: createStarterGear("fire") },
      },
    };
    const round = migrateSave(JSON.parse(JSON.stringify(raw)));
    assert.ok(round);
    assert.equal(round!.gear.weapon, null);
    assert.equal(round!.summoners.light.gear?.weapon, null);
    assert.equal(round!.summoners.fire.gear?.top, null);
    const enhanced = {
      ...createStarterGear("light"),
      weapon: { ...createStarterGear("light").weapon!, enhance: 2 },
    };
    const kept = migrateSave(
      JSON.parse(
        JSON.stringify({
          ...base,
          gear: enhanced,
          summoners: {
            ...base.summoners,
            light: { ...base.summoners.light, gear: enhanced },
          },
        }),
      ),
    );
    assert.equal(kept?.gear.weapon?.enhance, 2);
    assert.equal(kept?.gear.top, null);
  });

  it("migrateSave preserves onboardRite checkpoint", () => {
    const base = createNewSave(0);
    const rite = {
      step: "party",
      openedStages: true,
      openedRegion: true,
      summoned: true,
      enhanced: true,
      partySet: false,
      equipped: false,
      hasBattleDrop: true,
      welcomeSeen: true,
    };
    const round = migrateSave(
      JSON.parse(JSON.stringify({ ...base, onboardRite: rite })),
    );
    assert.ok(round);
    assert.deepEqual(round!.onboardRite, rite);
    const cleared = migrateSave(
      JSON.parse(JSON.stringify({ ...base, onboardRite: "bad" })),
    );
    assert.ok(cleared);
    assert.equal(cleared!.onboardRite, null);
  });

  it("saves summoner magic loadout with a party preset", () => {
    const base = createNewSave(0);
    const uid = base.roster[0]?.uid;
    assert.ok(uid);
    const saved = runSavePartyPreset(base, 1, {
      summoner: "light",
      party: [uid],
      magic: ["light-bolt", "light-ward"],
    }).save;
    assert.deepEqual(saved.partyPresets[1]?.magic, ["light-bolt", "light-ward"]);
    const cleared = {
      ...saved,
      party: [] as string[],
      summonerMagicLoadouts: {
        ...saved.summonerMagicLoadouts,
        light: [null, null] as [string | null, string | null],
      },
    };
    const loaded = runLoadPartyPreset(cleared, 1).save;
    assert.equal(loaded.party[0], uid);
    assert.deepEqual(loaded.summonerMagicLoadouts.light, [
      "light-bolt",
      "light-ward",
    ]);
  });

  it("renames the profile for free once, then spends crystal", () => {
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, crystal: 500 } };
    const first = runChangeProfileNickname(save, "NickA");
    assert.equal(first.message, "ok");
    assert.equal(first.save.profileNickname, "NickA");
    assert.equal(first.save.nicknameChangeCount, 1);
    assert.equal(first.save.island.crystal, 500);
    const same = runChangeProfileNickname(first.save, "NickA");
    assert.equal(same.message, "unchanged");
    const second = runChangeProfileNickname(first.save, "NickB");
    assert.equal(second.message, "ok");
    assert.equal(second.save.island.crystal, 200);
    const broke = runChangeProfileNickname(
      { ...second.save, island: { ...second.save.island, crystal: 10 } },
      "NickC",
    );
    assert.equal(broke.message, "crystal_short");
    const icon = runSetProfileIcon(second.save, second.save.roster[0]!.monsterId);
    assert.equal(icon.profileIconId, second.save.roster[0]!.monsterId);
  });
});
