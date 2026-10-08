import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_MS = 5 * 60 * 1000;

/** Register the generated SW and re-check whenever the PWA returns to foreground. */
export function registerPwaAutoUpdate(): void {
  if (!("serviceWorker" in navigator)) return;
  // Native builds swap bundles via live update; a SW would keep serving the old one.
  if (Capacitor.isNativePlatform()) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((reg) => reg.unregister())));
    return;
  }
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        void registration.update();
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      window.addEventListener("focus", check);
      window.setInterval(check, UPDATE_CHECK_MS);
    },
  });
}
