import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android package wraps the Vite build in apps/web/dist.
 * Cloud sync requires VITE_API_BASE pointing at the HTTPS API (e.g. Railway)
 * when building for Capacitor — relative /api does not work inside the WebView.
 */
const config: CapacitorConfig = {
  appId: "com.bluestaracademy.stonesummoner",
  appName: "StoneSummoner",
  webDir: "dist",
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
  },
};

export default config;
