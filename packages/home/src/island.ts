export type BuildingId =
  | "summon_hearth"
  | "power_circle"
  | "gateway"
  | "mana_pond"
  | "crystal_mine"
  | "wish_temple"
  | "fusion_star"
  | "fuse_center"
  | "craft_hall"
  | "practice_dojo"
  | "guild_hall";

export interface BuildingDef {
  id: BuildingId;
  nameKo: string;
  swName: string;
  kind: "function" | "production";
  resource?: "mana" | "crystal";
  manaPerHour?: number;
  storageCap?: number;
  crystalPerHour?: number;
  crystalCap?: number;
  /** Summoner level required to unlock (0 = starter). */
  unlockLevel: number;
}

export const PHASE_BUILDINGS: BuildingDef[] = [
  {
    id: "summon_hearth",
    nameKo: "소환진",
    swName: "Summonhenge",
    kind: "function",
    unlockLevel: 1,
  },
  {
    id: "power_circle",
    nameKo: "조합진",
    swName: "Fusion Hexagram",
    kind: "function",
    unlockLevel: 1,
  },
  {
    id: "gateway",
    nameKo: "출정문",
    swName: "Gateway",
    kind: "function",
    unlockLevel: 1,
  },
  {
    id: "mana_pond",
    nameKo: "골드 연못",
    swName: "Pond of Gold",
    kind: "production",
    resource: "mana",
    manaPerHour: 441,
    storageCap: 4000,
    unlockLevel: 1,
  },
  {
    id: "wish_temple",
    nameKo: "소원의 사당",
    swName: "Temple of Wishes",
    kind: "function",
    unlockLevel: 7,
  },
  {
    id: "crystal_mine",
    nameKo: "수정 광맥",
    swName: "Crystal Mine",
    kind: "production",
    resource: "crystal",
    crystalPerHour: 2.5,
    crystalCap: 30,
    unlockLevel: 10,
  },
  {
    id: "fusion_star",
    nameKo: "융합의 별",
    swName: "Fusion Hexagram",
    kind: "function",
    unlockLevel: 17,
  },
  {
    id: "fuse_center",
    nameKo: "정수 공방",
    swName: "Fuse Center",
    kind: "function",
    unlockLevel: 12,
  },
  {
    id: "craft_hall",
    nameKo: "제작소",
    swName: "Craft Building",
    kind: "function",
    unlockLevel: 19,
  },
  {
    id: "practice_dojo",
    nameKo: "진문 수련장",
    swName: "Practice Dojo",
    kind: "function",
    unlockLevel: 8,
  },
  {
    id: "guild_hall",
    nameKo: "길드 홀",
    swName: "Guild Hall",
    kind: "function",
    unlockLevel: 12,
  },
];

/** @deprecated alias */
export const PHASE1_BUILDINGS = PHASE_BUILDINGS.filter((b) => b.unlockLevel <= 1);

export interface BuildingInstance {
  id: BuildingId;
  level: number;
  storedMana: number;
  storedCrystal: number;
  lastUpdatedAt: number;
}

export const ENERGY_MAX = 100;
/** Extra max energy granted per summoner account level above 1. */
export const ENERGY_MAX_PER_LEVEL = 2;
/** Milliseconds per +1 energy while below max (3 minutes). */
export const ENERGY_REGEN_MS = 180_000;
/** Derived rate (1 per 3 minutes). Kept for callers that still read per-hour. */
export const ENERGY_PER_HOUR = Math.round(3_600_000 / ENERGY_REGEN_MS);
/**
 * Summoners War player-account EXP required from each level to the next.
 * The documented table covers Lv.1–20; later levels retain an increasing
 * curve instead of reverting to the former flat 100 EXP placeholder.
 */
export const SUMMONER_EXP_TO_NEXT: readonly number[] = [
  150, 360, 670, 900, 2070, 3110, 5140, 6440, 8596, 10084,
  12848, 14932, 17145, 19604, 24921, 31550, 35955, 42030, 48885,
] as const;
/** @deprecated Use summonerExpToNext(level); the curve is no longer flat. */
export const SUMMONER_EXP_PER_LEVEL = SUMMONER_EXP_TO_NEXT[0];
export const MAX_BUILDING_LEVEL = 10;

