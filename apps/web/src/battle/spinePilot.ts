/**
 * Public Spine API — Pixi + spine-pixi-v8 mounts.
 * Falls back silently when assets/runtime fail (WebP stays visible).
 */
import { getSpinePack } from "./spinePacks";

export {
  destroyAllSpine,
  getSpineController,
  mountBattleSpines,
  mountBookPreviewSpine,
  mountSpineInHost,
  playSpineClip,
} from "./spineRuntime";
export type { SpineController, SpineFacing, SpineMountOpts } from "./spineRuntime";
export {
  getSpinePack,
  getBattleStillSrc,
  resolveSpinePackId,
  SPINE_PACKS,
} from "./spinePacks";
export type { SpineClip, SpinePack } from "./spinePacks";

/** @deprecated use mountBattleSpines — kept for old call sites */
export function attachSpinePilot(
  _host: HTMLElement,
  _id: string,
): () => void {
  return () => {
    /* no-op; mounts are owned by mountBattleSpines */
  };
}

export const SPINE_ASSET_BASE = "/art/spine";

export function spineAssetUrl(monsterOrSummonerId: string): string {
  const pack = getSpinePack(monsterOrSummonerId);
  if (pack) return pack.skeletonUrl;
  return `${SPINE_ASSET_BASE}/${encodeURIComponent(monsterOrSummonerId)}/${encodeURIComponent(monsterOrSummonerId)}.json`;
}

export async function hasSpineAsset(id: string): Promise<boolean> {
  try {
    const res = await fetch(spineAssetUrl(id), { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
