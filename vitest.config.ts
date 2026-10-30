import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    testTimeout: 60000,
    hookTimeout: 30000,
    // vmThreads: reutiliza o worker por arquivo de teste (mantém isolamento
    // por arquivo mas evita criar uma nova instância de jsdom a cada test file).
    // Reduz o tempo de setup de ~65% para ~20-30% do total.
    pool: "vmThreads",
    poolOptions: {
      vmThreads: {
        useAtomics: true,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
