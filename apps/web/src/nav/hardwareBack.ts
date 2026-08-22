import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const TRAP = { ssBack: 1 as const };

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function exitNativeApp(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await App.exitApp();
      return;
    } catch {
      /* ignore and try window.close */
    }
  }
  window.close();
}

export function armBackHistoryTrap(): void {
  if (Capacitor.isNativePlatform()) return;
  const st = history.state as { ssBack?: number } | null;
  if (st?.ssBack === 1) return;
  history.pushState(TRAP, "", location.href);
}

export function installHardwareBack(onBack: () => void): void {
  let lastAt = 0;
  const run = (): void => {
    const now = Date.now();
    if (now - lastAt < 80) return;
    lastAt = now;
    onBack();
  };

  if (Capacitor.isNativePlatform()) {
    void App.addListener("backButton", () => {
      run();
    });
    return;
  }

  armBackHistoryTrap();
  window.addEventListener("popstate", () => {
    armBackHistoryTrap();
    run();
  });
}
