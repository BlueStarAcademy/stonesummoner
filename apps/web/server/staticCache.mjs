/**
 * HTTP cache for the PWA shell vs hashed bundles.
 * Service worker / HTML must always revalidate so a Railway deploy is visible
 * in an already-installed PWA. Hashed /assets/* can be cached forever.
 */
export const SHELL_CACHE_CONTROL = "no-cache, must-revalidate";
export const HASHED_ASSET_CACHE_CONTROL =
  "public, max-age=31536000, immutable";
export const PUBLIC_FILE_CACHE_CONTROL = "public, max-age=3600";

function pathnameOnly(filePath) {
  const raw = String(filePath ?? "");
  const noQuery = raw.split("?")[0];
  const normalized = noQuery.replaceAll("\\", "/");
  const idx = normalized.lastIndexOf("/");
  const base = idx >= 0 ? normalized.slice(idx + 1) : normalized;
  return { normalized, base };
}

export function cacheControlForAssetPath(filePath) {
  const { normalized, base } = pathnameOnly(filePath);
  if (
    base === "index.html" ||
    base === "sw.js" ||
    base === "registerSW.js" ||
    base === "manifest.webmanifest" ||
    base.endsWith(".webmanifest")
  ) {
    return SHELL_CACHE_CONTROL;
  }
  if (normalized.includes("/assets/") || /(^|\/)assets\//.test(normalized)) {
    return HASHED_ASSET_CACHE_CONTROL;
  }
  return PUBLIC_FILE_CACHE_CONTROL;
}
