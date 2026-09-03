import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { haltAudioForExit, suspendAudioPlayback } from "../audio/manager";

const TRAP = { ssBack: 1 as const };

declare global {
  interface Window {
    __ssHardwareBack?: () => void;
    __ssSuspendAudio?: () => void;
    __ssHaltAudio?: () => void;
    StoneSummonerNative?: { exitApp: () => void };
  }
}

/** True while in-game (or always in the native/PWA shell). */
let trapWanted = false;
/** Ignore further back / history traps after the player confirmed quit. */
let exiting = false;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function isStandaloneDisplay(): boolean {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  } catch {
    /* ignore */
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return !!nav.standalone;
}

/** Installed APK/AAB or home-screen PWA — not a regular browser tab. */
export function isAppShell(): boolean {
  return isNativeApp() || isStandaloneDisplay();
}

function trapIsActive(): boolean {
  return trapWanted || isAppShell();
}

function withTimeout(work: Promise<void>, ms: number): Promise<void> {
  return Promise.race([
    work,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    }),
  ]);
}

function dropTrapState(): void {
  try {
    const st = history.state as { ssBack?: number } | null;
    if (st?.ssBack === 1) {
      history.replaceState(null, "", location.href);
    }
  } catch {
    /* ignore */
  }
}

export function armBackHistoryTrap(): void {
  if (exiting || !trapIsActive()) return;
  try {
    const st = history.state as { ssBack?: number } | null;
    if (st?.ssBack === 1) return;
    history.pushState(TRAP, "", location.href);
  } catch {
    /* ignore */
  }
}

/**
 * Regular browser tabs only trap history while playing so Android Chrome back
 * closes overlays. The login screen stays a normal page (back leaves the site).
 * Native / installed PWA always trap, including the login gate.
 */
export function setBackHistoryTrapWanted(on: boolean): void {
  if (exiting) return;
  trapWanted = on || isAppShell();
  if (trapIsActive()) {
    armBackHistoryTrap();
    return;
  }
  dropTrapState();
}

export async function exitNativeApp(): Promise<void> {
  if (exiting) return;
  exiting = true;
  dropTrapState();

  try {
    await withTimeout(haltAudioForExit(), 400);
  } catch {
    /* still try to leave */
  }

  try {
    window.StoneSummonerNative?.exitApp();
  } catch {
    /* Capacitor plugin / history fallback below */
  }

  if (isNativeApp()) {
    try {
      await App.exitApp();
    } catch {
      /* ignore */
    }
    try {
      await App.minimizeApp();
    } catch {
      /* ignore */
    }
    /* Never history.back() here — the back trap would reopen the quit sheet. */
    return;
  }

  if (isStandaloneDisplay()) {
    try {
      window.close();
    } catch {
      /* ignore */
    }
    return;
  }

  /* Browser tab: do not close AudioContext (window.close is a no-op). */
  setBackHistoryTrapWanted(false);
  try {
    history.back();
  } catch {
    /* stay on the page, still playable */
  }
}

export function installHardwareBack(onBack: () => void): void {
  let lastAt = 0;
  const run = (): void => {
    if (exiting) return;
    const now = Date.now();
    if (now - lastAt < 180) return;
    lastAt = now;
    try {
      onBack();
    } catch {
      /* never let a handler throw through to native finish */
    }
  };

  window.__ssHardwareBack = run;
  window.__ssSuspendAudio = (): void => {
    void suspendAudioPlayback();
  };
  window.__ssHaltAudio = (): void => {
    if (!isNativeApp()) return;
    void haltAudioForExit();
  };
  if (isAppShell()) armBackHistoryTrap();

  window.addEventListener("popstate", () => {
    if (exiting || !trapIsActive()) return;
    armBackHistoryTrap();
    run();
  });

  document.addEventListener("backbutton", () => {
    run();
  });

  const hookNative = (): void => {
    if (!Capacitor.isNativePlatform()) return;
    void App.addListener("backButton", () => {
      run();
    }).catch(() => undefined);
  };
  hookNative();
  window.setTimeout(hookNative, 400);
  window.setTimeout(hookNative, 1500);
}