/**
 * Account level required to raise a production building to this building level.
 * Index is building level (1–10). Early steps match 3→2, 5→3, 8→4, 12→5;
 * later gaps grow by +1 each tier.
 */
export const PROD_BUILDING_NEED_ACCOUNT: readonly number[] = [
  0, 1, 3, 5, 8, 12, 17, 23, 30, 38, 47,
];

/** Account level required to reach this production-building level. */
export function accountLevelForProdBuilding(buildingLevel: number): number {
  const lv = Math.max(1, Math.min(MAX_BUILDING_LEVEL, Math.floor(buildingLevel)));
  return PROD_BUILDING_NEED_ACCOUNT[lv] ?? 1;
}

/** Highest production-building level allowed at this account level. */
export function maxProdBuildingLevelForAccount(accountLevel: number): number {
  const user = Math.max(1, Math.floor(accountLevel));
  let allowed = 1;
  for (let b = 1; b <= MAX_BUILDING_LEVEL; b++) {
    const need = PROD_BUILDING_NEED_ACCOUNT[b] ?? Number.POSITIVE_INFINITY;
    if (user >= need) allowed = b;
    else break;
  }
  return allowed;
}

/** EXP required to advance a summoner/account from `level` to `level + 1`. */
export function summonerExpToNext(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  const known = SUMMONER_EXP_TO_NEXT[lv - 1];
  if (known != null) return known;
  let required = SUMMONER_EXP_TO_NEXT[SUMMONER_EXP_TO_NEXT.length - 1]!;
  for (let current = SUMMONER_EXP_TO_NEXT.length + 1; current < lv; current++) {
    required = Math.round(required * 1.16);
  }
  return required;
}

/** Max energy for a summoner/account level (Lv.1 = ENERGY_MAX). */
export function energyMaxForLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return ENERGY_MAX + (lv - 1) * ENERGY_MAX_PER_LEVEL;
}

export interface IslandState {
  summonerLevel: number;
  summonerExp: number;
  mana: number;
  crystal: number;
  energy: number;
  energyMax: number;
  energyUpdatedAt: number;
  buildings: BuildingInstance[];
  /** Glory fountain etc. mana production bonus (fraction). */
  manaProdBonus?: number;
  /**
   * YYYY-MM-DD of last successful wish (daily mission / legacy).
   * Prefer wishDayKey + wishUsesToday for limit checks.
   */
  lastWishDay?: string | null;
  /** YYYY-MM-DD that wishUsesToday applies to. */
  wishDayKey?: string | null;
  /** Successful wishes on wishDayKey (0..WISH_DAILY_LIMIT). */
  wishUsesToday?: number;
  /** Epoch ms when the next wish becomes available (cooldown end). */
  wishCooldownUntil?: number;
}

/** Max wishes per calendar day. */
export const WISH_DAILY_LIMIT = 3;
/** Cooldown after each wish before the next cast. */
export const WISH_COOLDOWN_MS = 3_600_000;

export function createStarterIsland(now = Date.now()): IslandState {
  return {
    summonerLevel: 1,
    summonerExp: 0,
    mana: 3000,
    crystal: 50,
    energy: 80,
    energyMax: ENERGY_MAX,
    energyUpdatedAt: now,
    manaProdBonus: 0,
    lastWishDay: null,
    wishDayKey: null,
    wishUsesToday: 0,
    wishCooldownUntil: 0,
    buildings: PHASE_BUILDINGS.filter((b) => b.unlockLevel <= 1).map((b) => ({
      id: b.id,
      level: 1,
      storedMana: 0,
      storedCrystal: 0,
      lastUpdatedAt: now,
    })),
  };
}

function defOf(id: BuildingId): BuildingDef {
  const d = PHASE_BUILDINGS.find((b) => b.id === id);
  if (!d) throw new Error(`Unknown building ${id}`);
  return d;
}

