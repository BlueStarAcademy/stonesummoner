export type BuildingId =
  | "summon_hearth"
  | "power_circle"
  | "gateway"
  | "mana_pond"
  | "crystal_mine"
  | "wish_temple";

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
    nameKo: "강화진",
    swName: "Power-Up Circle",
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
    nameKo: "진액 연못",
    swName: "Pond of Mana",
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
export const ENERGY_PER_HOUR = 10;
export const SUMMONER_EXP_PER_LEVEL = 100;
export const MAX_BUILDING_LEVEL = 10;

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
  /** YYYY-MM-DD of last wish. */
  lastWishDay?: string | null;
}

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
  return 400 + level * 350;
}

export function canUpgradeBuilding(
  island: IslandState,
  buildingId: BuildingId,
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
  const cost = buildingUpgradeManaCost(inst.level);
  if (island.mana < cost) {
    return {
      ok: false,
      reason: `마나 부족 (필요 ${cost}, 보유 ${Math.floor(island.mana)})`,
    };
  }
  return { ok: true };
}

export function upgradeBuilding(
  island: IslandState,
  buildingId: BuildingId,
): { island: IslandState; message: string } {
  const check = canUpgradeBuilding(island, buildingId);
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
    message: `${def.nameKo} Lv.${lv} (−마나 ${cost}) · ${detail}`,
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
  const updatedAt = island.energyUpdatedAt ?? now;
  if (island.energy >= max) {
    return { ...island, energyMax: max, energyUpdatedAt: now };
  }
  const hours = Math.max(0, (now - updatedAt) / 3_600_000);
  const gained = ENERGY_PER_HOUR * hours;
  const energy = Math.min(max, island.energy + gained);
  return {
    ...island,
    energyMax: max,
    energy,
    energyUpdatedAt: now,
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

/** Daily wish: mana / crystal / scroll roll once per day. */
export function runWish(
  island: IslandState,
  now = Date.now(),
  rng: () => number = Math.random,
): { island: IslandState; message: string; scrollGain: number } {
  if (!hasBuilding(island, "wish_temple") && island.summonerLevel < 7) {
    return {
      island,
      message: "소원의 사당 해금 필요 (서머너 Lv.7)",
      scrollGain: 0,
    };
  }
  const synced = syncBuildingUnlocks(island, now);
  if (!hasBuilding(synced, "wish_temple")) {
    return {
      island: synced,
      message: "소원의 사당 해금 필요 (서머너 Lv.7)",
      scrollGain: 0,
    };
  }
  const day = todayKey(now);
  if (synced.lastWishDay === day) {
    return { island: synced, message: "오늘은 이미 소원을 빌었습니다", scrollGain: 0 };
  }
  const r = rng();
  let next = { ...synced, lastWishDay: day };
  let message: string;
  let scrollGain = 0;
  if (r < 0.4) {
    const mana = 800 + Math.floor(rng() * 400);
    next = { ...next, mana: next.mana + mana };
    message = `소원: 마나 +${mana}`;
  } else if (r < 0.75) {
    const crystal = 5 + Math.floor(rng() * 6);
    next = { ...next, crystal: next.crystal + crystal };
    message = `소원: 크리스탈 +${crystal}`;
  } else {
    scrollGain = 1 + (rng() < 0.3 ? 1 : 0);
    message = `소원: 소환서 +${scrollGain}`;
  }
  return { island: next, message, scrollGain };
}

export function addSummonerExp(
  island: IslandState,
  amount: number,
): { island: IslandState; levelsGained: number } {
  let exp = (island.summonerExp ?? 0) + amount;
  let level = island.summonerLevel;
  let gained = 0;
  while (exp >= SUMMONER_EXP_PER_LEVEL) {
    exp -= SUMMONER_EXP_PER_LEVEL;
    level += 1;
    gained += 1;
  }
  let next: IslandState = {
    ...island,
    summonerLevel: level,
    summonerExp: exp,
  };
  next = syncBuildingUnlocks(next);
  return { island: next, levelsGained: gained };
}
