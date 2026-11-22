import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      // Testes de contrato das edge functions (schemas zod puros, sem Deno) — ver
      // supabase/functions/_shared/contracts/README.md. Sufixo .spec.ts de propósito: o
      // workflow deno.yml roda `deno test` em todo *test.ts de supabase/functions.
      "supabase/functions/**/*.contract.spec.ts",
    ],
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
    // Coverage (usado em test:ci). Threshold calculado com base na cobertura
    // medida no primeiro run — subir progressivamente a cada Sprint.
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      // Exclui arquivos gerados, tipos e arquivos de configuração
      exclude: [
        "src/integrations/supabase/types.ts",
        "src/**/*.stories.*",
        "src/**/*.d.ts",
        "src/test/**",
        "src/tests/**",
        "supabase/functions/**/*_test.ts",
        "supabase/functions/**/_fixtures/**",
      ],
      // Thresholds progressivos — aumentar em cada Sprint
      thresholds: {
        statements: 30,
        branches: 25,
        functions: 25,
        lines: 30,
      },
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // As edge functions importam o zod v3 fixado em deno.land; no Node o mesmo
      // especificador resolve para o subpath `zod/v3` do pacote zod@4 já instalado.
      { find: "https://deno.land/x/zod@v3.25/mod.ts", replacement: "zod/v3" },
    ],
  },
});
