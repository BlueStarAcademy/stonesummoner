import {
  emptyMagicProgress,
  normalizeGearPiece,
  normalizeSummonerGear,
  stripUnenhancedStarterGear,
  resolveMonsterId,
} from "stonesummoner-data";
import { energyMaxForLevel, tickProduction } from "stonesummoner-home";
import {
  createNewSave,
  createEmptySummonerMagicLoadouts,
  createSummonerRoster,
  MAX_SUMMONER_AWAKEN,
  normalizePartyPresets,
  normalizeUnlockedSummoners,
  RAID_BOSS_MAX_HP,
  SUMMONER_ELEMENTS,
  SYMBOL_BAG_BASE_SLOTS,
  SYMBOL_BAG_MAX_SLOTS,
  type OnboardRiteSave,
  type PlayerSave,
  type SummonerElement,
} from "./loop.js";
import { normalizeDailyActivity } from "./dailyMissions.js";

function normalizeOnboardRite(raw: unknown): OnboardRiteSave | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<OnboardRiteSave>;
  const step = typeof o.step === "string" ? o.step : "gateway";
  return {
    step,
    openedStages: Boolean(o.openedStages),
    openedRegion: Boolean(o.openedRegion),
    summoned: Boolean(o.summoned),
    enhanced: Boolean(o.enhanced),
    partySet: Boolean(o.partySet),
    equipped: Boolean(o.equipped),
    hasBattleDrop: Boolean(o.hasBattleDrop),
    welcomeSeen: Boolean(o.welcomeSeen),
  };
}

