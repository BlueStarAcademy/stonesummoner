import {
  ARENA_RIVAL_DECKS,
  ARENA_RIVAL_NICKNAMES,
  ARENA_STAGES,
  type ArenaRivalDeck,
} from "stonesummoner-data";
import { todayKey } from "stonesummoner-home";
import { ARENA_NPC_GLORY_MUL, arenaOpponentRating } from "./loop.js";
import type { SummonerElement } from "./loop.js";

export const ARENA_DAILY_OPPONENT_COUNT = 10;

const TIER_SLOTS: readonly { stageId: string; count: number }[] = [
  { stageId: "arena_rookie", count: 3 },
  { stageId: "arena_veteran", count: 3 },
  { stageId: "arena_challenger", count: 2 },
  { stageId: "arena_legend", count: 2 },
] as const;

const LEVEL_RANGE: Record<string, readonly [number, number]> = {
  arena_rookie: [12, 18],
  arena_veteran: [20, 28],
  arena_challenger: [30, 38],
  arena_legend: [35, 45],
};

/**
 * `rival` = the daily rotating ladder list (full ELO swing).
 * `npc` = the fixed practice tiers: small flat rating gain, no loss on defeat.
 */
export type ArenaOpponentKind = "rival" | "npc";

export type ArenaOpponent = {
  id: string;
  stageId: string;
  rivalDeckId: string;
  nickname: string;
  level: number;
  rating: number;
  summonerElement: SummonerElement;
  enemyMonsterIds: string[];
  gloryReward: number;
  kind: ArenaOpponentKind;
};

const NPC_TIERS: readonly {
  stageId: string;
  nameKo: string;
  summonerElement: SummonerElement;
}[] = [
  // Kept short: a 5-across card only fits about five Hangul glyphs.
  { stageId: "arena_rookie", nameKo: "신입 교관", summonerElement: "wind" },
  { stageId: "arena_veteran", nameKo: "숙련 교관", summonerElement: "water" },
  { stageId: "arena_challenger", nameKo: "도전 교관", summonerElement: "light" },
  { stageId: "arena_legend", nameKo: "전설 교관", summonerElement: "dark" },
] as const;

export const ARENA_NPC_OPPONENT_PREFIX = "npc:";

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
  return ARENA_STAGES.find((s) => s.id === stageId)?.gloryReward ?? 0;
}

function levelForTier(stageId: string, seed: string): number {
  const range = LEVEL_RANGE[stageId] ?? [15, 25];
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
  return seededPick(ARENA_RIVAL_DECKS, seed);
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

/** Deterministic daily arena opponent list (10 rivals, SW-style). */
export function listDailyArenaOpponents(now = Date.now()): ArenaOpponent[] {
  const day = todayKey(now);
  const stages = tierStageIds();
  const usedNicknames = new Set<string>();
  return stages.map((stageId, index) => {
    const seed = `${day}:${index}`;
    const rival = pickRivalDeck(`${seed}:deck`);
    const nickname = pickNickname(seed, usedNicknames);
    usedNicknames.add(nickname);
    return {
      id: `${day}:${index}`,
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

/**
 * Fixed practice ladder. Same four tier stages as the rival list, but the deck is the
 * stage's own roster so the matchup never rerolls — you grind the tier you can beat.
 */
export function listArenaNpcOpponents(): ArenaOpponent[] {
  return NPC_TIERS.map((tier) => {
    const stage = ARENA_STAGES.find((s) => s.id === tier.stageId);
    const range = LEVEL_RANGE[tier.stageId] ?? [15, 25];
    return {
      id: `${ARENA_NPC_OPPONENT_PREFIX}${tier.stageId}`,
      stageId: tier.stageId,
      rivalDeckId: `npc_${tier.stageId}`,
      nickname: tier.nameKo,
      level: Math.round((range[0] + range[1]) / 2),
      rating: arenaOpponentRating(tier.stageId),
      summonerElement: tier.summonerElement,
      enemyMonsterIds: [...(stage?.enemyMonsterIds ?? [])],
      gloryReward: Math.max(
        1,
        Math.round(gloryForStage(tier.stageId) * ARENA_NPC_GLORY_MUL),
      ),
      kind: "npc",
    };
  });
}

export function isArenaNpcOpponentId(id: string): boolean {
  return id.startsWith(ARENA_NPC_OPPONENT_PREFIX);
}

export function getArenaOpponent(
  id: string,
  now = Date.now(),
): ArenaOpponent | undefined {
  if (isArenaNpcOpponentId(id)) {
    return listArenaNpcOpponents().find((o) => o.id === id);
  }
  return listDailyArenaOpponents(now).find((o) => o.id === id);
}
