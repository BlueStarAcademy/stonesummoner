/**
 * Battle arena background ids + public URL helpers.
 * Assets: /art/battle/bg/{id}.webp (+ optional -720.webp)
 */

import type { StageDef } from "stonesummoner-data";

export const BATTLE_BG_IDS = [
  "map-01",
  "map-02",
  "map-03",
  "map-04",
  "map-05",
  "map-06",
  "map-07",
  "map-08",
  "map-09",
  "map-10",
  "map-11",
  "map-12",
  "map-13",
  "cairos-giant",
  "cairos-dragon",
  "cairos-necro",
  "awaken-fire",
  "awaken-water",
  "awaken-wind",
  "awaken-light",
  "awaken-dark",
  "arena",
  "depth",
  "equip",
  "weekday",
] as const;

export type BattleBgId = (typeof BATTLE_BG_IDS)[number];

const FALLBACK: BattleBgId = "map-01";

export function battleBgIdForStage(
  stage:
    | Pick<StageDef, "mode" | "map" | "cairosDungeon" | "bossArtId">
    | null
    | undefined,
): BattleBgId {
  if (!stage) return FALLBACK;

  const dungeon = stage.cairosDungeon;
  if (dungeon === "giant") return "cairos-giant";
  if (dungeon === "dragon") return "cairos-dragon";
  if (dungeon === "necro") return "cairos-necro";
  if (stage.bossArtId?.startsWith("awaken-")) {
    return stage.bossArtId as BattleBgId;
  }

  const mode = stage.mode;
  if (mode === "arena" || mode === "world_arena") return "arena";
  if (mode === "equip") return "equip";
  if (mode === "weekday") return "weekday";
  if (mode === "depth" || mode === "guild_raid") return "depth";

  const map = typeof stage.map === "number" ? stage.map : 0;
  if (map >= 1 && map <= 13) {
    return `map-${String(map).padStart(2, "0")}` as BattleBgId;
  }
  return FALLBACK;
}

export function battleBgSrc(id: BattleBgId = FALLBACK): string {
  return `/art/battle/bg/${id}.webp`;
}

export function battleBgSrcset(id: BattleBgId = FALLBACK): string {
  return `/art/battle/bg/${id}-720.webp 720w, /art/battle/bg/${id}.webp 1080w`;
}

/** HTML fragment for battle/result sky layer. */
export function battleSkyHtml(
  stage?: Pick<
    StageDef,
    "mode" | "map" | "cairosDungeon" | "bossArtId"
  > | null,
): string {
  const id = battleBgIdForStage(stage);
  return `<div class="battle-sky" data-bg="${id}" aria-hidden="true">
      <img
        class="battle-sky-img"
        src="${battleBgSrc(id)}"
        srcset="${battleBgSrcset(id)}"
        sizes="(max-width: 430px) 100vw, 430px"
        width="1080"
        height="1920"
        alt=""
        decoding="async"
      />
      <div class="battle-sky-veil"></div>
      <div class="battle-arena-floor"></div>
    </div>`;
}