export function productionManaPerHour(
  def: BuildingDef,
  level: number,
  manaProdBonus = 0,
): number {
  if (!def.manaPerHour) return 0;
  return def.manaPerHour * Math.max(1, level) * (1 + manaProdBonus);
}

export function productionStorageCap(def: BuildingDef, level: number): number {
  if (!def.storageCap) return 0;
  return def.storageCap * Math.max(1, level);
}

export function productionCrystalPerHour(def: BuildingDef, level: number): number {
  if (!def.crystalPerHour) return 0;
  return def.crystalPerHour * Math.max(1, level);
}

export function productionCrystalCap(def: BuildingDef, level: number): number {
  if (!def.crystalCap) return 0;
  return def.crystalCap * Math.max(1, level);
}

export function buildingUpgradeManaCost(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return 2500 * lv + 800 * lv * lv;
}

export function canUpgradeBuilding(
  island: IslandState,
  buildingId: BuildingId,
  accountLevel = island.summonerLevel,
): { ok: true } | { ok: false; reason: string } {
  const inst = island.buildings.find((b) => b.id === buildingId);
  if (!inst) return { ok: false, reason: "건물 없음" };
  const def = defOf(buildingId);
  if (def.kind !== "production") {
    return { ok: false, reason: "생산 건물만 레벨업" };
  }
  if (inst.level >= MAX_BUILDING_LEVEL) {
    return { ok: false, reason: `최대 레벨(+${MAX_BUILDING_LEVEL})` };
  }
  const need = accountLevelForProdBuilding(inst.level + 1);
  const userLv = Math.max(1, Math.floor(accountLevel));
  if (userLv < need) {
    return {
      ok: false,
      reason: `계정 Lv.${need}+ 필요 (현재 ${userLv})`,
    };
  }
  const cost = buildingUpgradeManaCost(inst.level);
  if (island.mana < cost) {
    return {
      ok: false,
      reason: `골드 부족 (필요 ${cost}, 보유 ${Math.floor(island.mana)})`,
    };
  }
  return { ok: true };
}

export function upgradeBuilding(
  island: IslandState,
  buildingId: BuildingId,
  accountLevel = island.summonerLevel,
): { island: IslandState; message: string } {
  const check = canUpgradeBuilding(island, buildingId, accountLevel);
  if (!check.ok) {
    return { island, message: check.reason };
  }
  const cost = buildingUpgradeManaCost(
    island.buildings.find((b) => b.id === buildingId)!.level,
  );
  const buildings = island.buildings.map((inst) =>
    inst.id === buildingId ? { ...inst, level: inst.level + 1 } : inst,
  );
  const next = { ...island, mana: island.mana - cost, buildings };
  const lv = buildings.find((b) => b.id === buildingId)!.level;
  const def = defOf(buildingId);
  const detail =
    def.resource === "crystal"
      ? `크리스탈 ${productionCrystalPerHour(def, lv)}/hr · 저장 ${productionCrystalCap(def, lv)}`
      : `생산 ${productionManaPerHour(def, lv, island.manaProdBonus ?? 0)}/hr · 저장 ${productionStorageCap(def, lv)}`;
  return {
    island: next,
    message: `${def.nameKo} Lv.${lv} (−골드 ${cost}) · ${detail}`,
  };
}

/** Unlock Phase 2 buildings when summoner level is enough. */
export function syncBuildingUnlocks(
  island: IslandState,
  now = Date.now(),
): IslandState {
  const have = new Set(island.buildings.map((b) => b.id));
  const added: BuildingInstance[] = [];
  for (const def of PHASE_BUILDINGS) {
    if (have.has(def.id)) continue;
    if (island.summonerLevel < def.unlockLevel) continue;
    added.push({
      id: def.id,
      level: 1,
      storedMana: 0,
      storedCrystal: 0,
      lastUpdatedAt: now,
    });
  }
  if (added.length === 0) return island;
  return { ...island, buildings: [...island.buildings, ...added] };
}

