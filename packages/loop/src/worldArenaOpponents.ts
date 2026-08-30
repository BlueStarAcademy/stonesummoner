import {
  ARENA_RIVAL_NICKNAMES,
  WORLD_ARENA_RIVAL_DECKS,
  WORLD_ARENA_STAGES,
  type ArenaRivalDeck,
} from "stonesummoner-data";
import { todayKey } from "stonesummoner-home";
import { arenaOpponentRating } from "./loop.js";
import type { SummonerElement } from "./loop.js";
import type { ArenaOpponent } from "./arenaOpponents.js";

export const WORLD_ARENA_DAILY_OPPONENT_COUNT = 10;

const TIER_SLOTS: readonly { stageId: string; count: number }[] = [
  { stageId: "warena_qual", count: 5 },
  { stageId: "warena_final", count: 5 },
] as const;

const LEVEL_RANGE: Record<string, readonly [number, number]> = {
  warena_qual: [38, 44],
  warena_final: [42, 48],
};

function seedHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function seededPick<T>(items: readonly T[], seed: string): T {
  const h = seedHash(seed);
  return items[h % items.length]!;
}

function tierStageIds(): string[] {
  const out: string[] = [];
  for (const tier of TIER_SLOTS) {
    for (let i = 0; i < tier.count; i++) out.push(tier.stageId);
  }
  return out;
}

function gloryForStage(stageId: string): number {
  return WORLD_ARENA_STAGES.find((s) => s.id === stageId)?.gloryReward ?? 0;
}

function levelForTier(stageId: string, seed: string): number {
  const range = LEVEL_RANGE[stageId] ?? [40, 46];
  const span = range[1] - range[0] + 1;
  const h = seedHash(`${seed}:lv`);
  return range[0] + (h % span);
}

function ratingForStage(stageId: string, seed: string): number {
  const base = arenaOpponentRating(stageId);
  const h = seedHash(`${seed}:rt`);
  const jitter = (h % 41) - 20;
  return Math.max(800, base + jitter);
}

function pickRivalDeck(seed: string): ArenaRivalDeck {
  return seededPick(WORLD_ARENA_RIVAL_DECKS, seed);
}

function pickNickname(seed: string, used: Set<string>): string {
  const pool = ARENA_RIVAL_NICKNAMES;
  if (pool.length === 0) return "Rival";
  let h = seedHash(`${seed}:nick`);
  for (let attempt = 0; attempt < pool.length; attempt++) {
    const nick = pool[h % pool.length]!;
    h = (h * 31 + 17) >>> 0;
    if (!used.has(nick)) return nick;
  }
  return `${pool[h % pool.length]!}${(h % 90) + 10}`;
}

/** Deterministic daily world-arena opponent list (10 rivals, SW-style). */
export function listDailyWorldArenaOpponents(now = Date.now()): ArenaOpponent[] {
  const day = todayKey(now);
  const stages = tierStageIds();
  const usedNicknames = new Set<string>();
  return stages.map((stageId, index) => {
    const seed = `warena:${day}:${index}`;
    const rival = pickRivalDeck(`${seed}:deck`);
    const nickname = pickNickname(seed, usedNicknames);
    usedNicknames.add(nickname);
    return {
      id: `warena:${day}:${index}`,
      stageId,
      rivalDeckId: rival.id,
      nickname,
      level: levelForTier(stageId, seed),
      rating: ratingForStage(stageId, seed),
      summonerElement: rival.summonerElement as SummonerElement,
      enemyMonsterIds: [...rival.enemyMonsterIds],
      gloryReward: gloryForStage(stageId),
      kind: "rival",
    };
  });
}

export function getWorldArenaOpponent(
  id: string,
  now = Date.now(),
): ArenaOpponent | undefined {
  return listDailyWorldArenaOpponents(now).find((o) => o.id === id);
}
