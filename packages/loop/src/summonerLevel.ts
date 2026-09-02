const SUMMONER_ELEMENTS = ["fire", "water", "wind", "light", "dark"] as const;

export type SharedSummonerSlot = {
  level?: number;
  exp?: number;
};

export type SharedSummonerSource = {
  island: { summonerLevel?: number; summonerExp?: number };
  summoners?: Partial<Record<(typeof SUMMONER_ELEMENTS)[number], SharedSummonerSlot>> | null;
  activeSummoner?: string | null;
};

/** Shared summoner/user level + EXP. Highest level wins; EXP is the best leftover at that level. */
export function sharedSummonerProgress(
  island: SharedSummonerSource["island"],
  summoners?: SharedSummonerSource["summoners"],
  preferred?: string | null,
): { level: number; exp: number } {
  const islandLv = Math.max(1, Math.floor(island.summonerLevel ?? 1));
  const islandExp = Math.max(0, Math.floor(island.summonerExp ?? 0));
  let level = islandLv;
  if (summoners) {
    for (const el of SUMMONER_ELEMENTS) {
      const lv = Math.max(1, Math.floor(summoners[el]?.level ?? 1));
      if (lv > level) level = lv;
    }
  }

  let exp = islandLv === level ? islandExp : 0;
  if (summoners) {
    const pref =
      preferred && summoners[preferred as (typeof SUMMONER_ELEMENTS)[number]];
    if (pref && Math.max(1, Math.floor(pref.level ?? 1)) === level) {
      exp = Math.max(exp, Math.floor(pref.exp ?? 0));
    }
    for (const el of SUMMONER_ELEMENTS) {
      const slot = summoners[el];
      if (!slot) continue;
      if (Math.max(1, Math.floor(slot.level ?? 1)) === level) {
        exp = Math.max(exp, Math.floor(slot.exp ?? 0));
      }
    }
  }
  return { level, exp };
}

/** Account / user / summoner level — one number. */
export function accountLevelOf(save: SharedSummonerSource): number {
  return sharedSummonerProgress(save.island, save.summoners, save.activeSummoner)
    .level;
}
