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
  listGearBag,
  listRoster,
  listStages,
  listSymbols,
  runBuyEnergy,
  runBuyGlory,
  runBuyScroll,
  runCraftEssence,
  runCraftScroll,
  runDailyWish,
  runDemoLoop,
  runEnhance,
  runEnhanceGear,
  runAffixGearSet,
  runEquipGearBag,
  runSellGearBag,
  runAwakenSummoner,
  runAwakenMonster,
  runUnlockSkillNode,
  runEnhanceSymbol,
  runEquipSymbol,
  runEvolve,
  runFusion,
  runGrindSymbol,
  runImprintSymbol,
  runPracticeDojo,
  runSellSymbol,
  runSetArenaBans,
  runSetParty,
  runSkillUp,
  runSortie,
  runSummon,
  runUpgradeBuilding,
  SCROLL_BUY_MANA_COST,
  ENERGY_CRYSTAL_COST,
  FUSION_MANA_COST,
  stageUnlockLabel,
  type PlayerSave,
} from "stonesummoner-loop";
import { tickProduction } from "stonesummoner-home";
import { GLORY_BUILDINGS, SKILL_TREE_NODES, type GloryBuildingId } from "stonesummoner-data";

function printStatus(save: PlayerSave): void {
  const { island, symbols, clearedStages, scrolls, roster } = save;
  console.log("────────────────────────────────────");
  console.log(
    `소환사 Lv.${island.summonerLevel} (${Math.floor(island.summonerExp ?? 0)}/100 EXP) · 각성 ${save.summonerAwaken ?? 0} · 트리 ${(save.skillTree ?? []).length}/${SKILL_TREE_NODES.length}`,
  );
  console.log(
    `골드 ${Math.floor(island.mana)} · 크리스탈 ${island.crystal} · 에너지 ${Math.floor(island.energy)}/${island.energyMax ?? 100}`,
  );
  console.log(
    `영광 ${save.gloryPoints ?? 0} · 진문석 ${save.jinmunStones ?? 0} · 기여 ${save.guildContribution ?? 0} · 시즌승 ${save.arenaSeasonWins ?? 0} · 소환서 일${scrolls}/고${save.scrollsPremium ?? 0}/신${save.scrollsMystic ?? 0} · 로스터 ${roster.length} · 상징 ${symbols.length} · 클리어 ${clearedStages.length}`,
  );
  if ((save.arenaBanIds ?? []).length) {
    console.log(`월드아레나 밴: ${(save.arenaBanIds ?? []).join(", ")}`);
  }
  console.log("────────────────────────────────────");
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  let save = createNewSave();
  console.log("StoneSummoner CLI — 모바일 루프 검증용");
  console.log(
    "명령: collect | crystal | wish | upgrade | glory [id] | fuse <a> <b> | energy [n] | essence | craft | dojo | sell-sym <i> | summon | buy-scroll [n] | enhance <i> | evolve <i> | skillup <i> <0-2> | awaken | awaken-mon <i> | tree | unlock <node> | gear | bag | equip-gear <i> | sell-gear <i> | enh-gear <wpn|robe|acc|orb|cloak|ring> | set-gear <slot> <mana|assault|guardian|sense|tempo> | symbols | equip <m> <s> | enh-sym <i> | grind <i> | imprint <i> | roster | party <i…> | stages | go <id> | status | demo | quit",
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

    if (cmd === "fuse" || cmd === "fusion") {
      const r = runFusion(save, arg ?? "0", arg2 ?? "1");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "energy" || cmd === "en") {
      const n = Number(arg ?? "1");
      const r = runBuyEnergy(save, Number.isFinite(n) ? n : 1);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "essence" || cmd === "ess") {
      const r = runCraftEssence(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "craft" || cmd === "cf") {
      const r = runCraftScroll(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "dojo" || cmd === "drill") {
      const r = runPracticeDojo(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "sell-sym" || cmd === "ss") {
      const r = runSellSymbol(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "summon" || cmd === "sum") {
      const kindRaw = (arg ?? "normal").toLowerCase();
      const kind =
        kindRaw === "premium" || kindRaw === "p" || kindRaw === "고급"
          ? "premium"
          : kindRaw === "mystic" || kindRaw === "m" || kindRaw === "신성"
            ? "mystic"
            : "normal";
      const r = runSummon(save, kind);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "buy-scroll" || cmd === "buy" || cmd === "bs") {
      const n = Number(arg ?? "1");
      const kindRaw = (arg2 ?? "normal").toLowerCase();
      const kind =
        kindRaw === "premium" || kindRaw === "p"
          ? "premium"
          : kindRaw === "mystic" || kindRaw === "m"
            ? "mystic"
            : "normal";
      const r = runBuyScroll(save, Number.isFinite(n) ? n : 1, kind);
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

    if (cmd === "bag" || cmd === "gear-bag") {
      for (const line of listGearBag(save)) console.log(line);
      continue;
    }

    if (cmd === "equip-gear" || cmd === "egb") {
      const idx = Number(arg ?? "0");
      const r = runEquipGearBag(save, idx);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "sell-gear" || cmd === "sgb") {
      const idx = Number(arg ?? "0");
      const r = runSellGearBag(save, idx);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "enh-gear" || cmd === "eg") {
      const slot =
        arg === "necklace" || arg === "n" || arg === "orb" || arg === "o"
          ? "necklace"
          : arg === "weapon" || arg === "w" || arg === "wpn"
            ? "weapon"
            : arg === "top" || arg === "t" || arg === "robe" || arg === "r"
              ? "top"
              : arg === "bottom" ||
                  arg === "b" ||
                  arg === "cloak" ||
                  arg === "c" ||
                  arg === "mantle"
                ? "bottom"
                : arg === "ring" || arg === "rg"
                  ? "ring"
                  : "shoes";
      const r = runEnhanceGear(save, slot);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "set-gear" || cmd === "sg") {
      const slot =
        arg === "necklace" || arg === "n" || arg === "orb" || arg === "o"
          ? "necklace"
          : arg === "weapon" || arg === "w" || arg === "wpn"
            ? "weapon"
            : arg === "top" || arg === "t" || arg === "robe" || arg === "r"
              ? "top"
              : arg === "bottom" ||
                  arg === "b" ||
                  arg === "cloak" ||
                  arg === "c" ||
                  arg === "mantle"
                ? "bottom"
                : arg === "ring" || arg === "rg"
                  ? "ring"
                  : "shoes";
      const setId =
        arg2 === "mana" ||
        arg2 === "assault" ||
        arg2 === "guardian" ||
        arg2 === "sense" ||
        arg2 === "tempo"
          ? arg2
          : null;
      if (!setId) {
        console.log(
          "사용법: set-gear <slot> <mana|assault|guardian|sense|tempo>",
        );
        continue;
      }
      const r = runAffixGearSet(save, slot, setId);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "awaken" || cmd === "aw") {
      const r = runAwakenSummoner(save);
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "awaken-mon" || cmd === "awm") {
      const r = runAwakenMonster(save, arg ?? "0");
      save = r.save;
      console.log(r.message);
      printStatus(save);
      continue;
    }

    if (cmd === "tree" || cmd === "st") {
      const unlocked = new Set(save.skillTree ?? []);
      for (const n of SKILL_TREE_NODES) {
        const mark = unlocked.has(n.id) ? "✓" : "·";
        console.log(
          `${mark} ${n.id} ${n.nameKo} — ${n.descKo} (Lv.${n.minLevel}+ · 골드 ${n.manaCost}${n.crystalCost ? ` · 크리스탈 ${n.crystalCost}` : ""})`,
        );
      }
      continue;
    }

    if (cmd === "unlock" || cmd === "ul") {
      const r = runUnlockSkillNode(save, arg ?? "");
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

    if (cmd === "ban") {
      const ids = parts.slice(1);
      const r = runSetArenaBans(save, ids);
      save = r.save;
      console.log(r.message);
      printStatus(save);
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
      "알 수 없는 명령. collect | crystal | wish | upgrade | glory | fuse | summon | buy-scroll | enhance | evolve | skillup | awaken | tree | unlock | gear | bag | equip-gear | sell-gear | enh-gear | set-gear | symbols | equip | enh-sym | grind | imprint | roster | party | stages | ban | go | status | demo | quit",
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
