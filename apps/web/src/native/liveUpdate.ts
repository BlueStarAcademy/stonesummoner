import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater, type ManifestEntry } from "@capgo/capacitor-updater";
import { apiUrl } from "../api/url";

export interface LiveUpdate {
  version: string;
  manifest: ManifestEntry[];
}

export function liveUpdateSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/** Must run on every native boot or the updater rolls back to the previous bundle. */
export async function markLiveUpdateReady(): Promise<void> {
  if (!liveUpdateSupported()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* builtin bundle without updater state */
  }
}

async function runningVersion(): Promise<string> {
  try {
    const res = await fetch("/app-version.json", { cache: "no-store" });
    if (!res.ok) return "";
    const body = (await res.json()) as { version?: string };
    return String(body.version ?? "");
  } catch {
    return "";
  }
}

export async function findLiveUpdate(timeoutMs = 6000): Promise<LiveUpdate | null> {
  if (!liveUpdateSupported()) return null;
  try {
    const latest = await Promise.race([
      fetch(apiUrl("/api/app-update/latest"), { cache: "no-store" }).then((res) =>
        res.ok ? (res.json() as Promise<LiveUpdate>) : null,
      ),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!latest?.version || !Array.isArray(latest.manifest)) return null;
    const current = await runningVersion();
    return current && current === latest.version ? null : latest;
  } catch {
    return null;
  }
}

/** Download changed files only, then switch bundles (the WebView reloads). */
export async function applyLiveUpdate(
  update: LiveUpdate,
  onProgress: (percent: number) => void,
): Promise<void> {
  const listener = await CapacitorUpdater.addListener("download", (event) => {
    onProgress(Math.max(0, Math.min(100, Math.round(event.percent))));
  });
  try {
    const bundle = await CapacitorUpdater.download({
      url: apiUrl("/api/app-update/latest"),
      version: update.version,
      manifest: update.manifest,
    });
    await CapacitorUpdater.set({ id: bundle.id });
  } finally {
    void listener.remove();
  }
}
