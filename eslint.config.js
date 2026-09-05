import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      // Gerado por `supabase gen types` — não é código escrito à mão;
      // regenerar a cada mudança de schema.
      "src/integrations/supabase/types.ts",
      // Edge Functions rodam em Deno (globals `Deno`, imports via URL esm.sh).
      // O lint abaixo assume browser/node; Deno tem seus próprios checks
      // (deno lint) e suites de teste dedicadas (_test.ts / *.test.ts).
      "supabase/functions/**",
      // Scripts utilitários de build (CJS/node) fora do app.
      "scripts/**",
      "bun.lock",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // ------------------------------------------------------------------
      // Onda 1 (2026-09-05): diagnósticos do React Compiler (eslint-plugin-
      // react-hooks v7) rebaixados para "warn". O codebase React 18 não foi
      // escrito para o Compiler; as ~140 ocorrências viram projeto dedicado
      // (Onda 2/3) com meta de restaurar "error" quando zeradas.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/incompatible-library": "warn",
      // Onda 1: `any` explícito como warn — zerar os ~48 casos (majoritariamente
      // em testes) na Onda 2 e restaurar "error".
      "@typescript-eslint/no-explicit-any": "warn",
      "no-useless-assignment": "warn",
    },
  },
);
