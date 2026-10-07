import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Work/master folders under public/art that must never ship. */
const DEV_ONLY_ART_DIRS = ["_staging", "stages/_src", "battle/_src"];
/** Heavy painted art served from the API host in app (Capacitor) builds. */
const REMOTE_ART_DIRS = ["monster", "battle", "stages"];

function artPackagingPlugin(assetBase: string): Plugin {
  const remoteRef = new RegExp(
    `(["'\`(])/art/(${REMOTE_ART_DIRS.join("|")})/`,
    "g",
  );
  const rewrite = (text: string) =>
    text.replace(remoteRef, `$1${assetBase}/art/$2/`);
  let outDir = "";
  return {
    name: "stonesummoner-art-packaging",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      if (!assetBase) return;
      for (const file of Object.values(bundle)) {
        if (file.type === "chunk") {
          file.code = rewrite(file.code);
        } else if (/\.(?:css|html)$/.test(file.fileName)) {
          const text =
            typeof file.source === "string"
              ? file.source
              : Buffer.from(file.source).toString("utf8");
          file.source = rewrite(text);
        }
      }
    },
    closeBundle() {
      const drop = assetBase
        ? [...DEV_ONLY_ART_DIRS, ...REMOTE_ART_DIRS]
        : DEV_ONLY_ART_DIRS;
      for (const dir of drop) {
        fs.rmSync(path.join(outDir, "art", dir), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "VITE_");
  const assetBase =
    mode === "app"
      ? (env.VITE_ASSET_BASE || env.VITE_API_BASE || "").trim().replace(/\/$/, "")
      : "";
  if (mode === "app" && !/^https:\/\//.test(assetBase)) {
    throw new Error(
      "App build needs VITE_ASSET_BASE or VITE_API_BASE (https://...) to load remote art.",
    );
  }
  return {
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
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("pixi.js") || id.includes("@pixi")) return "pixi";
            if (id.includes("@esotericsoftware/spine")) return "spine";
          },
        },
      },
    },
    plugins: [
      artPackagingPlugin(assetBase),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        includeAssets: ["favicon.svg", "icons/*.svg", "icons/*.png"],
        manifest: {
          name: "StoneSummoner",
          short_name: "StoneSummoner",
          description: "상징으로 키우고, 마법진에서 싸운다",
          theme_color: "#1a1528",
          background_color: "#0e0b16",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
          globIgnores: ["art/stages/_src/**"],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/api\//],
          // stages terrain / world-map and auth heroes can exceed Workbox's 2 MiB default
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                /^\/art\/(?:home\/|hub\/|ui\/(?:nav|res)\/|summoner\/|auth\/|monster\/[^/]+\.(?:webp|png|svg)$)/.test(
                  url.pathname,
                ),
              handler: "CacheFirst",
              options: {
                cacheName: "island-critical-v1",
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8080",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
    },
  };
});
