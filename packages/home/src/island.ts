export type BuildingId =
  | "summon_hearth"
  | "power_circle"
  | "gateway"
  | "mana_pond";

export interface BuildingDef {
  id: BuildingId;
  nameKo: string;
  swName: string;
  kind: "function" | "production";
  /** Mana per hour when kind=production */
  manaPerHour?: number;
  storageCap?: number;
}

export const PHASE1_BUILDINGS: BuildingDef[] = [
  {
    id: "summon_hearth",
    nameKo: "소환진",
    swName: "Summonhenge",
    kind: "function",
  },
  {
    id: "power_circle",
    nameKo: "강화진",
    swName: "Power-Up Circle",
    kind: "function",
  },
  {
    id: "gateway",
    nameKo: "출정문",
    swName: "Gateway",
    kind: "function",
  },
  {
    id: "mana_pond",
    nameKo: "진액 연못",
    swName: "Pond of Mana",
    kind: "production",
    manaPerHour: 441,
    storageCap: 4000,
  },
];

export interface BuildingInstance {
  id: BuildingId;
  level: number;
  /** Accumulated mana waiting to collect (production only). */
  storedMana: number;
  /** Epoch ms of last production update. */
  lastUpdatedAt: number;
}

export const ENERGY_MAX = 100;
/** Energy restored per hour (offline-friendly). */
export const ENERGY_PER_HOUR = 10;
export const SUMMONER_EXP_PER_LEVEL = 100;

export interface IslandState {
  summonerLevel: number;
  /** Progress toward next summoner level. */
  summonerExp: number;
  mana: number;
  crystal: number;
  energy: number;
  energyMax: number;
  /** Epoch ms of last energy regen tick. */
  energyUpdatedAt: number;
  buildings: BuildingInstance[];
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
    buildings: PHASE1_BUILDINGS.map((b) => ({
      id: b.id,
      level: 1,
      storedMana: 0,
      lastUpdatedAt: now,
    })),
  };
}

function defOf(id: BuildingId): BuildingDef {
  const d = PHASE1_BUILDINGS.find((b) => b.id === id);
  if (!d) throw new Error(`Unknown building ${id}`);
  return d;
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

/** Accrue mana production + energy regen based on elapsed time. */
export function tickProduction(island: IslandState, now = Date.now()): IslandState {
  let next = tickEnergy(island, now);
  const buildings = next.buildings.map((inst) => {
    const def = defOf(inst.id);
    if (def.kind !== "production" || !def.manaPerHour || !def.storageCap) {
      return { ...inst, lastUpdatedAt: now };
    }
    const hours = Math.max(0, (now - inst.lastUpdatedAt) / 3_600_000);
    const gained = def.manaPerHour * hours * inst.level;
    const storedMana = Math.min(def.storageCap, inst.storedMana + gained);
    return { ...inst, storedMana, lastUpdatedAt: now };
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

export function hasBuilding(island: IslandState, id: BuildingId): boolean {
  return island.buildings.some((b) => b.id === id);
}

/** Add summoner EXP; returns leveled island + levels gained. */
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
  return {
    island: { ...island, summonerLevel: level, summonerExp: exp },
    levelsGained: gained,
  };
}
