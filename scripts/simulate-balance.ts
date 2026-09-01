import {
  createSymbol,
  getStage,
  mainStatAtEnhance,
  MONSTERS,
  type StageDef,
} from "stonesummoner-data";
import {
  applyRewards,
  createNewSave,
  createStageBattle,
  energyCostForStage,
  resolveBattleAuto,
  type ScenarioDifficulty,
} from "stonesummoner-loop";

type SimulationRow = {
  stageId: string;
  difficulty: ScenarioDifficulty;
  partyProfile: PartyProfile;
  runs: number;
  wins: number;
  winRate: number;
  medianTurns: number;
  energyCost: number;
  accountExpPerEnergy: number;
  symbolStars: Record<string, number>;
  symbolSets: Record<string, number>;
  healingEventsPerRun: number;
  controlEventsPerRun: number;
};

type PartyProfile = "mixed" | "attackers";

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
}

function profileMonsterIds(profile: PartyProfile): string[] {
  const roles =
    profile === "attackers"
      ? ["attacker", "attacker", "attacker", "attacker"]
      : ["attacker", "defense", "speed", "support"];
  const usedFamilies = new Set<string>();
  return roles.map((role, index) => {
    const found = MONSTERS.find(
      (monster) =>
        monster.role === role &&
        !usedFamilies.has(monster.familyId) &&
        monster.element === (["fire", "water", "wind", "light"][index] ?? "dark"),
    );
    if (!found) throw new Error(`Missing benchmark monster for role ${role}`);
    usedFamilies.add(found.familyId);
    return found.id;
  });
}

function benchmarkSave(
  stage: StageDef,
  difficulty: ScenarioDifficulty,
  partyProfile: PartyProfile,
) {
  const save = createNewSave(0);
  const enemyLevel =
    stage.difficultyBalance?.[difficulty]?.enemyLevel ??
    stage.enemyLevel ??
    1;
  const targetLevel = Math.max(
    stage.mode === "scenario" ? 5 : 15,
    Math.min(40, enemyLevel - (stage.cairosTier ? 2 : 5)),
  );
  const deepFarm =
    stage.cairosTier === "abyss_normal" ||
    stage.cairosTier === "abyss_hard" ||
    (stage.mode === "depth" && stage.stage >= 7);
  const symbols = [...save.symbols];
  const profileIds = profileMonsterIds(partyProfile);
  const roster = save.roster.map((monster, monsterIndex) => {
    const next = {
      ...monster,
      monsterId: profileIds[monsterIndex] ?? monster.monsterId,
      level: targetLevel,
      evolve: deepFarm ? 5 : monster.evolve,
      awaken: deepFarm ? 1 : monster.awaken,
      skillLevels: deepFarm
        ? ([3, 3, 3] as [number, number, number])
        : monster.skillLevels,
      symbolSlots: [...monster.symbolSlots],
    };
    if (!deepFarm || monsterIndex >= 4) return next;
    next.symbolSlots = Array.from({ length: 6 }, (_, index) => {
      const slot = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      const setId = slot <= 2 ? "hwalro" : "yongmaeng";
      const symbol = createSymbol(
        setId,
        slot,
        `bench_${monster.uid}_${slot}`,
        { stars: 6, quality: "legend", rng: seeded(monsterIndex * 10 + slot) },
      );
      symbol.enhance = 15;
      symbol.mainValue = mainStatAtEnhance(
        symbol.mainStat as Parameters<typeof mainStatAtEnhance>[0],
        6,
        15,
      );
      symbols.push(symbol);
      return symbol.id;
    });
    return next;
  });
  return {
    ...save,
    roster,
    symbols,
    island: {
      ...save.island,
      energy: 999,
      summonerLevel: targetLevel,
    },
    summoners: {
      ...save.summoners,
      [save.activeSummoner]: {
        ...save.summoners[save.activeSummoner],
        level: targetLevel,
        awaken: deepFarm ? 4 : save.summoners[save.activeSummoner].awaken,
      },
    },
  };
}

function simulate(
  stage: StageDef,
  difficulty: ScenarioDifficulty,
  runs: number,
  partyProfile: PartyProfile,
): SimulationRow {
  let wins = 0;
  let totalAccountExp = 0;
  const turns: number[] = [];
  const symbolStars: Record<string, number> = {};
  const symbolSets: Record<string, number> = {};
  let healingEvents = 0;
  let controlEvents = 0;

  for (let seed = 1; seed <= runs; seed++) {
    const rng = seeded(seed * 7_919 + stage.stage * 101 + stage.map);
    const save = benchmarkSave(stage, difficulty, partyProfile);
    const battle = createStageBattle(stage, save, { difficulty, rng });
    const result = resolveBattleAuto(battle, 250);
    healingEvents += battle.log.filter((line) => /회복|치유/.test(line)).length;
    controlEvents += battle.log.filter((line) =>
      /stun|freeze|sleep|기절|빙결|수면|침묵|도발/.test(line),
    ).length;
    turns.push(result.turns);
    if (!result.victory) continue;
    wins += 1;
    const rewarded = applyRewards(save, stage, true, rng, difficulty);
    totalAccountExp += rewarded.reward.summonerExp ?? 0;
    if (rewarded.reward.symbol) {
      increment(symbolStars, String(rewarded.reward.symbol.stars));
      increment(symbolSets, rewarded.reward.symbol.setId);
    }
  }

  const energyCost = energyCostForStage(stage, difficulty);
  return {
    stageId: stage.id,
    difficulty,
    partyProfile,
    runs,
    wins,
    winRate: Number((wins / runs).toFixed(4)),
    medianTurns: median(turns),
    energyCost,
    accountExpPerEnergy:
      energyCost > 0
        ? Number((totalAccountExp / runs / energyCost).toFixed(2))
        : 0,
    symbolStars,
    symbolSets,
    healingEventsPerRun: Number((healingEvents / runs).toFixed(2)),
    controlEventsPerRun: Number((controlEvents / runs).toFixed(2)),
  };
}

const args = process.argv.slice(2);
const runsArg = Number(args.find((arg) => arg.startsWith("--runs="))?.split("=")[1]);
const runs = Number.isFinite(runsArg) && runsArg > 0 ? Math.floor(runsArg) : 200;
const compareRoles = args.includes("--compare-roles");
const requested = args.filter((arg) => !arg.startsWith("--"));
const stageIds = requested.length
  ? requested
  : [
      "garen_1_1",
      "garen_1_7",
      "giant_b1",
      "giant_b10",
      "giant_abyss_normal",
      "giant_abyss_hard",
    ];

const rows: SimulationRow[] = [];
for (const stageId of stageIds) {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`Unknown stage: ${stageId}`);
  const difficulties: ScenarioDifficulty[] =
    stage.mode === "scenario" ? ["normal", "hard", "hell"] : ["normal"];
  for (const difficulty of difficulties) {
    const profiles: PartyProfile[] = compareRoles
      ? ["attackers", "mixed"]
      : ["mixed"];
    for (const profile of profiles) {
      rows.push(simulate(stage, difficulty, runs, profile));
    }
  }
}

process.stdout.write(
  `${JSON.stringify(
    {
      snapshot: "sw-modern-community-2026-09",
      generatedAt: new Date().toISOString(),
      rows,
    },
    null,
    2,
  )}\n`,
);
