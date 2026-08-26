import type { BattleBgId } from "../battle/battleBg";
import { battleBgIdForStage } from "../battle/battleBg";
import type { StageDef } from "stonesummoner-data";
import { combatBgmForBg, type BgmId, type SfxId } from "./catalog";
import { playBgm, playSfx, duckBgm, currentBgmId } from "./manager";

export type AudioScreen =
  | "auth"
  | "home"
  | "stages"
  | "battle"
  | "result";

export type CombatSfxKind =
  | "aoe"
  | "single"
  | "heal"
  | "shield"
  | "buff"
  | "debuff"
  | "amplify"
  | "dual-stone"
  | "board-clean";

export type CombatElement = "fire" | "water" | "wind" | "light" | "dark";

const KIND_SFX: Record<CombatSfxKind, SfxId> = {
  aoe: "kind-aoe",
  single: "kind-single",
  heal: "kind-heal",
  shield: "kind-shield",
  buff: "kind-buff",
  debuff: "kind-debuff",
  amplify: "kind-amplify",
  "dual-stone": "kind-dual-stone",
  "board-clean": "kind-board-clean",
};

const ATK_SFX: Record<CombatElement, SfxId> = {
  fire: "atk-fire",
  water: "atk-water",
  wind: "atk-wind",
  light: "atk-light",
  dark: "atk-dark",
};

const HIT_SFX: Record<CombatElement, SfxId> = {
  fire: "hit-fire",
  water: "hit-water",
  wind: "hit-wind",
  light: "hit-holy",
  dark: "hit-dark",
};

const MAGIC_KIND: Record<string, CombatSfxKind> = {
  aoe_damage: "aoe",
  single_damage: "single",
  ally_heal: "heal",
  ally_shield: "shield",
  ally_buff_atk: "buff",
  ally_buff_spd: "buff",
  ally_buff_crit: "buff",
  enemy_debuff: "debuff",
  amplify: "amplify",
  dual_stone: "dual-stone",
  board_clean: "board-clean",
  damage_reduce: "shield",
  open: "aoe",
  declare: "amplify",
  dual: "dual-stone",
  clean: "board-clean",
  guard: "shield",
};

let uiBound = false;
let lastScreen: AudioScreen | null = null;
let resultStingPlayed = false;

export function isBossStage(
  stage: Pick<StageDef, "mode" | "stage" | "id"> | null | undefined,
): boolean {
  if (!stage) return false;
  if (stage.mode === "scenario" && stage.stage === 7) return true;
  return /boss|trial/i.test(stage.id);
}

export function syncBgmForView(
  screen: AudioScreen,
  stage?: Pick<StageDef, "mode" | "map" | "cairosDungeon" | "stage" | "id"> | null,
  opts?: { victory?: boolean },
): void {
  let next: BgmId;
  if (screen === "auth") next = "auth";
  else if (screen === "stages") next = "stages";
  else if (screen === "battle" || screen === "result") {
    const bg: BattleBgId = battleBgIdForStage(stage);
    next = combatBgmForBg(bg);
  } else next = "island";

  if (screen === "result") {
    duckBgm(true);
    if (!resultStingPlayed) {
      resultStingPlayed = true;
      void playSfx(opts?.victory === false ? "sting-defeat" : "sting-victory");
    }
    void playBgm(next);
    lastScreen = screen;
    return;
  }

  resultStingPlayed = false;
  duckBgm(false);
  const enteringBattle = screen === "battle" && lastScreen !== "battle";
  void playBgm(next).then(() => {
    if (enteringBattle && isBossStage(stage) && currentBgmId() === next) {
      void playSfx("sting-boss");
    }
  });
  lastScreen = screen;
}

export function playCombatCastSfx(
  element: CombatElement,
  kind: CombatSfxKind,
  opts?: { ult?: boolean },
): void {
  if (opts?.ult) void playSfx("ult-cutin");
  else void playSfx("lunge");
  if (kind === "heal") {
    void playSfx("kind-heal");
    return;
  }
  if (kind === "shield" || kind === "buff") {
    void playSfx(KIND_SFX[kind]);
    return;
  }
  void playSfx(ATK_SFX[element] ?? "atk-light");
  void playSfx(KIND_SFX[kind] ?? "kind-single");
}

export function playCombatHitSfx(
  element: CombatElement,
  opts?: { crit?: boolean; heal?: boolean; ko?: boolean },
): void {
  if (opts?.heal) {
    void playSfx("kind-heal");
    return;
  }
  void playSfx(HIT_SFX[element] ?? "hit-holy");
  void playSfx(opts?.crit ? "hit-crit" : "hit-med");
  if (opts?.ko) void playSfx("ko");
}

export function magicKindFromId(id: string | undefined): CombatSfxKind {
  if (!id) return "aoe";
  return MAGIC_KIND[id] ?? "aoe";
}

export function magicKindFromKind(kind: string | undefined): CombatSfxKind {
  if (!kind) return "aoe";
  return MAGIC_KIND[kind] ?? "aoe";
}

export function kindFromEffects(
  effects: Array<{ kind: string; target?: string }> | undefined,
): CombatSfxKind {
  if (!effects?.length) return "single";
  const kinds = effects.map((e) => e.kind);
  if (kinds.includes("heal")) return "heal";
  if (kinds.includes("shield")) return "shield";
  if (kinds.includes("buff") || kinds.includes("cleanse")) return "buff";
  if (kinds.includes("debuff") || kinds.includes("cc") || kinds.includes("provoke"))
    return "debuff";
  if (effects.some((e) => e.kind === "damage" && e.target === "all_enemies"))
    return "aoe";
  return "single";
}

function shouldSkipTap(el: HTMLElement): boolean {
  if (el.closest("[data-no-sfx]")) return true;
  if (el.closest(".cell")) return true;
  if (el.closest(".magic-node")) return true;
  if (el.closest(".stone-pick-hit")) return true;
  if (el.closest(".board-hit")) return true;
  if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "range")
    return true;
  return false;
}

export function bindUiSfx(root: HTMLElement): void {
  if (uiBound) return;
  uiBound = true;
  let downX = 0;
  let downY = 0;
  root.addEventListener(
    "pointerdown",
    (ev) => {
      downX = ev.clientX;
      downY = ev.clientY;
    },
    { capture: true },
  );
  root.addEventListener(
    "pointerup",
    (ev) => {
      if (ev.button != null && ev.button !== 0) return;
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 14) return;
      const t = ev.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest<HTMLElement>("button, [role='button'], a.auth-btn-primary, a.auth-btn-ghost");
      if (!btn || !root.contains(btn)) return;
      if (shouldSkipTap(btn)) return;
      if (btn instanceof HTMLButtonElement && btn.disabled) {
        void playSfx("ui-disabled");
        return;
      }
      if (btn.getAttribute("aria-disabled") === "true") {
        void playSfx("ui-disabled");
        return;
      }
      const custom = btn.getAttribute("data-sfx") as SfxId | null;
      if (custom) {
        void playSfx(custom);
        return;
      }
      if (btn.closest(".tabs") || btn.hasAttribute("data-nav") || btn.hasAttribute("data-mission-tab")) {
        void playSfx("ui-tab");
        return;
      }
      void playSfx("ui-tap");
    },
    { capture: true },
  );
}

const modalWasOpen = new Map<string, boolean>();

export function cueModalSfx(id: string, open: boolean): void {
  const prev = modalWasOpen.get(id) ?? false;
  if (open && !prev) void playSfx("ui-modal-open");
  else if (!open && prev) void playSfx("ui-modal-close");
  modalWasOpen.set(id, open);
}
