import {
  getStage,
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
  runs: number;
  wins: number;
  winRate: number;
  medianTurns: number;
  energyCost: number;
  accountExpPerEnergy: number;
  symbolStars: Record<string, number>;
  symbolSets: Record<string, number>;
};

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

function simulate(
  stage: StageDef,
  difficulty: ScenarioDifficulty,
  runs: number,
): SimulationRow {
  let wins = 0;
  let totalAccountExp = 0;
  const turns: number[] = [];
  const symbolStars: Record<string, number> = {};
  const symbolSets: Record<string, number> = {};

  for (let seed = 1; seed <= runs; seed++) {
    const rng = seeded(seed * 7_919 + stage.stage * 101 + stage.map);
    const save = createNewSave(0);
    const battle = createStageBattle(stage, save, { difficulty, rng });
    const result = resolveBattleAuto(battle, 250);
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
  };
}

const args = process.argv.slice(2);
const runsArg = Number(args.find((arg) => arg.startsWith("--runs="))?.split("=")[1]);
const runs = Number.isFinite(runsArg) && runsArg > 0 ? Math.floor(runsArg) : 200;
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
    rows.push(simulate(stage, difficulty, runs));
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
