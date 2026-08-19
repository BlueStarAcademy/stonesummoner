import type { BattleBgId } from "../battle/battleBg";

export type BgmId =
  | "auth"
  | "island"
  | "stages"
  | "combat-map-01"
  | "combat-map-02"
  | "combat-map-03"
  | "combat-map-04"
  | "combat-map-05"
  | "combat-map-06"
  | "combat-map-07"
  | "combat-map-08"
  | "combat-map-09"
  | "combat-map-10"
  | "combat-map-11"
  | "combat-map-12"
  | "combat-map-13"
  | "combat-cairos-giant"
  | "combat-cairos-dragon"
  | "combat-cairos-necro"
  | "combat-arena"
  | "combat-weekday"
  | "combat-equip"
  | "combat-depth";

export type StingId = "sting-victory" | "sting-defeat" | "sting-boss";

export type SfxId =
  | "ui-tap"
  | "ui-confirm"
  | "ui-cancel"
  | "ui-disabled"
  | "ui-modal-open"
  | "ui-modal-close"
  | "ui-tab"
  | "ui-toast"
  | "ui-claim"
  | "ui-purchase"
  | "ui-error"
  | "ui-collect"
  | "ui-unlock"
  | "stone-place"
  | "stone-drop"
  | "capture"
  | "board-reset"
  | "amplify"
  | "mana-ready"
  | "lunge"
  | "hit-soft"
  | "hit-med"
  | "hit-crit"
  | "ko"
  | "wave-clear"
  | "ult-cutin"
  | "atk-fire"
  | "atk-water"
  | "atk-wind"
  | "atk-light"
  | "atk-dark"
  | "hit-fire"
  | "hit-water"
  | "hit-wind"
  | "hit-holy"
  | "hit-dark"
  | "kind-aoe"
  | "kind-single"
  | "kind-heal"
  | "kind-shield"
  | "kind-buff"
  | "kind-debuff"
  | "kind-amplify"
  | "kind-dual-stone"
  | "kind-board-clean"
  | "summon-pull"
  | "summon-reveal"
  | "summon-reveal-rare"
  | "fusion-cast"
  | "wish-reveal"
  | "enhance-tick"
  | "forge-reveal";

export type AudioFileId = BgmId | StingId | SfxId;

const COMBAT_BGM: Record<BattleBgId, BgmId> = {
  "map-01": "combat-map-01",
  "map-02": "combat-map-02",
  "map-03": "combat-map-03",
  "map-04": "combat-map-04",
  "map-05": "combat-map-05",
  "map-06": "combat-map-06",
  "map-07": "combat-map-07",
  "map-08": "combat-map-08",
  "map-09": "combat-map-09",
  "map-10": "combat-map-10",
  "map-11": "combat-map-11",
  "map-12": "combat-map-12",
  "map-13": "combat-map-13",
  "cairos-giant": "combat-cairos-giant",
  "cairos-dragon": "combat-cairos-dragon",
  "cairos-necro": "combat-cairos-necro",
  arena: "combat-arena",
  depth: "combat-depth",
  equip: "combat-equip",
  weekday: "combat-weekday",
};

export function combatBgmForBg(id: BattleBgId): BgmId {
  return COMBAT_BGM[id] ?? "combat-map-01";
}

export function bgmSrcCandidates(id: BgmId | StingId): string[] {
  const folder = id.startsWith("sting-") ? "sfx" : "bgm";
  const file = id.startsWith("sting-") ? id : id;
  return [
    `/audio/${folder}/${file}.ogg`,
    `/audio/${folder}/${file}.mp3`,
    `/audio/${folder}/${file}.wav`,
  ];
}

export function sfxSrcCandidates(id: SfxId | StingId): string[] {
  return [`/audio/sfx/${id}.ogg`, `/audio/sfx/${id}.mp3`, `/audio/sfx/${id}.wav`];
}

/** Chrome UI one-shots must stay short. Stability often emits a 1s combat sting. */
const SFX_PLAY_CAP: Partial<Record<SfxId, number>> = {
  "ui-tap": 0.14,
  "ui-tab": 0.12,
  "ui-confirm": 0.22,
  "ui-cancel": 0.18,
  "ui-disabled": 0.14,
  "ui-modal-open": 0.22,
  "ui-modal-close": 0.2,
  "ui-toast": 0.2,
  "ui-error": 0.2,
};

export function sfxPlayCap(id: SfxId | StingId): number | null {
  return SFX_PLAY_CAP[id as SfxId] ?? null;
}

export const ALL_BGM_IDS: BgmId[] = [
  "auth",
  "island",
  "stages",
  "combat-map-01",
  "combat-map-02",
  "combat-map-03",
  "combat-map-04",
  "combat-map-05",
  "combat-map-06",
  "combat-map-07",
  "combat-map-08",
  "combat-map-09",
  "combat-map-10",
  "combat-map-11",
  "combat-map-12",
  "combat-map-13",
  "combat-cairos-giant",
  "combat-cairos-dragon",
  "combat-cairos-necro",
  "combat-arena",
  "combat-weekday",
  "combat-equip",
  "combat-depth",
];

export const ALL_STING_IDS: StingId[] = [
  "sting-victory",
  "sting-defeat",
  "sting-boss",
];

export const ALL_SFX_IDS: SfxId[] = [
  "ui-tap",
  "ui-confirm",
  "ui-cancel",
  "ui-disabled",
  "ui-modal-open",
  "ui-modal-close",
  "ui-tab",
  "ui-toast",
  "ui-claim",
  "ui-purchase",
  "ui-error",
  "ui-collect",
  "ui-unlock",
  "stone-place",
  "stone-drop",
  "capture",
  "board-reset",
  "amplify",
  "mana-ready",
  "lunge",
  "hit-soft",
  "hit-med",
  "hit-crit",
  "ko",
  "wave-clear",
  "ult-cutin",
  "atk-fire",
  "atk-water",
  "atk-wind",
  "atk-light",
  "atk-dark",
  "hit-fire",
  "hit-water",
  "hit-wind",
  "hit-holy",
  "hit-dark",
  "kind-aoe",
  "kind-single",
  "kind-heal",
  "kind-shield",
  "kind-buff",
  "kind-debuff",
  "kind-amplify",
  "kind-dual-stone",
  "kind-board-clean",
  "summon-pull",
  "summon-reveal",
  "summon-reveal-rare",
  "fusion-cast",
  "wish-reveal",
  "enhance-tick",
  "forge-reveal",
];
