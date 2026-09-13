import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

const appBase = "/fmq-test-console/";

export default defineConfig({
  base: appBase,
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: "script",
      scope: appBase,
      filename: "sw.js",
      manifestFilename: "manifest.webmanifest",
      manifest: {
        id: appBase,
        name: "FMQ Test Console",
        short_name: "Test Console",
        description: "Local evidence-recording companion for Family Music Quest hardware acceptance.",
        start_url: appBase,
        scope: appBase,
        display: "standalone",
        background_color: "#f3f6f7",
        theme_color: "#0d6870",
        lang: "en-CA",
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
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cacheId: "fmq-test-console",
        cleanupOutdatedCaches: false,
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: "index.html",
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
  },
});
