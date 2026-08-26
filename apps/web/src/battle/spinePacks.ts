/**
 * Spine pack registry.
 * Production packs only — Esoteric spineboy is NOT registered (dev-only under
 * public/art/spine/pilot/; see docs/art/spine/fire_fang-brief.md).
 */

import { getMonsterArtKey, getMonsterFamilyArtKey } from "stonesummoner-data";

export type SpineClip =
  | "idle"
  | "walk"
  | "run"
  | "attack"
  | "cast"
  | "ult"
  | "hit"
  | "death";

export interface SpinePack {
  id: string;
  /**
   * When false, battle/book keep painted WebP stills and do not mount Pixi.
   * Use for pilot packs whose atlas is only body_front/back regions (looks broken
   * vs `/art/monster/battle/*` stills) until a real cutup export ships.
   */
  enabled?: boolean;
  /** Pixi Assets aliases / public URLs */
  skeletonUrl: string;
  atlasUrl: string;
  /** Map our clip names → Spine animation names in this pack. */
  clips: Partial<Record<SpineClip, string>>;
  /** Display scale inside unit slot. */
  scale: number;
  /** Y offset from bottom-center (positive = up). */
  offsetY: number;
  /**
   * Distinct front/back skins (preferred). When `back` is set, runtime must not
   * fake facing with scaleX mirror alone.
   */
  skins?: { front?: string; back?: string };
  /** Transparent full-body stills (same art as battle Spine skins) for book UI. */
  stillFrontUrl?: string;
  stillBackUrl?: string;
}

const PILOT_CLIPS: SpinePack["clips"] = {
  idle: "idle",
  walk: "walk",
  run: "run",
  attack: "attack",
  cast: "cast",
  ult: "ult",
  hit: "hit",
  death: "death",
};

/** Fantasy pilot packs — see docs/art/spine/*.md */
export const SPINE_PACKS: Record<string, SpinePack> = {
  fire_fang: {
    id: "fire_fang",
    // 2-region PMA sheet hides painted stills; keep pack assets for later re-enable.
    enabled: false,
    skeletonUrl: "/art/spine/fire_fang/fire_fang.json",
    atlasUrl: "/art/spine/fire_fang/fire_fang-pma.atlas",
    clips: { ...PILOT_CLIPS },
    scale: 0.36,
    offsetY: 4,
    skins: { front: "front", back: "back" },
    stillFrontUrl: "/art/spine/fire_fang/src/front.png",
    stillBackUrl: "/art/spine/fire_fang/src/back.png",
  },
  /** Pilot clone of fire_fang rig until unique Spine export ships. */
  wolf_fighter: {
    id: "wolf_fighter",
    enabled: false,
    skeletonUrl: "/art/spine/wolf_fighter/wolf_fighter.json",
    atlasUrl: "/art/spine/wolf_fighter/wolf_fighter-pma.atlas",
    clips: { ...PILOT_CLIPS },
    scale: 0.36,
    offsetY: 4,
    skins: { front: "front", back: "back" },
    stillFrontUrl: "/art/monster/battle/wolf_fighter-front.webp",
    stillBackUrl: "/art/monster/battle/wolf_fighter-back.webp",
  },
  /** Pilot clone of fire_fang rig until unique Spine export ships. */
  moss_turtle: {
    id: "moss_turtle",
    enabled: false,
    skeletonUrl: "/art/spine/moss_turtle/moss_turtle.json",
    atlasUrl: "/art/spine/moss_turtle/moss_turtle-pma.atlas",
    clips: { ...PILOT_CLIPS },
    scale: 0.34,
    offsetY: 2,
    skins: { front: "front", back: "back" },
    stillFrontUrl: "/art/monster/battle/moss_turtle-front.webp",
    stillBackUrl: "/art/monster/battle/moss_turtle-back.webp",
  },
};

function isSpinePackMountable(pack: SpinePack | undefined): pack is SpinePack {
  return !!pack && pack.enabled !== false;
}

/**
 * Resolve which Spine pack a catalog / unit id uses.
 * Packs are keyed by artKey (e.g. fire_fang); family variants alias to that pack.
 * Returns null when the pack is registered but `enabled: false` (use WebP stills).
 */
export function resolveSpinePackId(
  monsterOrSummonerKey: string | undefined | null,
): string | null {
  if (!monsterOrSummonerKey) return null;
  const direct = SPINE_PACKS[monsterOrSummonerKey];
  if (isSpinePackMountable(direct)) return monsterOrSummonerKey;
  const artKey = getMonsterArtKey(monsterOrSummonerKey);
  if (artKey && isSpinePackMountable(SPINE_PACKS[artKey])) return artKey;
  // Family variants share the family's pilot artKey until per-element Spine skins ship.
  let aliased: string | null = null;
  if (monsterOrSummonerKey.startsWith("seokrang_")) aliased = "fire_fang";
  else if (monsterOrSummonerKey === "fire_fang") aliased = "fire_fang";
  else if (monsterOrSummonerKey.startsWith("wolf_fighter")) aliased = "wolf_fighter";
  else if (monsterOrSummonerKey.startsWith("moss_turtle")) aliased = "moss_turtle";
  if (aliased && isSpinePackMountable(SPINE_PACKS[aliased])) return aliased;
  return null;
}

export function getSpinePack(packId: string): SpinePack | null {
  const pack = SPINE_PACKS[packId];
  return isSpinePackMountable(pack) ? pack : null;
}

/** Battle-character still for monster book / battle UI (falls back to null). */
export function getBattleStillSrc(
  monsterId: string | undefined | null,
  facing: "front" | "back" = "front",
  preferAwakened = false,
): string | null {
  const artKey = getMonsterArtKey(monsterId);
  if (artKey) {
    const awakenMid = preferAwakened ? "-awaken" : "";
    const suffix = facing === "back" ? "-back" : "-front";
    return `/art/monster/battle/${artKey}${awakenMid}${suffix}.webp`;
  }
  const packId = resolveSpinePackId(monsterId);
  if (packId) {
    const pack = getSpinePack(packId);
    if (pack) {
      if (facing === "back") {
        return pack.stillBackUrl ?? pack.stillFrontUrl ?? null;
      }
      return pack.stillFrontUrl ?? null;
    }
  }
  return null;
}

/** Summoner full-body battle stills under /art/summoner/battle/{el}-front|back.webp */
export function getSummonerBattleStillSrc(
  element: string | undefined | null,
  facing: "front" | "back" = "front",
): string | null {
  const el = (element ?? "").toLowerCase();
  if (!["fire", "water", "wind", "light", "dark"].includes(el)) return null;
  return `/art/summoner/battle/${el}-${facing}.webp`;
}