function tickEnergy(island: IslandState, now: number): IslandState {
  const max = island.energyMax ?? ENERGY_MAX;
  const cur = Math.floor(island.energy);
  const updatedAt = island.energyUpdatedAt ?? now;
  // Preserve overflow above max (e.g. mail rewards); regen only fills up to max.
  if (cur >= max) {
    return { ...island, energyMax: max, energy: cur };
  }
  const elapsed = Math.max(0, now - updatedAt);
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained <= 0) {
    return { ...island, energyMax: max, energy: cur };
  }
  const energy = Math.min(max, cur + gained);
  return {
    ...island,
    energyMax: max,
    energy,
    // Keep remainder so the next-point countdown stays continuous.
    energyUpdatedAt: energy >= max ? now : updatedAt + gained * ENERGY_REGEN_MS,
  };
}

/** Ms until the next +1 energy, or null when already at max. */
export function energyRegenRemainingMs(
  island: IslandState,
  now = Date.now(),
): number | null {
  const max = island.energyMax ?? ENERGY_MAX;
  if (Math.floor(island.energy) >= max) return null;
  const updatedAt = island.energyUpdatedAt ?? now;
  const elapsed = Math.max(0, now - updatedAt);
  if (elapsed > 0 && elapsed % ENERGY_REGEN_MS === 0) return 0;
  return ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS);
}

/** Spend energy; starts the regen clock only when leaving max. */
export function spendEnergy(
  island: IslandState,
  cost: number,
  now = Date.now(),
): IslandState {
  const max = island.energyMax ?? ENERGY_MAX;
  const before = Math.floor(island.energy);
  const next = before - Math.max(0, Math.floor(cost));
  if (next < 0 || cost <= 0) {
    return { ...island, energy: before, energyMax: max };
  }
  return {
    ...island,
    energyMax: max,
    energy: next,
    energyUpdatedAt: before >= max ? now : (island.energyUpdatedAt ?? now),
  };
}

export function tickProduction(island: IslandState, now = Date.now()): IslandState {
  let next = syncBuildingUnlocks(tickEnergy(island, now), now);
  const bonus = next.manaProdBonus ?? 0;
  const buildings = next.buildings.map((inst) => {
    const def = defOf(inst.id);
    if (def.kind !== "production") {
      return { ...inst, lastUpdatedAt: now, storedCrystal: inst.storedCrystal ?? 0 };
    }
    const hours = Math.max(0, (now - inst.lastUpdatedAt) / 3_600_000);
    let storedMana = inst.storedMana;
    let storedCrystal = inst.storedCrystal ?? 0;
    if (def.resource === "mana" && def.manaPerHour && def.storageCap) {
      const rate = productionManaPerHour(def, inst.level, bonus);
      const cap = productionStorageCap(def, inst.level);
      storedMana = Math.min(cap, storedMana + rate * hours);
    }
    if (def.resource === "crystal" && def.crystalPerHour && def.crystalCap) {
      const rate = productionCrystalPerHour(def, inst.level);
      const cap = productionCrystalCap(def, inst.level);
      storedCrystal = Math.min(cap, storedCrystal + rate * hours);
    }
    return { ...inst, storedMana, storedCrystal, lastUpdatedAt: now };
  });
  return { ...next, buildings };
}

export function collectMana(
  island: IslandState,
  buildingId: BuildingId = "mana_pond",
  now = Date.now(),
): IslandState {
  let next = tickProduction(island, now);
  const buildings = next.buildings.map((inst) => {
    if (inst.id !== buildingId) return inst;
    next = { ...next, mana: next.mana + Math.floor(inst.storedMana) };
    return { ...inst, storedMana: 0, lastUpdatedAt: now };
  });
  return { ...next, buildings };
}

export function collectCrystal(
  island: IslandState,
  buildingId: BuildingId = "crystal_mine",
  now = Date.now(),
): IslandState {
  let next = tickProduction(island, now);
  const buildings = next.buildings.map((inst) => {
    if (inst.id !== buildingId) return inst;
    const gained = Math.floor(inst.storedCrystal ?? 0);
    next = { ...next, crystal: next.crystal + gained };
    return { ...inst, storedCrystal: 0, lastUpdatedAt: now };
  });
  return { ...next, buildings };
}

