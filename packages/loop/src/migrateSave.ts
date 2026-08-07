import {
  emptyMagicProgress,
  normalizeGearPiece,
  normalizeSummonerGear,
  resolveMonsterId,
} from "stonesummoner-data";
import { tickProduction } from "stonesummoner-home";
import {
  createNewSave,
  createSummonerRoster,
  MAX_SUMMONER_AWAKEN,
  normalizePartyPresets,
  RAID_BOSS_MAX_HP,
  SYMBOL_BAG_BASE_SLOTS,
  SYMBOL_BAG_MAX_SLOTS,
  type PlayerSave,
  type SummonerElement,
} from "./loop.js";

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
  const island = tickProduction({
    ...base.island,
    ...p.island,
    summonerExp: p.island.summonerExp ?? 0,
    energyMax: p.island.energyMax ?? 100,
    energyUpdatedAt: p.island.energyUpdatedAt ?? Date.now(),
  });
  const activeSummoner: SummonerElement = (
    ["fire", "water", "wind", "light", "dark"] as const
  ).includes(p.activeSummoner as SummonerElement)
    ? (p.activeSummoner as SummonerElement)
    : "light";
  const party = p.party?.length ? p.party : base.party;
  const mid: PlayerSave = {
    ...base,
    island,
    symbols: p.symbols?.length ? p.symbols : base.symbols,
    clearedStages: p.clearedStages ?? [],
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
    gear: normalizeSummonerGear(p.gear ?? base.gear),
    gearBag: Array.isArray(p.gearBag)
      ? p.gearBag.map((g) => normalizeGearPiece(g, g.slot)).slice(0, 40)
      : [],
    gloryPoints: typeof p.gloryPoints === "number" ? p.gloryPoints : 0,
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
    claimedMailIds: Array.isArray(p.claimedMailIds)
      ? p.claimedMailIds.filter((id): id is string => typeof id === "string")
      : [],
    claimedMissionKeys: Array.isArray(p.claimedMissionKeys)
      ? p.claimedMissionKeys.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    activeSummoner,
    summoners:
      p.summoners && typeof p.summoners === "object"
        ? { ...createSummonerRoster(), ...p.summoners }
        : createSummonerRoster({
            level: island.summonerLevel ?? 1,
            exp: island.summonerExp ?? 0,
            awaken: typeof p.summonerAwaken === "number" ? p.summonerAwaken : 0,
          }),
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
