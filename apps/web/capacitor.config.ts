import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android package wraps the app build in apps/web/dist-app (`npm run build:app`).
 * Requires VITE_API_BASE pointing at the HTTPS API (e.g. Railway) — relative
 * /api does not work inside the WebView. Monster / battle / stage art is not
 * bundled; it loads from VITE_ASSET_BASE (defaults to VITE_API_BASE).
 */
const config: CapacitorConfig = {
  appId: "com.bluestaracademy.stonesummoner",
  appName: "StoneSummoner",
  webDir: "dist-app",
  server: {
    androidScheme: "https",
  },
  plugins: {
    // Native HTTP + cookie jar so cross-origin session cookies work vs Railway.
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    // MainActivity owns hardware back. If Capacitor handles it, a missing JS
    // listener falls through to WebView.goBack() / activity finish (BGM leak).
    App: {
      disableBackButtonHandler: true,
    },
    // Self-hosted live update: the auth screen checks /api/app-update/latest.
    CapacitorUpdater: {
      autoUpdate: "off",
      appReadyTimeout: 15000,
    },
  },
};

export default config;
