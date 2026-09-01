import type { BalanceArchetype, Stats } from "./types.js";

/**
 * Lv1 bases aligned to Summoners War, so SW-scale symbol flats (HP+ 2448)
 * stay meaningful. Level/evolve multipliers in roster.ts still apply on top.
 */
export function baseStatsFor(stars: number, role: BalanceArchetype): Stats {
  const s = Math.max(1, Math.min(5, stars));
  const tier = {
    1: { hp: 3000, atk: 155, def: 140, spd: 96 },
    2: { hp: 3400, atk: 180, def: 160, spd: 98 },
    3: { hp: 4000, atk: 210, def: 180, spd: 100 },
    4: { hp: 4600, atk: 250, def: 210, spd: 102 },
    5: { hp: 5300, atk: 290, def: 240, spd: 104 },
  }[s as 1 | 2 | 3 | 4 | 5]!;

  const bias: Record<BalanceArchetype, Partial<Stats>> = {
    attacker: { atk: 32, hp: -250, critRate: 8, spd: 2 },
    support: { atk: -63, hp: 500, def: 30, critRate: -5 },
    tank: { atk: -45, hp: 700, def: 90, spd: -4, resistance: 10 },
    debuffer: { atk: -9, accuracy: 20, spd: 3, critRate: 0 },
    stonesage: { atk: -18, accuracy: 10, spd: 1, def: 20 },
    capturer: { atk: 0, spd: 6, accuracy: 8, critRate: 5 },
  };

  const b = bias[role];
  return {
    hp: tier.hp + (b.hp ?? 0),
    atk: tier.atk + (b.atk ?? 0),
    def: tier.def + (b.def ?? 0),
    spd: tier.spd + (b.spd ?? 0),
    critRate: 20 + (b.critRate ?? 0),
    critDmg: 55 + (role === "attacker" ? 10 : 0),
    accuracy: b.accuracy ?? 0,
    resistance: 15 + (b.resistance ?? 0),
  };
}