/** Normalize cloud/local JSON into a full PlayerSave (preserve progress fields). */
export function migrateSave(raw: unknown): PlayerSave | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<PlayerSave>;
  if (!p.island) return null;
  const base = createNewSave();
  const roster = (p.roster?.length ? p.roster : base.roster).map((m) => ({
    ...m,
    monsterId: resolveMonsterId(m.monsterId),
    evolve: m.evolve ?? 0,
    awaken:
      typeof m.awaken === "number"
        ? Math.max(0, Math.min(1, Math.floor(m.awaken)))
        : 0,
    exp: typeof m.exp === "number" ? m.exp : 0,
    skillLevels: (m.skillLevels ?? [1, 1, 1]) as [number, number, number],
    symbolSlots: m.symbolSlots ?? [null, null, null, null, null, null],
  }));
  const islandRaw = {
    ...base.island,
    ...p.island,
    summonerExp: p.island.summonerExp ?? 0,
    energyUpdatedAt: p.island.energyUpdatedAt ?? Date.now(),
  };
  const accountLv = Math.max(
    1,
    Math.floor(islandRaw.summonerLevel ?? 1),
    ...(["fire", "water", "wind", "light", "dark"] as const).map((el) => {
      const slot = p.summoners?.[el];
      return typeof slot?.level === "number" ? Math.floor(slot.level) : 1;
    }),
  );
  const targetMax = energyMaxForLevel(accountLv);
  const island = tickProduction({
    ...islandRaw,
    energyMax: Math.max(
      targetMax,
      typeof p.island.energyMax === "number" ? p.island.energyMax : targetMax,
    ),
  });
  const activeSummoner: SummonerElement = (
    ["fire", "water", "wind", "light", "dark"] as const
  ).includes(p.activeSummoner as SummonerElement)
    ? (p.activeSummoner as SummonerElement)
    : "light";
  const party = p.party?.length ? p.party : base.party;
  const summonersRaw =
    p.summoners && typeof p.summoners === "object"
      ? { ...createSummonerRoster(), ...p.summoners }
      : createSummonerRoster({
          level: island.summonerLevel ?? 1,
          exp: island.summonerExp ?? 0,
          awaken: typeof p.summonerAwaken === "number" ? p.summonerAwaken : 0,
        });
  const summoners = { ...summonersRaw };
  for (const el of ["fire", "water", "wind", "light", "dark"] as const) {
    const cur = summoners[el] ?? { level: 1, exp: 0, awaken: 0 };
    const seedGear =
      cur.gear ?? (el === activeSummoner ? p.gear : undefined);
    summoners[el] = {
      ...cur,
      gear: stripUnenhancedStarterGear(normalizeSummonerGear(seedGear, el)),
    };
  }
  const mid: PlayerSave = {
    ...base,
    island,
    symbols: p.symbols?.length ? p.symbols : base.symbols,
    clearedStages: p.clearedStages ?? [],
    clearedHardStages: Array.isArray(p.clearedHardStages)
      ? p.clearedHardStages.filter((id): id is string => typeof id === "string")
      : [],
    clearedHellStages: Array.isArray(p.clearedHellStages)
      ? p.clearedHellStages.filter((id): id is string => typeof id === "string")
      : [],
    roster,
    party,
    scrolls: typeof p.scrolls === "number" ? p.scrolls : base.scrolls,
    scrollsPremium:
      typeof p.scrollsPremium === "number"
        ? Math.max(0, Math.floor(p.scrollsPremium))
        : base.scrollsPremium,
    scrollsMystic:
      typeof p.scrollsMystic === "number"
        ? Math.max(0, Math.floor(p.scrollsMystic))
        : base.scrollsMystic,
    gear: stripUnenhancedStarterGear(
      normalizeSummonerGear(
        summoners[activeSummoner]?.gear ?? p.gear ?? base.gear,
        activeSummoner,
      ),
    ),
    gearBag: Array.isArray(p.gearBag)
      ? p.gearBag.map((g) => normalizeGearPiece(g, g.slot)).slice(0, 40)
      : [],
    gloryPoints: typeof p.gloryPoints === "number" ? p.gloryPoints : 0,
    friendshipPoints:
      typeof p.friendshipPoints === "number" ? Math.max(0, Math.floor(p.friendshipPoints)) : 0,
    jinmunStones: typeof p.jinmunStones === "number" ? p.jinmunStones : 0,
    gloryLevels: p.gloryLevels ?? {},
    arenaBanIds: Array.isArray(p.arenaBanIds)
      ? p.arenaBanIds
          .map((id) => (typeof id === "string" ? resolveMonsterId(id) : ""))
          .filter(Boolean)
          .slice(0, 2)
      : [],
    arenaSeasonWins:
      typeof p.arenaSeasonWins === "number" ? p.arenaSeasonWins : 0,
    guildContribution:
      typeof p.guildContribution === "number" ? p.guildContribution : 0,
    dojoDrills: typeof p.dojoDrills === "number" ? p.dojoDrills : 0,
    dojoDrillDay: typeof p.dojoDrillDay === "string" ? p.dojoDrillDay : null,
    dojoDrillsToday:
      typeof p.dojoDrillsToday === "number" ? Math.max(0, Math.floor(p.dojoDrillsToday)) : 0,
    circleInscriptions:
      p.circleInscriptions && typeof p.circleInscriptions === "object"
        ? (p.circleInscriptions as PlayerSave["circleInscriptions"])
        : {},
    guildName: typeof p.guildName === "string" ? p.guildName : null,
    guildCheckInDay:
      typeof p.guildCheckInDay === "string" ? p.guildCheckInDay : null,
    guildRaidBest: typeof p.guildRaidBest === "number" ? p.guildRaidBest : 0,
    seasonRewardsClaimed:
      typeof p.seasonRewardsClaimed === "number" ? p.seasonRewardsClaimed : 0,
    summonerAwaken: Math.min(
      MAX_SUMMONER_AWAKEN,
      Math.max(
        0,
        Math.floor(
          typeof p.summonerAwaken === "number" ? p.summonerAwaken : 0,
        ),
      ),
    ),
    skillTree: Array.isArray(p.skillTree)
      ? p.skillTree.filter((id): id is string => typeof id === "string")
      : [],
    summonerMagic: (() => {
      const rawMagic = p.summonerMagic;
      const magicBase = {
        fire: emptyMagicProgress(),
        water: emptyMagicProgress(),
        wind: emptyMagicProgress(),
        light: emptyMagicProgress(),
        dark: emptyMagicProgress(),
      };
      if (!rawMagic || typeof rawMagic !== "object") return magicBase;
      for (const el of ["fire", "water", "wind", "light", "dark"] as const) {
        const slot = (rawMagic as Record<string, unknown>)[el];
        if (!slot || typeof slot !== "object") continue;
        const ranks =
          (slot as { ranks?: Record<string, number> }).ranks &&
          typeof (slot as { ranks: unknown }).ranks === "object"
            ? (slot as { ranks: Record<string, number> }).ranks
            : {};
        const branch = (slot as { branch?: string }).branch;
        magicBase[el] = {
          ranks: { ...ranks },
          branch: branch === "A" || branch === "B" ? branch : null,
        };
      }
      return magicBase;
    })(),
    summonerMagicLoadouts: (() => {
      const baseLoadouts = createEmptySummonerMagicLoadouts();
      const rawLoadouts = p.summonerMagicLoadouts;
      if (!rawLoadouts || typeof rawLoadouts !== "object") return baseLoadouts;
      for (const el of ["fire", "water", "wind", "light", "dark"] as const) {
        const raw = (rawLoadouts as Record<string, unknown>)[el];
        if (!Array.isArray(raw)) continue;
        baseLoadouts[el] = [
          typeof raw[0] === "string" ? raw[0] : null,
          typeof raw[1] === "string" ? raw[1] : null,
        ];
      }
      return baseLoadouts;
    })(),
    equipVaultWeekKey:
      typeof p.equipVaultWeekKey === "string" ? p.equipVaultWeekKey : null,
    equipVaultWeekEntries:
      typeof p.equipVaultWeekEntries === "number"
        ? Math.max(0, Math.floor(p.equipVaultWeekEntries))
        : 0,
    symbolBagSlots: (() => {
      const rawSlots =
        typeof p.symbolBagSlots === "number"
          ? p.symbolBagSlots
          : SYMBOL_BAG_BASE_SLOTS;
      return Math.min(
        SYMBOL_BAG_MAX_SLOTS,
        Math.max(SYMBOL_BAG_BASE_SLOTS, Math.floor(rawSlots)),
      );
    })(),
    awakenMats:
      p.awakenMats && typeof p.awakenMats === "object" ? p.awakenMats : {},
    skillMats: typeof p.skillMats === "number" ? Math.max(0, p.skillMats) : 0,
    arenaDefense:
      p.arenaDefense &&
      typeof p.arenaDefense === "object" &&
      Array.isArray(p.arenaDefense.party)
        ? {
            summoner: (
              ["fire", "water", "wind", "light", "dark"] as const
            ).includes(p.arenaDefense.summoner as SummonerElement)
              ? (p.arenaDefense.summoner as SummonerElement)
              : "light",
            party: p.arenaDefense.party
              .filter((uid): uid is string => typeof uid === "string")
              .slice(0, 4),
          }
        : null,
    arenaAttacksToday:
      typeof p.arenaAttacksToday === "number"
        ? Math.max(0, Math.floor(p.arenaAttacksToday))
        : 0,
    arenaAttackDay:
      typeof p.arenaAttackDay === "string" ? p.arenaAttackDay : null,
    shopDayKey: typeof p.shopDayKey === "string" ? p.shopDayKey : null,
    shopSoldIds: Array.isArray(p.shopSoldIds)
      ? p.shopSoldIds.filter((id): id is string => typeof id === "string")
      : [],
    shopBuyCounts: (() => {
      const raw = p.shopBuyCounts;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) {
          out[k] = Math.max(0, Math.floor(v));
        }
      }
      return out;
    })(),
    trialTokens:
      typeof p.trialTokens === "number"
        ? Math.max(0, Math.floor(p.trialTokens))
        : 0,
    trialTitleUnlocked: !!p.trialTitleUnlocked,
    guildWeekKey: typeof p.guildWeekKey === "string" ? p.guildWeekKey : null,
    guildWeekContrib:
      typeof p.guildWeekContrib === "number"
        ? Math.max(0, Math.floor(p.guildWeekContrib))
        : 0,
    guildCheckInStreak:
      typeof p.guildCheckInStreak === "number"
        ? Math.max(0, Math.floor(p.guildCheckInStreak))
        : 0,
    guildChestClaimedWeek:
      typeof p.guildChestClaimedWeek === "string"
        ? p.guildChestClaimedWeek
        : null,
    raidBossHp:
      typeof p.raidBossHp === "number"
        ? Math.max(0, Math.min(RAID_BOSS_MAX_HP, Math.floor(p.raidBossHp)))
        : RAID_BOSS_MAX_HP,
    raidAttemptsDay:
      typeof p.raidAttemptsDay === "number"
        ? Math.max(0, Math.floor(p.raidAttemptsDay))
        : 0,
    raidAttemptDay:
      typeof p.raidAttemptDay === "string" ? p.raidAttemptDay : null,
    raidMilestonesClaimed: Array.isArray(p.raidMilestonesClaimed)
      ? p.raidMilestonesClaimed
          .filter((n): n is number => typeof n === "number")
          .map((n) => Math.floor(n))
      : [],
    raidWeekKey: typeof p.raidWeekKey === "string" ? p.raidWeekKey : null,
    grindstones:
      typeof p.grindstones === "number"
        ? Math.max(0, Math.floor(p.grindstones))
        : base.grindstones,
    imprintStones:
      typeof p.imprintStones === "number"
        ? Math.max(0, Math.floor(p.imprintStones))
        : base.imprintStones,
    claimedMailIds: Array.isArray(p.claimedMailIds)
      ? p.claimedMailIds.filter((id): id is string => typeof id === "string")
      : [],
    updatedAt:
      typeof p.updatedAt === "number" && Number.isFinite(p.updatedAt)
        ? Math.max(0, Math.floor(p.updatedAt))
        : 0,
    dailyActivity: normalizeDailyActivity(p.dailyActivity),
    claimedMissionKeys: Array.isArray(p.claimedMissionKeys)
      ? p.claimedMissionKeys.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    claimedMainQuestIds: Array.isArray(p.claimedMainQuestIds)
      ? p.claimedMainQuestIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    profileIconId:
      typeof p.profileIconId === "string" && p.profileIconId.trim()
        ? resolveMonsterId(p.profileIconId)
        : null,
    profileNickname:
      typeof p.profileNickname === "string" && p.profileNickname.trim()
        ? p.profileNickname.trim()
        : null,
    nicknameChangeCount:
      typeof p.nicknameChangeCount === "number"
        ? Math.max(0, Math.floor(p.nicknameChangeCount))
        : 0,
    onboardRite: normalizeOnboardRite(p.onboardRite),
    activeSummoner,
    summoners,
    unlockedSummoners: Array.isArray(p.unlockedSummoners)
      ? normalizeUnlockedSummoners(p.unlockedSummoners, [activeSummoner])
      : [...SUMMONER_ELEMENTS],
    starterSummonerPicked:
      typeof p.starterSummonerPicked === "boolean"
        ? p.starterSummonerPicked
        : !Array.isArray(p.unlockedSummoners),
  };
  const presets = normalizePartyPresets(mid, p.partyPresets);
  const activePartyPreset =
    typeof p.activePartyPreset === "number"
      ? Math.max(0, Math.min(4, Math.floor(p.activePartyPreset)))
      : 0;
  return {
    ...mid,
    partyPresets: presets,
    activePartyPreset,
  };
}

function saveProgressScore(save: PlayerSave): number {
  const daily = save.dailyActivity;
  let dailySum = 0;
  if (daily) {
    for (const value of Object.values(daily)) {
      if (typeof value === "number") dailySum += value;
    }
  }
  return (
    (save.claimedMainQuestIds?.length ?? 0) * 1_000_000 +
    (save.claimedMissionKeys?.length ?? 0) * 10_000 +
    dailySum * 100 +
    (save.clearedStages?.length ?? 0) * 10 +
    Math.floor(save.island?.mana ?? 0)
  );
}

/** Prefer the freshest client save so a stale cloud blob cannot wipe mission progress. */
export function pickPreferredSave(
  local: PlayerSave | null,
  remote: PlayerSave | null,
): PlayerSave {
  if (!local && !remote) return createNewSave();
  if (!local) return remote!;
  if (!remote) return local;
  const localAt = local.updatedAt ?? 0;
  const remoteAt = remote.updatedAt ?? 0;
  if (localAt !== remoteAt) return localAt > remoteAt ? local : remote;
  return saveProgressScore(local) >= saveProgressScore(remote) ? local : remote;
}
