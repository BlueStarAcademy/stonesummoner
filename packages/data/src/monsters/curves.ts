import type { BalanceArchetype, Stats } from "./types.js";

/**
 * Lv1 bases by natural stars — Summoners War–style gap.
 *
 * Power difference between nat 1★ and 5★ must survive evolving both to 6★.
 * Evolve multipliers in roster.ts are intentionally modest so low-nat
 * fodder cannot erase the base-stat gap.
 *
 * Scale stays SW-like so symbol flats (HP+ 2448) remain meaningful.
 */
export function baseStatsFor(stars: number, role: BalanceArchetype): Stats {
  const s = Math.max(1, Math.min(5, stars));
  const tier = {
    1: { hp: 2600, atk: 135, def: 120, spd: 95 },
    2: { hp: 3200, atk: 170, def: 145, spd: 97 },
    3: { hp: 3900, atk: 215, def: 175, spd: 100 },
    4: { hp: 4800, atk: 270, def: 215, spd: 102 },
    5: { hp: 5900, atk: 340, def: 260, spd: 105 },
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
