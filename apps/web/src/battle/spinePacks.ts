/**
 * Spine pack registry.
 * Production packs only — Esoteric spineboy is NOT registered (dev-only under
 * public/art/spine/pilot/; see docs/art/spine/fire_fang-brief.md).
 */

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

/** Fantasy pilot pack — assets under public/art/spine/fire_fang/ (see brief). */
export const SPINE_PACKS: Record<string, SpinePack> = {
  fire_fang: {
    id: "fire_fang",
    skeletonUrl: "/art/spine/fire_fang/fire_fang.json",
    atlasUrl: "/art/spine/fire_fang/fire_fang-pma.atlas",
    clips: {
      idle: "idle",
      walk: "walk",
      run: "run",
      attack: "attack",
      cast: "cast",
      ult: "ult",
      hit: "hit",
      death: "death",
    },
    scale: 0.36,
    offsetY: 4,
    skins: { front: "front", back: "back" },
    stillFrontUrl: "/art/spine/fire_fang/src/front.png",
    stillBackUrl: "/art/spine/fire_fang/src/back.png",
  },
};

/**
 * Resolve which Spine pack a catalog / unit id uses.
 * Packs are keyed by artKey (e.g. fire_fang); family variants alias to that pack.
 */
export function resolveSpinePackId(
  monsterOrSummonerKey: string | undefined | null,
): string | null {
  if (!monsterOrSummonerKey) return null;
  if (SPINE_PACKS[monsterOrSummonerKey]) return monsterOrSummonerKey;
  // Family variants share the family's pilot artKey until per-element Spine skins ship.
  if (monsterOrSummonerKey.startsWith("seokrang_")) return "fire_fang";
  if (monsterOrSummonerKey === "fire_fang") return "fire_fang";
  return null;
}

export function getSpinePack(packId: string): SpinePack | null {
  return SPINE_PACKS[packId] ?? null;
}

/** Battle-character still for monster book / UI (transparent; falls back to null). */
export function getBattleStillSrc(
  monsterId: string | undefined | null,
  facing: "front" | "back" = "front",
): string | null {
  const packId = resolveSpinePackId(monsterId);
  if (!packId) return null;
  const pack = getSpinePack(packId);
  if (!pack) return null;
  if (facing === "back") return pack.stillBackUrl ?? pack.stillFrontUrl ?? null;
  return pack.stillFrontUrl ?? null;
}
