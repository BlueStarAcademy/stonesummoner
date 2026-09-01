import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  islandCriticalAssetUrls,
  preloadIslandAssets,
  type IslandPreloadProgress,
} from "./islandPreload.js";

describe("island image preload", () => {
  it("includes the map, buildings, navigation, summoner, and profile art once", () => {
    const urls = islandCriticalAssetUrls(
      "water",
      "/art/monster/example.webp",
    );
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.includes("/art/home/home-island-tri@2x.webp"));
    assert.ok(urls.includes("/art/hub/bldg-summon.webp"));
    assert.ok(urls.includes("/art/ui/nav/battle.webp"));
    assert.ok(urls.includes("/art/summoner/water.webp"));
    assert.ok(urls.includes("/art/monster/example.webp"));
  });

  it("reports progress through failures and always reaches 100 percent", async () => {
    const reports: IslandPreloadProgress[] = [];
    const failedUrl = `/test/fail-${Date.now()}.webp`;
    const okUrl = `/test/ok-${Date.now()}.webp`;
    const result = await preloadIslandAssets(
      [okUrl, failedUrl],
      (progress) => reports.push({ ...progress }),
      {
        concurrency: 2,
        load: async (url) => url !== failedUrl,
      },
    );
    assert.deepEqual(result.failed, [failedUrl]);
    assert.equal(reports[0]?.percent, 0);
    assert.equal(reports.at(-1)?.percent, 100);
    assert.equal(reports.at(-1)?.completed, 2);
  });
});
