import type { MonsterRole, Stats } from "./types.js";

/** Base combat stats by natural stars + role bias (Phase 2 curves). */
export function baseStatsFor(stars: number, role: MonsterRole): Stats {
  const s = Math.max(1, Math.min(5, stars));
  const tier = {
    1: { hp: 220, atk: 85, def: 28, spd: 96 },
    2: { hp: 250, atk: 100, def: 32, spd: 98 },
    3: { hp: 290, atk: 118, def: 36, spd: 100 },
    4: { hp: 330, atk: 138, def: 42, spd: 102 },
    5: { hp: 380, atk: 160, def: 48, spd: 104 },
  }[s as 1 | 2 | 3 | 4 | 5]!;

  const bias: Record<MonsterRole, Partial<Stats>> = {
    attacker: { atk: 18, hp: -20, critRate: 8, spd: 2 },
    support: { atk: -35, hp: 40, def: 6, critRate: -5 },
    tank: { atk: -25, hp: 55, def: 18, spd: -4, resistance: 10 },
    debuffer: { atk: -5, accuracy: 20, spd: 3, critRate: 0 },
    stonesage: { atk: -10, accuracy: 10, spd: 1, def: 4 },
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
