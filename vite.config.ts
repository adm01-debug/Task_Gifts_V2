import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "placeholder.svg", "og-image.jpg"],
      manifest: {
        name: "Task Gifts - Gamificação Corporativa",
        short_name: "Task Gifts",
        description: "Plataforma de gamificação e treinamento corporativo",
        theme_color: "#6366f1",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["productivity", "education", "business"],
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Task Gifts Dashboard"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Task Gifts Mobile"
          }
        ],
        shortcuts: [
          {
            name: "Minhas Metas",
            short_name: "Metas",
            description: "Visualizar metas e OKRs",
            url: "/goals",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Ranking",
            short_name: "Ranking",
            description: "Ver classificação da liga",
            url: "/leagues",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Trilhas",
            short_name: "Trilhas",
            description: "Continuar aprendizado",
            url: "/trails",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Margem acima do default (2 MiB) para que chunks legítimos de libs
        // (vendor/radix) não fiquem fora do precache do service worker.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Supabase API responses for offline support
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(profiles|achievements|departments|learning_trails).*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache images and avatars
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.join(import.meta.dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) exige manualChunks como função; preserva a intenção
        // original de separar libs pesadas em chunks próprios.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts")) return "charts";
          if (id.includes("framer-motion")) return "animation";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("lucide-react")) return "ui";
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("exceljs")) return "excel";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@sentry")) return "sentry";
          if (id.includes("date-fns")) return "date";
          return "vendor";
        },
      },
    },
  },
}));
