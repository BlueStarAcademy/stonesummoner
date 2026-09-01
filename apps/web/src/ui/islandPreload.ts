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

export interface IslandPreloadProgress {
  completed: number;
  total: number;
  percent: number;
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

function loadImage(url: string, timeoutMs: number): Promise<boolean> {
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
        loadImage(url, options?.timeoutMs ?? 15_000)
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
