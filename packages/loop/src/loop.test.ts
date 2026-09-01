import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEmptyGear, createStarterGear, createSymbol, getMonster, getStage, CHAPTER1_STAGES, EQUIP_STAGES, GEAR_BAG_BASE_SLOTS, GEAR_BAG_EXPAND_STEP, GEAR_BAG_MAX_SLOTS, getGearAffix, normalizeGearPiece } from "stonesummoner-data";
import {
  createNewSave,
  createStageBattle,
  EQUIP_VAULT_WEEKLY_LIMIT,
  homeCollect,
  isoWeekKey,
  isStageUnlocked,
  isStageUnlockedForDifficulty,
  isDifficultyOpen,
  nextStageInProgression,
  listGear,
  listRoster,
  listSymbols,
  runBuyEnergy,
  ENERGY_BUY_AMOUNT,
  runBuyGrindstone,
  runBuyArenaShop,
  runBuyFriendShop,
  runBuyCashPack,
  grantFriendshipPoints,
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
  runExpandGearBag,
  gearBagCapacity,
  gearBagExpandCost,
  runBuyGlory,
  runBuyScroll,
  runCraftEssence,
  runCraftScroll,
  runDemoLoop,
  runEnhance,
  runPowerUpMonster,
  runEnhanceMagicSkill,
  runEnhanceGear,
  runAffixGearSet,
  runEquipGearBag,
  runSellGearBag,
  getActiveGear,
  withActiveGear,
  runAwakenSummoner,
  runAwakenMonster,
  runConvertEssence,
  monsterAwakenEssenceCost,
  summonerAwakenEssenceCost,
  setActiveSummoner,
  chooseStarterSummoner,
  unlockAdditionalSummoner,
  withUnlockedSummoners,
  isSummonerUnlocked,
  unlockedSummonerList,
  canUnlockAdditionalSummoner,
  hasSpareSummonerUnlockSlot,
  summonerUnlockSlotCount,
  nextSummonerUnlockLevel,
  SUMMONER_ELEMENTS,
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
  runEvolveMonster,
  runFusion,
  runGrindSymbol,
  unclaimedMailCount,
  runClaimMail,
  runClaimDailyMission,
  visibleDailyMissions,
  isDailyMissionComplete,
  dailyMissionProgress,
  mergeDailyMissionState,
  runImprintSymbol,
  runJoinGuild,
  runCreateGuild,
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
  ARENA_INVITATIONS_MAX,
  ARENA_INVITATION_RECHARGE_MS,
  arenaAttacksRemaining,
  syncArenaAttackDay,
  RAID_BOSS_MAX_HP,
  RAID_ATTEMPTS_DAILY,
  RAID_DAMAGE_BASE,
  RAID_COMBAT_TO_BOSS,
  GUILD_WEEK_CONTRIB_GOAL,
  GUILD_CREATE_CRYSTAL_COST,
  applyRewards,
  applyArenaElo,
  arenaOpponentRating,
  ARENA_NPC_RATING_GAIN,
  DEFAULT_ARENA_RATING,
  estimateSortiePower,
  rollStageCrystalDrop,
  stageCrystalDropChance,
  monsterExpToNext,
  monsterMaxLevel,
  addOwnedMonsterExp,
  monsterPowerUpExp,
  withDefaultSummonerMagicLoadout,
} from "./loop.js";
import {
  getArenaOpponent,
  isArenaNpcOpponentId,
  listArenaNpcOpponents,
  listDailyArenaOpponents,
} from "./arenaOpponents.js";
import { defaultSummonerMagicLoadout } from "stonesummoner-data";
import {
  claimableMainQuestCount,
  isMainQuestComplete,
  isMainQuestUnlocked,
  runClaimMainQuest,
} from "./mainQuest.js";
import { migrateSave, pickPreferredSave } from "./migrateSave.js";
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
    save = {
      ...save,
      island: { ...save.island, mana: 8000, energy: 50, summonerLevel: 3 },
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, level: 3 },
      },
    };
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

  it("gates production upgrades on account level, not the active summoner", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      activeSummoner: "light",
      island: { ...save.island, mana: 8000, summonerLevel: 1 },
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, level: 1 },
        fire: { ...save.summoners.fire, level: 3 },
      },
    };
    const up = runUpgradeBuilding(save, "mana_pond");
    assert.equal(
      up.save.island.buildings.find((b) => b.id === "mana_pond")!.level,
      2,
    );

    const staleIsland = {
      ...createNewSave(0),
      island: { ...createNewSave(0).island, mana: 8000, summonerLevel: 10 },
    };
    const blocked = runUpgradeBuilding(staleIsland, "mana_pond");
    assert.equal(
      blocked.save.island.buildings.find((b) => b.id === "mana_pond")!.level,
      1,
    );
    assert.match(blocked.message, /계정 Lv\.3/);
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
        "tower_2_1",
        "tower_2_2",
        "tower_2_3",
        "tower_2_4",
        "tower_2_5",
        "tower_2_6",
        "tower_2_7",
        "ruins_3_1",
        "ruins_3_2",
        "ruins_3_3",
        "ruins_3_4",
        "ruins_3_5",
        "ruins_3_6",
        "ruins_3_7",
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
      )?.id,
      "giant_abyss_normal",
    );
    const abyssNormalClear = {
      ...giantClear,
      clearedStages: [
        ...giantClear.clearedStages,
        "giant_b10",
        "giant_abyss_normal",
      ],
    };
    assert.equal(
      isStageUnlocked(abyssNormalClear, "giant_abyss_hard"),
      true,
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

  it("updates arena ELO on win and loss", () => {
    const stage = getStage("arena_rookie")!;
    const opp = arenaOpponentRating(stage.id);
    const win = applyArenaElo(DEFAULT_ARENA_RATING, opp, true);
    assert.ok(win.delta > 0);
    assert.equal(win.rating, DEFAULT_ARENA_RATING + win.delta);

    const loss = applyArenaElo(DEFAULT_ARENA_RATING, opp, false);
    assert.ok(loss.delta < 0);
    assert.equal(loss.rating, DEFAULT_ARENA_RATING + loss.delta);

    const victory = applyRewards(createNewSave(0), stage, true, () => 0.99);
    assert.ok(victory.save.arenaRating > DEFAULT_ARENA_RATING);
    assert.match(victory.reward.expNote, /ELO/);

    const defeat = applyRewards(createNewSave(0), stage, false);
    assert.ok(defeat.save.arenaRating < DEFAULT_ARENA_RATING);
    assert.match(defeat.reward.expNote, /ELO/);
  });

  it("trickles a flat score for NPC practice matches and never docks it", () => {
    const stage = getStage("arena_rookie")!;
    const base = createNewSave(0);

    const win = applyRewards(base, stage, true, () => 0.99, "normal", {
      arenaNpc: true,
    });
    assert.equal(win.save.arenaRating, DEFAULT_ARENA_RATING + ARENA_NPC_RATING_GAIN);

    const rivalWin = applyRewards(base, stage, true, () => 0.99);
    assert.ok(
      (rivalWin.save.arenaRating ?? 0) > (win.save.arenaRating ?? 0),
      "rival ladder must out-earn the practice tier",
    );
    assert.ok(
      (win.reward.glory ?? 0) < (rivalWin.reward.glory ?? 0),
      "practice glory is reduced",
    );

    const loss = applyRewards(base, stage, false, () => 0.99, "normal", {
      arenaNpc: true,
    });
    assert.equal(loss.save.arenaRating ?? DEFAULT_ARENA_RATING, DEFAULT_ARENA_RATING);
  });

  it("fixes the NPC practice ladder to the four arena tiers", () => {
    const npcs = listArenaNpcOpponents();
    assert.equal(npcs.length, 4);
    assert.deepEqual(
      npcs.map((o) => o.stageId),
      ["arena_rookie", "arena_veteran", "arena_challenger", "arena_legend"],
    );
    for (const npc of npcs) {
      assert.equal(npc.kind, "npc");
      assert.equal(isArenaNpcOpponentId(npc.id), true);
      assert.equal(npc.rating, arenaOpponentRating(npc.stageId));
      assert.ok(npc.enemyMonsterIds.length > 0);
      assert.equal(getArenaOpponent(npc.id)?.nickname, npc.nickname);
    }
    // The rotating ladder stays separate and is never flagged as practice.
    assert.ok(listDailyArenaOpponents().every((o) => o.kind === "rival"));
  });

  it("pays PVP in glory only — no symbol, gear, or scroll drops", () => {
    const base = createNewSave(0);
    for (const stageId of [
      "arena_rookie",
      "arena_veteran",
      "arena_challenger",
      "arena_legend",
      "warena_qual",
      "warena_final",
    ]) {
      const stage = getStage(stageId)!;
      assert.equal(stage.dropChance, 0, stageId);
      // A roll of 0 would hit every drop gate that is still open.
      const { save: next, reward } = applyRewards(base, stage, true, () => 0);
      assert.equal(reward.symbol, undefined, stageId);
      assert.equal(reward.gear, undefined, stageId);
      assert.equal(next.scrolls, base.scrolls, stageId);
      assert.equal(next.scrollsPremium ?? 0, base.scrollsPremium ?? 0, stageId);
      assert.ok((reward.glory ?? 0) > 0, stageId);
    }
  });

  it("estimates sortie combat power for arena prep", () => {
    const save = createNewSave(0);
    const stage = getStage("arena_rookie")!;
    const power = estimateSortiePower(save, stage);
    assert.ok(power.ally > 0);
    assert.ok(power.enemy > 0);
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
    assert.equal(isStageUnlocked(save, "guild_raid_boss"), false);
    save = { ...save, guildName: "테스트길드" };
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

    const overflowBuy = runBuyEnergy(
      {
        ...save,
        island: { ...save.island, crystal: 30, energy: 95, energyMax: 100 },
        shopBuyCounts: {},
      },
      1,
    );
    assert.equal(overflowBuy.save.island.energy, 95 + ENERGY_BUY_AMOUNT);

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

  it("expands gear bag slots at the same crystal prices as the symbol bag", () => {
    let save = createNewSave(0);
    assert.equal(gearBagCapacity(save), GEAR_BAG_BASE_SLOTS);
    assert.equal(gearBagExpandCost(save), symbolBagExpandCost(save));
    assert.equal(gearBagExpandCost(save), 10);

    save = {
      ...save,
      island: { ...save.island, crystal: 10_000 },
    };
    const first = runExpandGearBag(save);
    assert.equal(first.save.gearBagSlots, GEAR_BAG_BASE_SLOTS + GEAR_BAG_EXPAND_STEP);
    assert.equal(first.save.island.crystal, 10_000 - 10);
    assert.equal(gearBagExpandCost(first.save), 20);

    const broke = runExpandGearBag({
      ...save,
      island: { ...save.island, crystal: 9 },
    });
    assert.equal(broke.save.gearBagSlots, GEAR_BAG_BASE_SLOTS);
    assert.match(broke.message, /크리스탈/);

    save = { ...first.save, gearBagSlots: GEAR_BAG_MAX_SLOTS };
    const maxed = runExpandGearBag(save);
    assert.match(maxed.message, /최대/);
    assert.equal(gearBagExpandCost(maxed.save), null);
  });

  it("migrateSave defaults gearBagSlots and keeps expanded capacity", () => {
    const base = createNewSave(0);
    const legacy = { ...base };
    delete (legacy as { gearBagSlots?: number }).gearBagSlots;
    const round = migrateSave(JSON.parse(JSON.stringify(legacy)));
    assert.equal(round!.gearBagSlots, GEAR_BAG_BASE_SLOTS);

    const expanded = migrateSave({ ...base, gearBagSlots: 40 });
    assert.equal(expanded!.gearBagSlots, 40);
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
    const broke = runCreateGuild(
      { ...g, island: { ...g.island, crystal: GUILD_CREATE_CRYSTAL_COST - 1 } },
      "진문수호",
    );
    assert.match(broke.message, /크리스탈 부족/);
    assert.equal(broke.save.guildName, null);
    const founded = runCreateGuild(
      { ...g, island: { ...g.island, crystal: GUILD_CREATE_CRYSTAL_COST + 50 } },
      "진문수호",
    );
    assert.equal(founded.save.guildName, "진문수호");
    assert.equal(founded.save.island.crystal, 50);
    assert.match(founded.message, /창설/);
    const already = runCreateGuild(founded.save, "다른길드");
    assert.match(already.message, /이미/);
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

  it("evolves monster with same-grade fodder at max level", () => {
    let save = createNewSave(0);
    const target = save.roster[0]!;
    const fodder = {
      ...target,
      uid: "evo-fodder",
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    const maxLv = monsterMaxLevel(target);
    save = {
      ...save,
      roster: [
        { ...target, level: maxLv, evolve: 0 },
        fodder,
        ...save.roster.slice(1),
      ],
      party: [target.uid],
      island: { ...save.island, mana: 50000 },
    };
    const blocked = runEvolveMonster(save, target.uid, []);
    assert.match(blocked.message, /재료/);

    const ok = runEvolveMonster(save, target.uid, [fodder.uid]);
    assert.match(ok.message, /진화/);
    assert.equal(ok.save.roster[0]!.evolve, 1);
    assert.equal(ok.save.roster.some((m) => m.uid === fodder.uid), false);
  });

  it("awakens 6-star monster with dungeon XP and mats", () => {
    let save = createNewSave(0);
    const el = "fire" as const;
    const base = save.roster[0]!;
    const def = getMonster(base.monsterId)!;
    const evolveToSix = Math.max(0, 6 - def.naturalStars);
    const mon = {
      ...base,
      evolve: evolveToSix,
      level: monsterMaxLevel({ ...base, evolve: evolveToSix }),
      awaken: 0,
      awakenExp: 100,
    };
    const essenceCost = monsterAwakenEssenceCost(def.naturalStars);
    save = {
      ...save,
      roster: [mon, ...save.roster.slice(1)],
      island: { ...save.island, mana: 50000, crystal: 50 },
      awakenMats: {
        [el]: {
          low: essenceCost.low + 5,
          mid: essenceCost.mid,
          high: essenceCost.high,
        },
      },
    };
    const lowXp = runAwakenMonster(
      { ...save, roster: [{ ...mon, awakenExp: 10 }, ...save.roster.slice(1)] },
      mon.uid,
    );
    assert.match(lowXp.message, /각성 경험치/);

    const ok = runAwakenMonster(save, mon.uid);
    assert.match(ok.message, /각성/);
    assert.equal(ok.save.roster[0]!.awaken, 1);
    assert.deepEqual(ok.save.awakenMats[el], { low: 5, mid: 0, high: 0 });

    const maxed = runAwakenMonster(ok.save, mon.uid);
    assert.match(maxed.message, /이미 각성/);
  });

  it("enhance levels up without fodder skill bump", () => {
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
    assert.deepEqual(enh.save.roster[0]!.skillLevels, before);
  });

  it("fodder power-up EXP matches Summoners War feed table", () => {
    const fodder: OwnedMonster = {
      uid: "feed-1",
      monsterId: "cinder_imp_fire",
      level: 1,
      exp: 0,
      symbolSlots: [null, null, null, null, null, null],
      evolve: 0,
      skillLevels: [1, 1, 1],
    };
    assert.equal(monsterPowerUpExp(fodder), 800);
    const maxed = { ...fodder, level: monsterMaxLevel(fodder) };
    assert.equal(monsterPowerUpExp(maxed), 1210);
    const evolved = { ...fodder, monsterId: "cinder_imp_water", evolve: 1 };
    assert.equal(monsterPowerUpExp(evolved), 1760);
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

  it("powers up same-family fodder across elements for random skill ups", () => {
    let save = createNewSave(0);
    const target = {
      ...save.roster[0]!,
      monsterId: "stone_golem_fire",
      level: 1,
      exp: 0,
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    const matching = {
      ...target,
      uid: "power-up-family-water",
      monsterId: "stone_golem_water",
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    save = {
      ...save,
      roster: [target, matching],
      party: [target.uid],
      island: { ...save.island, mana: 5000 },
    };
    const result = runPowerUpMonster(save, target.uid, [matching.uid], () => 0);
    const updated = result.save.roster.find((m) => m.uid === target.uid)!;
    assert.match(result.message, /스킬/);
    assert.equal(updated.skillLevels[0], 2);
    assert.equal(result.save.roster.some((m) => m.uid === matching.uid), false);
  });

  it("evolve with same-family fodder randomly skills up", () => {
    let save = createNewSave(0);
    const target = save.roster[0]!;
    const fodder = {
      ...target,
      uid: "evo-family-fodder",
      monsterId: "stone_golem_water",
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    const maxLv = monsterMaxLevel(target);
    save = {
      ...save,
      roster: [
        { ...target, monsterId: "stone_golem_fire", level: maxLv, evolve: 0 },
        fodder,
        ...save.roster.slice(1),
      ],
      party: [target.uid],
      island: { ...save.island, mana: 50000 },
    };
    const ok = runEvolveMonster(save, target.uid, [fodder.uid], () => 0);
    assert.match(ok.message, /스킬/);
    const updated = ok.save.roster.find((m) => m.uid === target.uid)!;
    assert.equal(updated.evolve, 1);
    assert.equal(updated.skillLevels[0], 2);
    assert.equal(ok.save.roster.some((m) => m.uid === fodder.uid), false);
  });

  it("powers up matching fodder at max level for random skill ups", () => {
    let save = createNewSave(0);
    const target = {
      ...save.roster[0]!,
      level: monsterMaxLevel(save.roster[0]!),
      exp: 0,
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    const matching = {
      ...target,
      uid: "power-up-max-matching",
      skillLevels: [1, 1, 1] as [number, number, number],
    };
    save = {
      ...save,
      roster: [target, matching, ...save.roster.slice(1)],
      party: [target.uid],
      island: { ...save.island, mana: 5000 },
    };
    const result = runPowerUpMonster(save, target.uid, [matching.uid], () => 0);
    const updated = result.save.roster.find((m) => m.uid === target.uid)!;
    assert.match(result.message, /스킬/);
    assert.equal(updated.level, target.level);
    assert.ok(updated.skillLevels.some((lv, i) => lv > (target.skillLevels[i] ?? 1)));
    assert.equal(result.save.roster.some((m) => m.uid === matching.uid), false);
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
        summonerLevel: 8,
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

    const overflowClaim = runClaimDailyMission(
      {
        ...save,
        island: {
          ...save.island,
          lastWishDay: day,
          mana: 100,
          energy: 95,
          energyMax: 100,
          summonerLevel: 8,
        },
        claimedMissionKeys: [],
      },
      "wish",
      Date.parse(`${day}T12:00:00Z`),
    );
    assert.equal(overflowClaim.save.island.energy, 105);

    save = {
      ...blocked.save,
      dojoDrillDay: day,
      dojoDrillsToday: 1,
      dailyActivity: {
        ...blocked.save.dailyActivity,
        day,
        dojo: 1,
      },
      claimedMissionKeys: blocked.save.claimedMissionKeys,
      island: {
        ...blocked.save.island,
        mana: 100,
        energy: 40,
        energyMax: 100,
        summonerLevel: 8,
      },
    };
    const dojo = runClaimDailyMission(
      save,
      "dojo",
      Date.parse(`${day}T12:00:00Z`),
    );
    assert.match(dojo.message, /일일 미션/);
    assert.equal(dojo.save.island.mana, 250);
  });

  it("unlocks daily missions by summoner level and tracks SW-style goals", () => {
    const later = Date.now() + 3_600_000;
    let save = createNewSave();
    const earlyIds = visibleDailyMissions(save).map((m) => m.id);
    assert.deepEqual(earlyIds, ["collect", "summon", "enhanceMon", "sortie", "all"]);
    assert.equal(isDailyMissionComplete(save, "dungeon"), false);
    assert.ok(!earlyIds.includes("wish"));
    assert.ok(!earlyIds.includes("enhanceSymbol"));

    const pond = homeCollect(save, later);
    assert.ok((pond.save.dailyActivity?.collect ?? 0) >= 1);
    const collectClaim = runClaimDailyMission(pond.save, "collect", later);
    assert.match(collectClaim.message, /일일 미션/);

    const summoned = runSummon(collectClaim.save, "normal", () => 0.2);
    assert.equal(summoned.save.dailyActivity?.summon, 1);
    assert.equal(isDailyMissionComplete(summoned.save, "summon"), true);

    save = {
      ...summoned.save,
      island: { ...summoned.save.island, summonerLevel: 12, mana: 8000 },
      clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3", "garen_1_4", "garen_1_5"],
    };
    const lateIds = visibleDailyMissions(save).map((m) => m.id);
    assert.ok(lateIds.includes("wish"));
    assert.ok(lateIds.includes("dungeon"));
    assert.ok(lateIds.includes("enhanceSymbol"));
    assert.ok(lateIds.includes("enhanceGear"));
    assert.ok(lateIds.includes("arena"));
    assert.ok(lateIds.includes("grindSymbol"));

    const enhanced = runEnhanceSymbol(save, "0");
    assert.equal(enhanced.save.dailyActivity?.enhanceSymbol, 1);
    assert.equal(isDailyMissionComplete(enhanced.save, "enhanceSymbol"), true);

    const stage = getStage("giant_b1")!;
    const depth = applyRewards(enhanced.save, stage, true, () => 0.99);
    assert.ok((depth.save.dailyActivity?.dungeon ?? 0) >= 1);
    assert.ok((depth.save.dailyActivity?.battle ?? 0) >= 1);
    const sortie = visibleDailyMissions(depth.save).find((m) => m.id === "sortie");
    assert.ok(sortie);
    assert.equal(
      dailyMissionProgress(depth.save, sortie),
      depth.save.dailyActivity?.battle,
    );
  });

  it("spawns Giant trash first and scales the final boss wave", () => {
    const save = createNewSave(0);
    const stage = getStage("giant_b1")!;
    const firstWave = createStageBattle(stage, save);
    assert.equal(
      firstWave.units.some(
        (unit) =>
          unit.kind === "monster" && unit.monsterId === stage.bossMonsterId,
      ),
      false,
    );

    const finalEnemies = stage.enemyWaves!.at(-1)!;
    const finalStage = { ...stage, waves: 1, enemyWaves: [finalEnemies] };
    const baseline = createStageBattle(
      {
        ...finalStage,
        bossMonsterId: undefined,
        bossHpMultiplier: undefined,
      },
      save,
    );
    const bossBattle = createStageBattle(finalStage, save);
    const baselineBoss = baseline.units.find(
      (unit) => unit.monsterId === stage.bossMonsterId,
    )!;
    const boss = bossBattle.units.find(
      (unit) => unit.monsterId === stage.bossMonsterId,
    )!;
    assert.equal(boss.name, stage.bossNameKo);
    assert.equal(
      boss.stats.hp,
      Math.round(baselineBoss.stats.hp * (stage.bossHpMultiplier ?? 1)),
    );
  });

  it("spawns awakening trash first and grants floor-scaled essences and XP", () => {
    const stage = getStage("weekday_awaken_fire_b10")!;
    let save = createNewSave(0);
    const base = save.roster[0]!;
    const def = getMonster("wolf_fighter_fire")!;
    const partyMonster = {
      ...base,
      monsterId: "wolf_fighter_fire",
      evolve: Math.max(0, 6 - def.naturalStars),
      awakenExp: 0,
    };
    save = {
      ...save,
      roster: [partyMonster, ...save.roster.slice(1)],
      party: [partyMonster.uid],
    };
    const firstWave = createStageBattle(stage, save);
    assert.equal(
      firstWave.units.some(
        (unit) => unit.monsterId === stage.bossMonsterId,
      ),
      false,
    );
    const rewarded = applyRewards(save, stage, true, () => 0);
    assert.deepEqual(rewarded.reward.awakenEssenceGain, {
      element: "fire",
      amounts: { low: 0, mid: 4, high: 1 },
    });
    assert.equal(rewarded.reward.awakenExpGain, 35);
    assert.equal(rewarded.save.roster[0]!.awakenExp, 35);
    assert.equal(rewarded.reward.symbol, undefined);
    assert.equal(rewarded.reward.gear, undefined);
  });

  it("converts graded essences with irreversible loss and validates costs", () => {
    const base = createNewSave(0);
    const save = {
      ...base,
      island: { ...base.island, mana: 6_000 },
      awakenMats: {
        fire: { low: 10, mid: 0, high: 0 },
      },
    };
    const up = runConvertEssence(save, "fire", "low_to_mid");
    assert.deepEqual(up.save.awakenMats.fire, { low: 0, mid: 1, high: 0 });
    assert.equal(up.save.island.mana, 5_000);
    const down = runConvertEssence(up.save, "fire", "mid_to_low");
    assert.deepEqual(down.save.awakenMats.fire, {
      low: 8,
      mid: 0,
      high: 0,
    });
    const insufficient = runConvertEssence(
      down.save,
      "fire",
      "mid_to_high",
    );
    assert.equal(insufficient.save, down.save);
    assert.match(insufficient.message, /부족/);
  });

  it("reports a guaranteed Giant symbol blocked by a full bag", () => {
    const base = createNewSave(0);
    const symbols = Array.from({ length: symbolBagCapacity(base) }, (_, index) => ({
      ...createSymbol("hwalro", 1, `full_${index}`),
      id: `full_${index}`,
    }));
    const full = { ...base, symbols };
    const result = applyRewards(full, getStage("giant_b1")!, true, () => 0.99);
    assert.equal(result.reward.symbol, undefined);
    assert.equal(result.reward.symbolBagFull, true);
    assert.equal(result.save.symbols.length, symbols.length);
  });

  it("keeps local mission progress over a stale cloud save", () => {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const blank = createNewSave(now);
    const local = {
      ...blank,
      updatedAt: now,
      claimedMissionKeys: [`collect:${day}`],
      claimedMainQuestIds: ["forest1"],
      dailyActivity: {
        ...blank.dailyActivity,
        day,
        collect: 1,
        battle: 3,
      },
    };
    const remote = {
      ...blank,
      updatedAt: now - 60_000,
      claimedMissionKeys: [],
      claimedMainQuestIds: [],
      dailyActivity: { ...blank.dailyActivity, day: null },
    };
    const picked = pickPreferredSave(local, remote);
    assert.equal(picked.updatedAt, local.updatedAt);
    const merged = mergeDailyMissionState(picked, remote, now);
    assert.equal(merged.dailyActivity.collect, 1);
    assert.equal(merged.dailyActivity.battle, 3);
    assert.ok(merged.claimedMissionKeys.includes(`collect:${day}`));
    assert.ok(merged.claimedMainQuestIds.includes("forest1"));

    const fromStalePrimary = mergeDailyMissionState(remote, local, now);
    assert.equal(fromStalePrimary.dailyActivity.battle, 3);
    assert.ok(fromStalePrimary.claimedMissionKeys.includes(`collect:${day}`));
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

    const overflowQuest = runClaimMainQuest(
      {
        ...save,
        island: { ...save.island, energy: 95, energyMax: 100 },
      },
      "forest1",
    );
    assert.equal(overflowQuest.save.island.energy, 105);

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

  it("uses explicit Summoners War account and monster EXP profiles", () => {
    const stage = getStage("garen_1_1")!;
    assert.equal(
      expForStage(stage, "normal"),
      stage.difficultyBalance!.normal!.accountExp,
    );
    assert.equal(
      expForStage(stage, "hard"),
      stage.difficultyBalance!.hard!.accountExp,
    );
    assert.equal(
      expForStage(stage, "hell"),
      stage.difficultyBalance!.hell!.accountExp,
    );

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

  it("scenario hard and hell unlock stages sequentially on their own track", () => {
    const chapter1Ids = CHAPTER1_STAGES.map((s) => s.id);
    let save = createNewSave(0);
    save = { ...save, clearedStages: chapter1Ids };

    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_1", "hard"), true);
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_2", "hard"), false);
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_7", "hard"), false);

    save = { ...save, clearedHardStages: ["garen_1_1"] };
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_2", "hard"), true);
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_3", "hard"), false);

    save = { ...save, clearedHardStages: chapter1Ids };
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_1", "hell"), true);
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_2", "hell"), false);

    save = { ...save, clearedHellStages: ["garen_1_1"] };
    assert.equal(isStageUnlockedForDifficulty(save, "garen_1_2", "hell"), true);
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
    assert.deepEqual(summonerAwakenEssenceCost(0), {
      low: 8,
      mid: 0,
      high: 0,
    });
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
      awakenMats: { light: summonerAwakenEssenceCost(0) },
    };
    const ok = runAwakenSummoner(save);
    assert.match(ok.message, /진화 \+1/);
    assert.equal(ok.save.summonerAwaken, 1);
    assert.equal(ok.save.summoners.light.awaken, 1);
    assert.equal(ok.save.island.mana, 2000 - 500);
    assert.equal(ok.save.island.crystal, 20 - 3);
    assert.deepEqual(ok.save.awakenMats.light, {
      low: 0,
      mid: 0,
      high: 0,
    });
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
    assert.match(allySum.name, /진화3/);
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
    let save = withUnlockedSummoners(createNewSave(0), [...SUMMONER_ELEMENTS]);
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

  it("starts with one summoner and unlocks extras at user lv 5/10/15/20", () => {
    const fresh = createNewSave(0);
    assert.equal(fresh.starterSummonerPicked, false);
    assert.deepEqual(unlockedSummonerList(fresh), ["light"]);
    assert.equal(summonerUnlockSlotCount(1), 1);
    assert.equal(summonerUnlockSlotCount(4), 1);
    assert.equal(summonerUnlockSlotCount(5), 2);
    assert.equal(summonerUnlockSlotCount(10), 3);
    assert.equal(summonerUnlockSlotCount(15), 4);
    assert.equal(summonerUnlockSlotCount(20), 5);
    assert.equal(nextSummonerUnlockLevel(1), 5);
    assert.equal(nextSummonerUnlockLevel(4), 20);
    assert.equal(nextSummonerUnlockLevel(5), null);

    const picked = chooseStarterSummoner(fresh, "fire");
    assert.equal(picked.starterSummonerPicked, true);
    assert.equal(picked.activeSummoner, "fire");
    assert.deepEqual(unlockedSummonerList(picked), ["fire"]);
    assert.equal(setActiveSummoner(picked, "water").activeSummoner, "fire");
    assert.equal(canUnlockAdditionalSummoner(picked, "water"), false);
    assert.equal(hasSpareSummonerUnlockSlot(picked), false);

    const at5 = {
      ...picked,
      summoners: {
        ...picked.summoners,
        fire: { ...picked.summoners.fire, level: 5 },
      },
    };
    assert.equal(canUnlockAdditionalSummoner(at5, "water"), true);
    const unlocked = unlockAdditionalSummoner(at5, "water");
    assert.match(unlocked.message, /해금/);
    assert.ok(isSummonerUnlocked(unlocked.save, "water"));
    assert.equal(setActiveSummoner(unlocked.save, "water").activeSummoner, "water");
    assert.equal(canUnlockAdditionalSummoner(unlocked.save, "wind"), false);

    const blocked = unlockAdditionalSummoner(picked, "water");
    assert.match(blocked.message, /불가/);
  });

  it("gates magic skill enhance by that summoner's level", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      island: { ...save.island, mana: 5000, crystal: 20 },
      summoners: {
        ...save.summoners,
        light: { ...save.summoners.light, level: 1 },
      },
    };
    const first = runEnhanceMagicSkill(save, "light_open", "light");
    assert.equal(first.save.summonerMagic.light.ranks.light_open, 1);

    const locked = runEnhanceMagicSkill(first.save, "light_open", "light");
    assert.equal(locked.save.summonerMagic.light.ranks.light_open, 1);
    assert.match(locked.message, /Lv\.5/);

    save = {
      ...first.save,
      summoners: {
        ...first.save.summoners,
        light: { ...first.save.summoners.light, level: 5 },
      },
    };
    const ok = runEnhanceMagicSkill(save, "light_open", "light");
    assert.equal(ok.save.summonerMagic.light.ranks.light_open, 2);
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

    save = withUnlockedSummoners(blocked.save, ["light", "fire"]);
    save = setActiveSummoner(save, "fire");
    const ok = runEquipGearBag(save, 0);
    assert.match(ok.message, /장착/);
    assert.equal(ok.save.gear.weapon?.id, "bag_fire_wpn");
    assert.equal(ok.save.gear.weapon?.element, "fire");
  });

  /**
   * Affixes always derive from `rollSeed`, so tests search for a seed that
   * rolls the wanted ability instead of hand-writing it onto a piece.
   */
  const seekAffixPiece = (
    slot: "weapon" | "necklace" | "ring" | "shoes",
    wanted: string,
  ) => {
    const setId =
      slot === "necklace" ? "sense" : slot === "shoes" ? "mana" : "assault";
    for (let i = 1; i < 4000; i++) {
      const piece = normalizeGearPiece({
        id: `affix_seek_${slot}_${wanted}`,
        slot,
        nameKo: "t",
        enhance: 0,
        setId,
        stars: 5,
        element: slot === "weapon" ? "light" : undefined,
        materialId: slot === "weapon" ? undefined : "cloth",
        rollSeed: i * 17,
      });
      const roll = piece.affixes.find((a) => a.id === wanted);
      if (roll) return { piece, value: roll.value };
    }
    throw new Error(`no seed rolled ${wanted} on ${slot}`);
  };

  it("multiplies battle gold with goldSurge and never stacks it twice", () => {
    const stage = getStage("garen_1_1")!;
    const base = createNewSave(0);
    const plain = applyRewards(base, stage, true, () => 0.99);
    assert.ok(plain.reward.mana > 0);

    const surge = getGearAffix("goldSurge")!;
    const necklace = seekAffixPiece("necklace", "goldSurge");
    assert.ok(necklace.value >= surge.value[0]);
    assert.ok(necklace.value <= surge.value[1]);

    const geared = withActiveGear(base, {
      ...createEmptyGear(),
      necklace: necklace.piece,
    });
    const boosted = applyRewards(geared, stage, true, () => 0.99);
    assert.equal(
      boosted.reward.mana,
      Math.round(plain.reward.mana * (1 + necklace.value)),
    );

    // A second goldSurge does not stack — only the best roll fires.
    const weapon = seekAffixPiece("weapon", "goldSurge");
    const twin = withActiveGear(base, {
      ...createEmptyGear(),
      necklace: necklace.piece,
      weapon: weapon.piece,
    });
    const twinRun = applyRewards(twin, stage, true, () => 0.99);
    const best = Math.max(necklace.value, weapon.value);
    assert.equal(
      twinRun.reward.mana,
      Math.round(plain.reward.mana * (1 + best)),
    );
    assert.ok(
      twinRun.reward.mana < Math.round(plain.reward.mana * (1 + necklace.value + weapon.value)),
      "two copies of goldSurge must not add up",
    );
  });

  it("raises EXP and gear drop rate from gear affixes", () => {
    const stage = getStage("garen_1_1")!;
    const base = createNewSave(0);
    const equip = (slot: "ring" | "necklace", wanted: string) => {
      const found = seekAffixPiece(slot, wanted);
      return {
        save: withActiveGear(base, { ...createEmptyGear(), [slot]: found.piece }),
        value: found.value,
      };
    };

    const plainExp = applyRewards(base, stage, true, () => 0.99).reward.summonerExp;
    const scholar = equip("ring", "scholar");
    const scholarExp = applyRewards(scholar.save, stage, true, () => 0.99).reward
      .summonerExp;
    assert.ok(
      (scholarExp ?? 0) > (plainExp ?? 0),
      `${scholarExp} should beat ${plainExp}`,
    );

    // vaultGreed pushes the vault gear chance past a roll that would otherwise miss.
    const vault = EQUIP_STAGES[0]!;
    const greed = equip("ring", "vaultGreed");
    const baseChance = vault.gearDropChance!;
    const between = baseChance + (1 - baseChance) / 2;
    const rngAt = (value: number) => () => value;
    assert.ok(between > baseChance && between < 1);
    assert.ok(
      baseChance * (1 + greed.value) > between,
      "vaultGreed must lift the chance above the test roll",
    );
    assert.equal(applyRewards(base, vault, true, rngAt(between)).reward.gear, undefined);
    assert.ok(
      applyRewards(greed.save, vault, true, rngAt(between)).reward.gear,
      "vaultGreed should convert the near miss",
    );
  });

  it("guarantees affixed ★4+ gear on the deepest vault floor", () => {
    const top = EQUIP_STAGES[4]!;
    assert.equal(top.id, "equip_vault_5");
    let save = createNewSave(0);
    save = { ...save, island: { ...save.island, energy: 200 } };
    for (let seed = 0; seed < 24; seed++) {
      const rng = () => ((seed * 37 + 11) % 100) / 100;
      const { reward } = applyRewards(save, top, true, rng);
      if (!reward.gear) continue;
      assert.ok(reward.gear.stars >= 4, `got ★${reward.gear.stars}`);
      assert.ok(
        (reward.gear.affixes ?? []).length >= 1,
        "★4+ vault drops carry a special ability",
      );
    }
  });

  it("keeps a full gear bag from auto-selling the best piece", () => {
    let save = createNewSave(0);
    const cheap = Array.from({ length: gearBagCapacity(save) }, (_, i) =>
      normalizeGearPiece({
        id: `cheap_${i}`,
        slot: "shoes",
        nameKo: "t",
        enhance: 0,
        setId: "mana",
        stars: 1,
        materialId: "cloth",
        rollSeed: 1000 + i,
      }),
    );
    const treasure = normalizeGearPiece({
      id: "treasure",
      slot: "necklace",
      nameKo: "t",
      enhance: 12,
      setId: "sense",
      stars: 5,
      materialId: "cloth",
      rollSeed: 424242,
    });
    save = { ...save, gearBag: [treasure, ...cheap.slice(1)] };
    const { save: next } = applyRewards(
      save,
      EQUIP_STAGES[0]!,
      true,
      () => 0.01,
    );
    assert.ok(
      next.gearBag?.some((p) => p.id === "treasure"),
      "the ★5 piece must survive a bag overflow",
    );
  });

  it("keeps gear combat affixes and leader attack local to the summoner", () => {
    const stage = getStage("garen_1_1")!;
    const base = createNewSave(0);
    const plain = createStageBattle(stage, base, { rng: () => 0.5 });

    const spring = seekAffixPiece("shoes", "manaSpring");
    const springBattle = createStageBattle(
      stage,
      withActiveGear(base, { ...createEmptyGear(), shoes: spring.piece }),
      { rng: () => 0.5 },
    );
    assert.ok(
      springBattle.allySummoner.manaRegenPerTick >
        plain.allySummoner.manaRegenPerTick,
      "manaSpring raises mana regen",
    );

    const roar = seekAffixPiece("ring", "leaderRoar");
    const roarBattle = createStageBattle(
      stage,
      withActiveGear(base, { ...createEmptyGear(), ring: roar.piece }),
      { rng: () => 0.5 },
    );
    const monsterAtk = (b: typeof plain) =>
      b.units
        .filter((u) => u.team === "ally" && u.kind === "monster")
        .reduce((n, u) => n + u.stats.atk, 0);
    const summonerAtk = (b: typeof plain) =>
      b.units.find((u) => u.team === "ally" && u.kind === "summoner")!.stats.atk;
    assert.equal(monsterAtk(roarBattle), monsterAtk(plain));
    assert.ok(
      summonerAtk(roarBattle) > summonerAtk(plain),
      "leaderRoar raises only summoner ATK",
    );

    const commandBottom = {
      ...base.gear.bottom!,
      leaderAtkBonus: (base.gear.bottom?.leaderAtkBonus ?? 0) + 0.2,
    };
    const commandBattle = createStageBattle(
      stage,
      withActiveGear(base, { ...base.gear, bottom: commandBottom }),
      { rng: () => 0.5 },
    );
    assert.equal(monsterAtk(commandBattle), monsterAtk(plain));
    assert.ok(summonerAtk(commandBattle) > summonerAtk(plain));

    const slayer = seekAffixPiece("weapon", "giantSlayer");
    const bossStage = getStage("giant_b1")!;
    const slayerSave = withActiveGear(base, {
      ...createEmptyGear(),
      weapon: slayer.piece,
    });
    const nonBossSlayerBattle = createStageBattle(
      stage,
      slayerSave,
      { rng: () => 0.5 },
    );
    const slayerBattle = createStageBattle(
      bossStage,
      slayerSave,
      { rng: () => 0.5 },
    );
    assert.equal(monsterAtk(slayerBattle), monsterAtk(nonBossSlayerBattle));
    assert.ok(summonerAtk(slayerBattle) > summonerAtk(nonBossSlayerBattle));

    const bulwark = seekAffixPiece("necklace", "bulwark");
    const bulwarkBattle = createStageBattle(
      stage,
      withActiveGear(base, { ...createEmptyGear(), necklace: bulwark.piece }),
      { rng: () => 0.5 },
    );
    const summonerHp = (b: typeof plain) =>
      b.units.find((u) => u.team === "ally" && u.kind === "summoner")!.stats.hp;
    assert.ok(
      summonerHp(bulwarkBattle) > summonerHp(plain),
      "bulwark raises summoner HP",
    );
  });

  it("keeps separate gear sets per summoner element", () => {
    let save = withActiveGear(createNewSave(0), createStarterGear("light"));
    const lightWpn = save.gear.weapon!.id;
    save = withActiveGear(save, {
      ...getActiveGear(save),
      weapon: { ...getActiveGear(save).weapon!, enhance: 3 },
    });
    assert.equal(save.gear.weapon?.enhance, 3);

    save = withUnlockedSummoners(save, ["light", "water"]);
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

  it("sets arena defense and spends rechargeable invitations", () => {
    let save = createNewSave(0);
    save = {
      ...save,
      clearedStages: ["garen_1_1", "garen_1_2", "garen_1_3"],
      island: { ...save.island, summonerLevel: 5, energy: 50 },
    };
    const def = runSetArenaDefense(save);
    assert.ok(def.save.arenaDefense);
    assert.equal(def.save.arenaDefense!.party.length, save.party.length);
    save = {
      ...def.save,
      arenaInvitations: 0,
      arenaInvitationUpdatedAt: Date.parse("2099-01-01T12:00:00Z"),
      arenaAttacksToday: ARENA_ATTACKS_DAILY,
      arenaAttackDay: "2099-01-01",
    };
    const blocked = runSortie(save, "arena_rookie", {
      rng: () => 0.1,
      now: Date.parse("2099-01-01T12:00:00Z"),
    });
    assert.match(blocked.message, /초대장/);
  });

  it("recharges one arena invitation every 30 minutes", () => {
    const now = Date.parse("2099-01-01T12:00:00Z");
    const save = {
      ...createNewSave(now),
      arenaInvitations: 4,
      arenaInvitationUpdatedAt: now,
      arenaAttacksToday: ARENA_INVITATIONS_MAX - 4,
      arenaAttackDay: "2099-01-01",
    };
    assert.equal(arenaAttacksRemaining(save, now), 4);
    const recharged = syncArenaAttackDay(
      save,
      now + ARENA_INVITATION_RECHARGE_MS * 2,
    );
    assert.equal(recharged.arenaInvitations, 6);
    assert.equal(arenaAttacksRemaining(recharged, now), 6);
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

  it("blocks guild raid without a guild and pays damage on defeat", () => {
    const stage = getStage("guild_raid_boss")!;
    let save = createNewSave(0);
    save = {
      ...save,
      island: { ...save.island, energy: 50, summonerLevel: 12 },
      clearedStages: ["garen_1_5"],
      raidBossHp: RAID_BOSS_MAX_HP,
    };
    const blocked = runSortie(save, "guild_raid_boss", { rng: () => 0.05 });
    assert.match(blocked.message, /잠김/);

    save = { ...save, guildName: "테스트길드" };
    const none = applyRewards(save, stage, false, () => 0.5, "normal", {
      damageDealt: 0,
    });
    assert.equal(none.reward.victory, false);
    assert.equal(none.reward.raidDamage ?? 0, 0);
    assert.equal(none.save.raidBossHp ?? RAID_BOSS_MAX_HP, RAID_BOSS_MAX_HP);
    assert.equal(none.reward.contribution ?? 0, 0);

    const dmg = 50_000;
    const paid = applyRewards(save, stage, false, () => 0.5, "normal", {
      damageDealt: dmg,
    });
    const expectChip = Math.round(dmg * RAID_COMBAT_TO_BOSS);
    assert.equal(paid.reward.raidDamage, expectChip);
    assert.ok((paid.reward.contribution ?? 0) > 0);
    assert.ok((paid.reward.glory ?? 0) > 0);
    assert.equal(
      paid.save.raidBossHp ?? RAID_BOSS_MAX_HP,
      RAID_BOSS_MAX_HP - expectChip,
    );
    assert.ok(expectChip < RAID_DAMAGE_BASE * 2);

    const win = applyRewards(save, stage, true, () => 0.99, "normal", {
      damageDealt: dmg,
    });
    assert.equal(win.reward.victory, true);
    assert.equal(win.reward.raidDamage, expectChip);
    assert.ok((win.save.raidBossHp ?? RAID_BOSS_MAX_HP) < RAID_BOSS_MAX_HP);
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
    assert.deepEqual(round!.awakenMats.fire, { low: 4, mid: 0, high: 0 });
    assert.equal(round!.grindstones, base.grindstones);
    assert.deepEqual(round!.claimedMailIds, []);
    assert.deepEqual(round!.claimedMissionKeys, []);
    assert.deepEqual(round!.claimedMainQuestIds, []);
    assert.ok(round!.dailyActivity);
    assert.equal(round!.updatedAt ?? 0, 0);
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
      circleTutorialSeen: false,
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

  it("migrateSave unlocks all summoners for legacy saves", () => {
    const base = createNewSave(0);
    const { unlockedSummoners, starterSummonerPicked, ...legacy } = base;
    const round = migrateSave(JSON.parse(JSON.stringify(legacy)));
    assert.ok(round);
    assert.deepEqual(round!.unlockedSummoners, [...SUMMONER_ELEMENTS]);
    assert.equal(round!.starterSummonerPicked, true);
    const kept = migrateSave(
      JSON.parse(
        JSON.stringify({
          ...base,
          unlockedSummoners: ["fire"],
          starterSummonerPicked: false,
          activeSummoner: "fire",
        }),
      ),
    );
    assert.deepEqual(kept!.unlockedSummoners, ["fire"]);
    assert.equal(kept!.starterSummonerPicked, false);
  });

  it("defaults empty summoner magic slots to basic skills A and B", () => {
    const save = createNewSave(0);
    assert.deepEqual(
      save.summonerMagicLoadouts.light,
      defaultSummonerMagicLoadout("light"),
    );
    const filled = withDefaultSummonerMagicLoadout("light", [null, null]);
    assert.deepEqual(filled, defaultSummonerMagicLoadout("light"));
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

describe("tab shops", () => {
  it("spends glory in the arena shop", () => {
    let save = createNewSave(0);
    save = { ...save, gloryPoints: 40 };
    const bought = runBuyArenaShop(save, "arena_gold");
    assert.equal(bought.save.gloryPoints, 25);
    assert.equal(bought.save.island.mana, save.island.mana + 50000);
    const broke = runBuyArenaShop({ ...bought.save, gloryPoints: 0 }, "arena_gold");
    assert.match(broke.message, /영광/);
  });

  it("spends friendship points in the social shop", () => {
    let save = grantFriendshipPoints(createNewSave(0), 20);
    const bought = runBuyFriendShop(save, "friend_energy");
    assert.equal(bought.save.friendshipPoints, 15);
    const broke = runBuyFriendShop({ ...bought.save, friendshipPoints: 0 }, "friend_gold");
    assert.match(broke.message, /우정/);
  });

  it("grants cash pack crystals with a daily cap", () => {
    const save = createNewSave(0);
    const first = runBuyCashPack(save, "pack_crystal_250");
    assert.equal(first.save.island.crystal, save.island.crystal + 250);
    const second = runBuyCashPack(first.save, "pack_crystal_250");
    const third = runBuyCashPack(second.save, "pack_crystal_250");
    const blocked = runBuyCashPack(third.save, "pack_crystal_250");
    assert.match(blocked.message, /한도/);
  });
});

describe("attendance", () => {
  it("claims first-day reward and advances calendar", async () => {
    const { runClaimAttendance, canClaimAttendance, attendanceDayIndex } =
      await import("./attendance.js");
    const save = createNewSave(Date.parse("2026-08-30T12:00:00Z"));
    assert.equal(attendanceDayIndex(save), 1);
    assert.equal(canClaimAttendance(save, Date.parse("2026-08-30T12:00:00Z")), true);
    const first = runClaimAttendance(save, Date.parse("2026-08-30T12:00:00Z"));
    assert.match(first.message, /출석 1일차/);
    assert.equal(first.save.attendanceStreak, 1);
    assert.equal(first.save.attendanceDayIndex, 2);
    assert.equal(first.save.attendanceLastClaimDay, "2026-08-30");
    assert.equal(first.save.island.mana, save.island.mana + 600);
    const dup = runClaimAttendance(first.save, Date.parse("2026-08-30T18:00:00Z"));
    assert.match(dup.message, /이미 출석/);
    assert.equal(canClaimAttendance(first.save, Date.parse("2026-08-30T18:00:00Z")), false);
  });

  it("resets streak on gap but keeps calendar progress", async () => {
    const { runClaimAttendance } = await import("./attendance.js");
    let save = createNewSave(Date.parse("2026-08-28T12:00:00Z"));
    save = runClaimAttendance(save, Date.parse("2026-08-28T12:00:00Z")).save;
    save = runClaimAttendance(save, Date.parse("2026-08-29T12:00:00Z")).save;
    assert.equal(save.attendanceStreak, 2);
    assert.equal(save.attendanceDayIndex, 3);
    const afterGap = runClaimAttendance(save, Date.parse("2026-08-31T12:00:00Z"));
    assert.equal(afterGap.save.attendanceStreak, 1);
    assert.equal(afterGap.save.attendanceDayIndex, 4);
    assert.match(afterGap.message, /출석 3일차/);
  });

  it("wraps calendar from day 14 to day 1", async () => {
    const { runClaimAttendance } = await import("./attendance.js");
    let save = createNewSave(0);
    const beforePremium = save.scrollsPremium ?? 0;
    save = { ...save, attendanceDayIndex: 14 };
    const claim = runClaimAttendance(save, Date.parse("2026-08-30T12:00:00Z"));
    assert.match(claim.message, /출석 14일차/);
    assert.equal(claim.save.attendanceDayIndex, 1);
    assert.equal(claim.save.scrollsPremium, beforePremium + 2);
  });
});

describe("arena opponents", () => {
  it("lists 10 deterministic opponents per day", async () => {
    const { listDailyArenaOpponents, ARENA_DAILY_OPPONENT_COUNT } =
      await import("./arenaOpponents.js");
    const now = Date.parse("2026-08-30T12:00:00Z");
    const a = listDailyArenaOpponents(now);
    const b = listDailyArenaOpponents(now);
    assert.equal(a.length, ARENA_DAILY_OPPONENT_COUNT);
    assert.deepEqual(a, b);
    assert.ok(a.every((o) => o.nickname.length >= 2));
    assert.ok(a.every((o) => o.enemyMonsterIds.length >= 1));
    assert.ok(a.every((o) => o.gloryReward > 0));
    const tiers = a.map((o) => o.stageId);
    assert.equal(tiers.filter((id) => id === "arena_rookie").length, 3);
    assert.equal(tiers.filter((id) => id === "arena_veteran").length, 3);
    assert.equal(tiers.filter((id) => id === "arena_challenger").length, 2);
    assert.equal(tiers.filter((id) => id === "arena_legend").length, 2);
  });

  it("changes opponents when the day changes", async () => {
    const { listDailyArenaOpponents } = await import("./arenaOpponents.js");
    const day1 = listDailyArenaOpponents(Date.parse("2026-08-30T12:00:00Z"));
    const day2 = listDailyArenaOpponents(Date.parse("2026-08-31T12:00:00Z"));
    assert.notDeepEqual(
      day1.map((o) => o.nickname),
      day2.map((o) => o.nickname),
    );
  });

  it("finds opponent by id", async () => {
    const { listDailyArenaOpponents, getArenaOpponent } =
      await import("./arenaOpponents.js");
    const now = Date.parse("2026-08-30T12:00:00Z");
    const list = listDailyArenaOpponents(now);
    const found = getArenaOpponent(list[0]!.id, now);
    assert.deepEqual(found, list[0]);
  });
});

describe("world arena opponents", () => {
  it("lists 10 deterministic opponents per day", async () => {
    const {
      listDailyWorldArenaOpponents,
      WORLD_ARENA_DAILY_OPPONENT_COUNT,
    } = await import("./worldArenaOpponents.js");
    const now = Date.parse("2026-08-30T12:00:00Z");
    const a = listDailyWorldArenaOpponents(now);
    const b = listDailyWorldArenaOpponents(now);
    assert.equal(a.length, WORLD_ARENA_DAILY_OPPONENT_COUNT);
    assert.deepEqual(a, b);
    assert.ok(a.every((o) => o.nickname.length >= 2));
    assert.ok(a.every((o) => o.enemyMonsterIds.length >= 1));
    assert.ok(a.every((o) => o.gloryReward > 0));
    const tiers = a.map((o) => o.stageId);
    assert.equal(tiers.filter((id) => id === "warena_qual").length, 5);
    assert.equal(tiers.filter((id) => id === "warena_final").length, 5);
  });

  it("changes opponents when the day changes", async () => {
    const { listDailyWorldArenaOpponents } =
      await import("./worldArenaOpponents.js");
    const day1 = listDailyWorldArenaOpponents(
      Date.parse("2026-08-30T12:00:00Z"),
    );
    const day2 = listDailyWorldArenaOpponents(
      Date.parse("2026-08-31T12:00:00Z"),
    );
    assert.notDeepEqual(
      day1.map((o) => o.nickname),
      day2.map((o) => o.nickname),
    );
  });

  it("finds opponent by id", async () => {
    const { listDailyWorldArenaOpponents, getWorldArenaOpponent } =
      await import("./worldArenaOpponents.js");
    const now = Date.parse("2026-08-30T12:00:00Z");
    const list = listDailyWorldArenaOpponents(now);
    const found = getWorldArenaOpponent(list[0]!.id, now);
    assert.deepEqual(found, list[0]);
  });
});

describe("challenge tower", () => {
  it("unlocks after chapter 2 boss and advances one floor at a time", async () => {
    const { isStageUnlocked, isStageClearedOnDifficulty } =
      await import("./progress.js");
    const { createNewSave } = await import("./loop.js");
    let save = createNewSave();
    assert.equal(isStageUnlocked(save, "toa_f1"), false);
    save = {
      ...save,
      clearedStages: [...save.clearedStages, "tower_2_7"],
    };
    assert.equal(isStageUnlocked(save, "toa_f1"), true);
    assert.equal(isStageUnlocked(save, "toa_f2"), false);
    save = { ...save, challengeTowerFloor: 1 };
    assert.equal(isStageUnlocked(save, "toa_f2"), true);
    assert.equal(isStageClearedOnDifficulty(save, "toa_f1", "normal"), true);
    assert.equal(isStageClearedOnDifficulty(save, "toa_f2", "normal"), false);
    assert.equal(isStageUnlocked(save, "toa_hard_f1"), true);
    save = { ...save, challengeTowerHardFloor: 1 };
    assert.equal(isStageUnlocked(save, "toa_hard_f2"), true);
    assert.equal(
      isStageClearedOnDifficulty(save, "toa_hard_f1", "normal"),
      true,
    );
  });

  it("resets progress on a new calendar month", async () => {
    const { syncChallengeTowerMonth, challengeTowerFloor } =
      await import("./challengeTower.js");
    const { createNewSave } = await import("./loop.js");
    const aug = Date.parse("2026-08-15T12:00:00Z");
    const sep = Date.parse("2026-09-02T12:00:00Z");
    const save = {
      ...createNewSave(aug),
      challengeTowerMonthKey: "2026-08",
      challengeTowerFloor: 42,
      challengeTowerHardMonthKey: "2026-08",
      challengeTowerHardFloor: 17,
    };
    const synced = syncChallengeTowerMonth(save, sep);
    assert.equal(synced.challengeTowerMonthKey, "2026-09");
    assert.equal(challengeTowerFloor(synced), 0);
    assert.equal(synced.challengeTowerHardMonthKey, "2026-09");
    assert.equal(challengeTowerFloor(synced, "hard"), 0);
  });

  it("grants a legend scroll on first 100F clear", async () => {
    const { applyRewards } = await import("./loop.js");
    const { getStage } = await import("stonesummoner-data");
    const { createNewSave } = await import("./loop.js");
    const stage = getStage("toa_f100")!;
    const save = {
      ...createNewSave(),
      clearedStages: ["tower_2_7"],
      challengeTowerMonthKey: "2026-08",
      challengeTowerFloor: 99,
    };
    const { save: next } = applyRewards(save, stage, true, () => 0.99);
    assert.equal(next.challengeTowerFloor, 100);
    assert.equal(next.scrollsLegend, 1);
    assert.equal(next.clearedStages.includes("toa_f100"), false);
  });

  it("tracks and rewards Hard 100F independently", async () => {
    const { applyRewards } = await import("./loop.js");
    const { getStage } = await import("stonesummoner-data");
    const { createNewSave } = await import("./loop.js");
    const stage = getStage("toa_hard_f100")!;
    const save = {
      ...createNewSave(),
      clearedStages: ["tower_2_7"],
      challengeTowerFloor: 12,
      challengeTowerHardFloor: 99,
      island: { ...createNewSave().island, crystal: 0 },
    };
    const { save: next } = applyRewards(save, stage, true, () => 0.99);
    assert.equal(next.challengeTowerFloor, 12);
    assert.equal(next.challengeTowerHardFloor, 100);
    assert.equal(next.scrollsLegend, 1);
    assert.equal(next.island.crystal, 20);
  });

  it("migrates legacy tower and arena progress without loss", () => {
    const base = createNewSave(0);
    const legacy = { ...base, challengeTowerFloor: 37, arenaAttacksToday: 3 };
    delete (legacy as Partial<typeof legacy>).challengeTowerHardFloor;
    delete (legacy as Partial<typeof legacy>).arenaInvitations;
    delete (legacy as Partial<typeof legacy>).arenaInvitationUpdatedAt;
    const migrated = migrateSave(legacy)!;
    assert.equal(migrated.challengeTowerFloor, 37);
    assert.equal(migrated.challengeTowerHardFloor, 0);
    assert.equal(migrated.arenaInvitations, 7);
  });
});
