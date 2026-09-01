const BUILDING_TONES = [
  "dojo",
  "forge",
  "fusion",
  "gate",
  "glory",
  "guild",
  "mine",
  "party",
  "pond",
  "shop",
  "summon",
  "wish",
] as const;

const STATIC_ASSETS = [
  "/art/home/home-island-tri@2x.webp",
  "/art/ui/nav/battle.webp",
  "/art/ui/nav/community.webp",
  "/art/ui/nav/mission.webp",
  "/art/ui/nav/monster.webp",
  "/art/ui/nav/shop.webp",
  "/art/ui/nav/summoner-frame.webp",
  "/art/ui/res/energy.svg",
  "/art/ui/res/gold.svg",
  "/art/ui/res/crystal.svg",
  "/art/auth/logo-mark-192.png",
  ...BUILDING_TONES.map((tone) => `/art/hub/bldg-${tone}.webp`),
  ...BUILDING_TONES.map((tone) => `/art/hub/emblem-${tone}.svg`),
] as const;

const readyAssets = new Set<string>();
export const ISLAND_ASSET_CACHE_NAME = "island-critical-v1";
/** Bump only when the island-visible asset pack changes. */
export const ISLAND_ASSET_PACK_VERSION = "1";
const ISLAND_ASSET_PACK_KEY = "stonesummoner:island-assets";

export interface IslandPreloadProgress {
  completed: number;
  total: number;
  percent: number;
}

export async function isIslandAssetPackPrepared(
  urls: readonly string[] = [],
  storage: Pick<Storage, "getItem"> = localStorage,
): Promise<boolean> {
  if (storage.getItem(ISLAND_ASSET_PACK_KEY) !== ISLAND_ASSET_PACK_VERSION) {
    return false;
  }
  if (typeof caches === "undefined" || urls.length === 0) return true;
  try {
    const cache = await caches.open(ISLAND_ASSET_CACHE_NAME);
    const matches = await Promise.all(
      [...new Set(urls)].map((url) => cache.match(url)),
    );
    return matches.every(Boolean);
  } catch {
    return true;
  }
}

export function markIslandAssetPackPrepared(
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  storage.setItem(ISLAND_ASSET_PACK_KEY, ISLAND_ASSET_PACK_VERSION);
}

export function islandCriticalAssetUrls(
  activeElement: string,
  profileIcon: string,
): string[] {
  return [
    ...STATIC_ASSETS,
    `/art/summoner/${activeElement}.webp`,
    profileIcon,
  ].filter((url, index, all) => Boolean(url) && all.indexOf(url) === index);
}

function decodeImageSource(url: string, timeoutMs: number): Promise<boolean> {
  if (readyAssets.has(url)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (loaded) readyAssets.add(url);
      resolve(loaded);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    image.decoding = "async";
    image.onload = () => {
      if (typeof image.decode !== "function") {
        finish(true);
        return;
      }
      void image.decode().then(
        () => finish(true),
        () => finish(true),
      );
    };
    image.onerror = () => finish(false);
    image.src = url;
  });
}

async function cacheAndDecodeImage(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  if (readyAssets.has(url)) return true;
  if (typeof caches === "undefined") return decodeImageSource(url, timeoutMs);
  try {
    const cache = await caches.open(ISLAND_ASSET_CACHE_NAME);
    let response = await cache.match(url);
    if (!response) {
      response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) return false;
      await cache.put(url, response.clone());
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const decoded = await decodeImageSource(objectUrl, timeoutMs);
    URL.revokeObjectURL(objectUrl);
    readyAssets.delete(objectUrl);
    if (decoded) readyAssets.add(url);
    return decoded;
  } catch {
    return decodeImageSource(url, timeoutMs);
  }
}

export async function preloadIslandAssets(
  urls: readonly string[],
  onProgress: (progress: IslandPreloadProgress) => void,
  options?: {
    concurrency?: number;
    timeoutMs?: number;
    load?: (url: string) => Promise<boolean>;
  },
): Promise<{ failed: string[] }> {
  const unique = [...new Set(urls.filter(Boolean))];
  const pending = unique.filter((url) => !readyAssets.has(url));
  const failed: string[] = [];
  let completed = unique.length - pending.length;
  let cursor = 0;
  const report = () => {
    const total = unique.length;
    onProgress({
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 100,
    });
  };
  report();

  const worker = async () => {
    while (cursor < pending.length) {
      const url = pending[cursor++]!;
      const loaded = await (
        options?.load?.(url) ??
        cacheAndDecodeImage(url, options?.timeoutMs ?? 15_000)
      );
      if (!loaded) failed.push(url);
      completed += 1;
      report();
    }
  };
  const concurrency = Math.max(
    1,
    Math.min(options?.concurrency ?? 4, pending.length || 1),
  );
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { failed };
}
