import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HASHED_ASSET_CACHE_CONTROL,
  PUBLIC_FILE_CACHE_CONTROL,
  SHELL_CACHE_CONTROL,
  cacheControlForAssetPath,
} from "./staticCache.mjs";

describe("cacheControlForAssetPath", () => {
  it("never caches the PWA shell so deploys reach installed clients", () => {
    for (const path of [
      "/index.html",
      "/sw.js",
      "/registerSW.js",
      "/manifest.webmanifest",
      "C:\\\\app\\\\dist\\\\sw.js",
    ]) {
      assert.equal(cacheControlForAssetPath(path), SHELL_CACHE_CONTROL);
    }
  });

  it("long-caches hashed bundles", () => {
    assert.equal(
      cacheControlForAssetPath("/assets/index-AbC123.js"),
      HASHED_ASSET_CACHE_CONTROL,
    );
  });

  it("keeps a short TTL for unhashed public files", () => {
    assert.equal(
      cacheControlForAssetPath("/art/home/home-island-tri@2x.webp"),
      PUBLIC_FILE_CACHE_CONTROL,
    );
  });
});
