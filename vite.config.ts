import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      // Use the hand-authored public/manifest.json + <link> in index.html.
      manifest: false,
      includeAssets: [
        "favicon.svg",
        "favicon-32.png",
        "favicon-96.png",
        "apple-touch-icon.png",
        "og.png",
      ],
      workbox: {
        // Precache the app shell. The bg-remover ONNX runtime + wasm are huge
        // and only needed for one tool, so keep them out of the precache and
        // cache them at runtime on first use instead.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        globIgnores: ["**/ort*.{js,mjs,wasm}", "**/*.wasm"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // SPA deep links resolve to the app shell when offline.
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // bg-remover ONNX runtime + wasm (loaded on demand) - cache after first use
            urlPattern: /\/assets\/(ort|.*\.wasm).*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "bg-remover-model",
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
});