export function hasBuilding(island: IslandState, id: BuildingId): boolean {
  return island.buildings.some((b) => b.id === id);
}

export function todayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export type WishRewardKind =
  | "mana"
  | "crystal"
  | "scroll"
  | "energy"
  | "skill_mats"
  | "jinmun"
  | "grindstone"
  | "imprint_stone";

export type WishReward = {
  kind: WishRewardKind;
  amount: number;
};

export type WishPoolEntry = {
  kind: WishRewardKind;
  /** Relative roll weight (not shown in UI). */
  weight: number;
  min: number;
  max: number;
};

/**
 * Wish temple reward table.
 * Common: gold / energy / skill mats / crystal / scroll.
 * Rare: jinmun / grindstone / imprint stone.
 */
export const WISH_REWARD_POOL: readonly WishPoolEntry[] = [
  { kind: "mana", weight: 28, min: 800, max: 1199 },
  { kind: "energy", weight: 18, min: 10, max: 20 },
  { kind: "skill_mats", weight: 16, min: 2, max: 5 },
  { kind: "crystal", weight: 14, min: 5, max: 10 },
  { kind: "scroll", weight: 10, min: 1, max: 2 },
  { kind: "jinmun", weight: 6, min: 1, max: 2 },
  { kind: "grindstone", weight: 5, min: 1, max: 1 },
  { kind: "imprint_stone", weight: 3, min: 1, max: 1 },
];

function wishPoolTotalWeight(): number {
  return WISH_REWARD_POOL.reduce((sum, row) => sum + row.weight, 0);
}

function pickWishPoolEntry(rng: () => number): WishPoolEntry {
  const total = wishPoolTotalWeight();
  let ticket = rng() * total;
  for (const row of WISH_REWARD_POOL) {
    ticket -= row.weight;
    if (ticket < 0) return row;
  }
  return WISH_REWARD_POOL[WISH_REWARD_POOL.length - 1]!;
}

function rollWishAmount(entry: WishPoolEntry, rng: () => number): number {
  if (entry.max <= entry.min) return entry.min;
  return entry.min + Math.floor(rng() * (entry.max - entry.min + 1));
}

function wishRewardMessage(kind: WishRewardKind, amount: number): string {
  switch (kind) {
    case "mana":
      return `소원: 골드 +${amount}`;
    case "crystal":
      return `소원: 크리스탈 +${amount}`;
    case "scroll":
      return `소원: 소환서 +${amount}`;
    case "energy":
      return `소원: 에너지 +${amount}`;
    case "skill_mats":
      return `소원: 스킬재료 +${amount}`;
    case "jinmun":
      return `소원: 진문석 +${amount}`;
    case "grindstone":
      return `소원: 연마석 +${amount}`;
    case "imprint_stone":
      return `소원: 각인석 +${amount}`;
  }
}

/** Reset daily wish counter when the calendar day changes. */
export function syncWishDay(island: IslandState, now = Date.now()): IslandState {
  const day = todayKey(now);
  if (island.wishDayKey === day) {
    return {
      ...island,
      wishUsesToday: Math.max(0, Math.floor(island.wishUsesToday ?? 0)),
      wishCooldownUntil: Math.max(0, Math.floor(island.wishCooldownUntil ?? 0)),
    };
  }
  // Legacy: one wish already used today via lastWishDay only.
  const legacyUsed =
    island.lastWishDay === day && (island.wishUsesToday == null || island.wishUsesToday <= 0)
      ? 1
      : 0;
  return {
    ...island,
    wishDayKey: day,
    wishUsesToday: legacyUsed,
    wishCooldownUntil: Math.max(0, Math.floor(island.wishCooldownUntil ?? 0)),
  };
}

export function wishUsesToday(island: IslandState, now = Date.now()): number {
  return syncWishDay(island, now).wishUsesToday ?? 0;
}

