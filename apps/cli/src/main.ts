/**
 * StoneSummoner CLI — 홈 → 소환/강화/장비/상징 → 출정 → 보상
 *
 *   npm run cli          # interactive
 *   npm run cli:demo     # non-interactive demo
 */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  createNewSave,
  homeCollect,
  homeCollectCrystal,
  listGear,
  listRoster,
  listStages,
  listSymbols,
  runBuyGlory,
  runBuyScroll,
  runDailyWish,
  runDemoLoop,
  runEnhance,
  runEnhanceGear,
  runEnhanceSymbol,
  runEquipSymbol,
  runEvolve,
  runGrindSymbol,
  runImprintSymbol,
  runSetParty,
  runSkillUp,
  runSortie,
  runSummon,
  runUpgradeBuilding,
  SCROLL_BUY_MANA_COST,
  stageUnlockLabel,
  type PlayerSave,
} from "stonesummoner-loop";
import { tickProduction } from "stonesummoner-home";
import { GLORY_BUILDINGS, type GloryBuildingId } from "stonesummoner-data";

function printStatus(save: PlayerSave): void {
  const { island, symbols, clearedStages, scrolls, roster } = save;
  console.log("────────────────────────────────────");
  console.log(
    `서머너 Lv.${island.summonerLevel} (${Math.floor(island.summonerExp ?? 0)}/100 EXP)`,
  );
  console.log(
    `마나 ${Math.floor(island.mana)} · 크리스탈 ${island.crystal} · 에너지 ${Math.floor(island.energy)}/${island.energyMax ?? 100}`,
  );
  console.log(
    `영광 ${save.gloryPoints ?? 0} · 진문석 ${save.jinmunStones ?? 0} · 소환서 ${scrolls} · 로스터 ${roster.length} · 상징 ${symbols.length} · 클리어 ${clearedStages.length}`,
  );
  console.log("────────────────────────────────────");
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  let save = createNewSave();
  console.log("StoneSummoner CLI — 모바일 루프 검증용");
  console.log(
    "명령: collect | crystal | wish | upgrade | glory [id] | summon | buy-scroll [n] | enhance <i> | evolve <i> | skillup <i> <0-2> | gear | enh-gear <acc|orb> | symbols | equip <m> <s> | enh-sym <i> | grind <i> | imprint <i> | roster | party <i…> | stages | go <id> | status | demo | quit",
  );
  printStatus(save);

  while (true) {
    const line = (await rl.question("> ")).trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    const cmd = parts[0]!;
    const arg = parts[1];
    const arg2 = parts[2];

    if (cmd === "quit" || cmd === "q" || cmd === "exit") break;

    if (cmd === "status") {
      save = { ...save, island: tickProduction(save.island) };
      printStatus(save);
      continue;
    }

    if (cmd === "collect" || cmd === "c") {
      const now = Date.now();
      save.island = {
        ...save.island,
        buildings: save.island.buildings.map((b) =>
          b.id === "mana_pond"
            ? { ...b, lastUpdatedAt: now - 30 * 60 * 1000 }
            : b,
        ),
      };
      const r = homeCollect(save, now);
      save = r.save;
      console.log(r.message);
      continue;
    }

    if (cmd === "upgrade" || cmd === "up") {
      const r = runUpgradeBuilding(save, "mana_pond");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "crystal" || cmd === "cr") {
      const r = homeCollectCrystal(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "wish" || cmd === "w") {
      const r = runDailyWish(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "glory" || cmd === "gl") {
      if (!arg) {
        for (const g of GLORY_BUILDINGS) {
          const lv = save.gloryLevels?.[g.id] ?? 0;
          console.log(
            `${g.id} · ${g.nameKo} Lv.${lv}/${g.maxLevel} (−영광 ${g.gloryCostPerLevel}) · ${g.effectKo}`,
          );
        }
        console.log(`보유 영광 ${save.gloryPoints ?? 0}`);
        continue;
      }
      const r = runBuyGlory(save, arg as GloryBuildingId);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "summon" || cmd === "sum") {
      const r = runSummon(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "buy-scroll" || cmd === "buy" || cmd === "bs") {
      const n = Number(arg ?? "1");
      const r = runBuyScroll(save, Number.isFinite(n) ? n : 1);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "enhance" || cmd === "enh" || cmd === "e") {
      const r = runEnhance(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "evolve" || cmd === "evo") {
      const r = runEvolve(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "skillup" || cmd === "sk" || cmd === "su") {
      const slot = Number(arg2 ?? "0");
      const r = runSkillUp(save, arg ?? "0", Number.isFinite(slot) ? slot : 0);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "gear" || cmd === "eq") {
      for (const line of listGear(save)) console.log(line);
      continue;
    }

    if (cmd === "enh-gear" || cmd === "eg") {
      const slot = arg === "orb" || arg === "o" ? "orb" : "accessory";
      const r = runEnhanceGear(save, slot);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "symbols" || cmd === "sym") {
      for (const line of listSymbols(save)) console.log(line);
      continue;
    }

    if (cmd === "equip") {
      const r = runEquipSymbol(save, arg ?? "0", arg2 ?? "0");
      save = r.save;
      console.log(r.message);
      continue;
    }

    if (cmd === "enh-sym" || cmd === "es") {
      const r = runEnhanceSymbol(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "grind" || cmd === "gr") {
      const r = runGrindSymbol(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "imprint" || cmd === "imp") {
      const r = runImprintSymbol(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "roster" || cmd === "r") {
      for (const line of listRoster(save)) console.log(line);
      continue;
    }

    if (cmd === "party" || cmd === "p") {
      const refs = parts.slice(1);
      if (refs.length === 0) {
        for (const line of listRoster(save)) console.log(line);
        console.log(`현재 파티: ${save.party.join(", ")}`);
        continue;
      }
      const r = runSetParty(save, refs);
      save = r.save;
      console.log(r.message);
      continue;
    }

    if (cmd === "stages" || cmd === "s") {
      for (const st of listStages()) {
        const label = stageUnlockLabel(save, st);
        console.log(
          ` [${label}] ${st.id}  ${st.nameKo}  ${st.boardSize}×${st.boardSize}  E${st.energyCost}`,
        );
      }
      continue;
    }

    if (cmd === "go" || cmd === "g") {
      const id = arg ?? "garen_1_1";
      console.log(`출정: ${id} …`);
      const r = runSortie(save, id);
      save = r.save;
      console.log(r.message);
      if (r.battleLog?.length) {
        console.log("--- log ---");
        for (const l of r.battleLog) console.log(" ", l);
      }
      if (r.reward?.symbol) {
        console.log(
          `드롭: ${r.reward.symbol.setId} 슬롯${r.reward.symbol.slot} (${r.reward.symbol.mainStat})`,
        );
      }
      printStatus(save);
      continue;
    }

    if (cmd === "demo") {
      const steps = runDemoLoop(() => 0.15);
      for (const s of steps) console.log("·", s.message);
      save = steps[steps.length - 1]!.save;
      printStatus(save);
      continue;
    }

    console.log(
      "알 수 없는 명령. collect | crystal | wish | upgrade | glory | summon | buy-scroll | enhance | evolve | skillup | gear | enh-gear | symbols | equip | enh-sym | grind | imprint | roster | party | stages | go | status | demo | quit",
    );
  }

  rl.close();
  console.log("종료.");
}

function demo(): void {
  console.log("=== StoneSummoner demo loop ===");
  const steps = runDemoLoop(() => 0.15);
  for (const s of steps) {
    console.log("·", s.message);
    if (s.reward?.symbol) {
      console.log(
        `  drop: ${s.reward.symbol.setId}(${s.reward.symbol.slot})`,
      );
    }
  }
  printStatus(steps[steps.length - 1]!.save);
}

const args = process.argv.slice(2);
if (args.includes("--demo")) {
  demo();
} else {
  await interactive();
}
