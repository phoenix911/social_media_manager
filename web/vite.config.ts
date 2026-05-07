import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// Build-time stamp baked into the bundle: vYYYY.MMDD.HHMM (local time
// on the machine that ran the build). Surfaced at runtime as
// __APP_VERSION__.
const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const APP_VERSION = `v${now.getFullYear()}.${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        name: "Social Media Manager",
        short_name: "Social",
        description:
          "Drafts, scheduling, and publishing across Reddit, LinkedIn, X, Instagram, and Product Hunt.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/cdn-cgi\//],
        runtimeCaching: [
          // Force every /api/* request — including PUT/POST uploads —
          // to bypass the SW. Some browsers route Blob-bodied PUTs
          // through the SW's fetch handler in unpredictable ways.
          { urlPattern: /\/api\//, handler: "NetworkOnly", method: "GET" },
          { urlPattern: /\/api\//, handler: "NetworkOnly", method: "POST" },
          { urlPattern: /\/api\//, handler: "NetworkOnly", method: "PUT" },
          { urlPattern: /\/api\//, handler: "NetworkOnly", method: "DELETE" },
          {
            // Static assets cached for fast repeat loads.
            urlPattern: ({ request }) => ["style", "script", "image", "font"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "smm-static" },
          },
        ],
      },
      devOptions: {
        enabled: false, // SW only in prod; avoids dev-server cache weirdness
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: false,
      },
    },
  },
  build: { sourcemap: true },
});
