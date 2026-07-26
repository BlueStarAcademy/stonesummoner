import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  resolve: {
    alias: {
      "stonesummoner-board": path.resolve(root, "../../packages/board/src/index.ts"),
      "stonesummoner-combat": path.resolve(root, "../../packages/combat/src/index.ts"),
      "stonesummoner-data": path.resolve(root, "../../packages/data/src/index.ts"),
      "stonesummoner-home": path.resolve(root, "../../packages/home/src/index.ts"),
      "stonesummoner-loop": path.resolve(root, "../../packages/loop/src/index.ts"),
    },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.svg"],
      manifest: {
        name: "StoneSummoner",
        short_name: "StoneSummoner",
        description: "상징으로 키우고, 마법진에서 싸운다",
        theme_color: "#1a1528",
        background_color: "#0e0b16",
        display: "standalone",
        orientation: "portrait",
        start_url: "/island",
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,png,woff2}"],
        // stages-world-map.png (~3.3 MB) and auth heroes exceed Workbox's 2 MiB default
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
});