export function wishUsesRemaining(island: IslandState, now = Date.now()): number {
  return Math.max(0, WISH_DAILY_LIMIT - wishUsesToday(island, now));
}

/** Ms until cooldown ends; 0 if ready (ignores daily cap). */
export function wishCooldownRemainingMs(
  island: IslandState,
  now = Date.now(),
): number {
  const until = Math.max(0, Math.floor(island.wishCooldownUntil ?? 0));
  return Math.max(0, until - now);
}

export function canWishNow(island: IslandState, now = Date.now()): boolean {
  const synced = syncWishDay(island, now);
  if ((synced.wishUsesToday ?? 0) >= WISH_DAILY_LIMIT) return false;
  if (wishCooldownRemainingMs(synced, now) > 0) return false;
  return true;
}

/** Daily wish: weighted roll, up to WISH_DAILY_LIMIT/day with WISH_COOLDOWN_MS between casts. */
export function runWish(
  island: IslandState,
  now = Date.now(),
  rng: () => number = Math.random,
): {
  island: IslandState;
  message: string;
  /** @deprecated Prefer reward.amount when kind is scroll. */
  scrollGain: number;
  reward?: WishReward;
} {
  if (!hasBuilding(island, "wish_temple") && island.summonerLevel < 7) {
    return {
      island,
      message: "소원의 사당 해금 필요 (소환사 Lv.7)",
      scrollGain: 0,
    };
  }
  let synced = syncBuildingUnlocks(island, now);
  if (!hasBuilding(synced, "wish_temple")) {
    return {
      island: synced,
      message: "소원의 사당 해금 필요 (소환사 Lv.7)",
      scrollGain: 0,
    };
  }
  synced = syncWishDay(synced, now);
  const used = synced.wishUsesToday ?? 0;
  if (used >= WISH_DAILY_LIMIT) {
    return {
      island: synced,
      message: `오늘은 기원을 ${WISH_DAILY_LIMIT}회 모두 사용했습니다`,
      scrollGain: 0,
    };
  }
  const coolMs = wishCooldownRemainingMs(synced, now);
  if (coolMs > 0) {
    const mins = Math.ceil(coolMs / 60_000);
    return {
      island: synced,
      message: `기원 쿨타임 ${mins}분 남음`,
      scrollGain: 0,
    };
  }
  const day = todayKey(now);
  const entry = pickWishPoolEntry(rng);
  const amount = rollWishAmount(entry, rng);
  let next: IslandState = {
    ...synced,
    lastWishDay: day,
    wishDayKey: day,
    wishUsesToday: used + 1,
    wishCooldownUntil: now + WISH_COOLDOWN_MS,
  };
  if (entry.kind === "mana") {
    next = { ...next, mana: next.mana + amount };
  } else if (entry.kind === "crystal") {
    next = { ...next, crystal: next.crystal + amount };
  } else if (entry.kind === "energy") {
    const max = next.energyMax ?? ENERGY_MAX;
    next = {
      ...next,
      energy: Math.min(max, next.energy + amount),
    };
  }
  const reward: WishReward = { kind: entry.kind, amount };
  return {
    island: next,
    message: wishRewardMessage(entry.kind, amount),
    scrollGain: entry.kind === "scroll" ? amount : 0,
    reward,
  };
}

export function addSummonerExp(
  island: IslandState,
  amount: number,
): { island: IslandState; levelsGained: number } {
  let exp = (island.summonerExp ?? 0) + amount;
  let level = island.summonerLevel;
  let gained = 0;
  while (exp >= summonerExpToNext(level)) {
    exp -= summonerExpToNext(level);
    level += 1;
    gained += 1;
  }
  let next: IslandState = {
    ...island,
    summonerLevel: level,
    summonerExp: exp,
    energyMax: Math.max(island.energyMax ?? ENERGY_MAX, energyMaxForLevel(level)),
  };
  next = syncBuildingUnlocks(next);
  return { island: next, levelsGained: gained };
}
