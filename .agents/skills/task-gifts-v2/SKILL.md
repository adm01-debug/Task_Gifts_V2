---
name: task-gifts-v2
description: Convenções de código e commit do Task Gifts V2 (TypeScript, React 19, Conventional Commits). Use ao alterar código, criar testes ou escrever mensagem de commit neste repositório; as regras operacionais ficam em AGENTS.md.
---

# Task Gifts V2 — convenções

As regras de trabalho (banco, fluxo Git, PR, deploy, comunicação) estão em `AGENTS.md` na raiz e em
`docs/agentes/` — este skill só resume convenções de código e commit.

## Commits

Padrão Conventional Commits, cobrado pelo hook `commit-msg` (`scripts/ci/commit-msg-lint.mjs`):
`<tipo>(<escopo>): <descrição>` — escopo opcional e minúsculo; assunto com pelo menos 10 caracteres,
sem ponto final; tipos: `feat fix docs style refactor perf test build ci chore security revert`.
Mensagem em PT-BR, modo imperativo, primeira linha curta.

Exemplo: `fix(edge): alinha allowlist de funcoes deployadas com o painel`

## Código

- Linguagem: TypeScript (front Vite 8 + React 19 em `src/`, edge functions Deno em
  `supabase/functions/`).
- Funções `camelCase`, componentes `PascalCase`, constantes `SCREAMING_SNAKE_CASE`.
- Service por domínio em `src/services/<dominio>Service.ts` exportando **um objeto**
  (`export const xService = { ... }`) + os tipos do domínio; o acesso ao Supabase mora no service, não
  no componente.
- Alias `@` → `src/`. Ele está declarado em **quatro** lugares (`vite.config.ts`, `vitest.config.ts`,
  `.storybook/main.ts`, `tsconfig.app.json`) e nada valida a sincronia: alias novo precisa dos quatro.
- `src/integrations/supabase/types.ts` é **gerado** — nunca editar à mão.
- Teste unitário em `src/test/` ou `src/tests/unit/` (ambos casam com o glob do vitest `src/**`);
  E2E em `tests/` (Playwright). Rode só o que tocou: `npx vitest run <caminho>`.
- Typecheck de verdade: `npx tsc --noEmit -p tsconfig.app.json` — `bun run typecheck` é no-op
  (`tsconfig.json` tem `"files": []` + `references`).
- Cor/espaçamento sempre por token do `tailwind.config.ts`/`src/index.css` (há tema dark e light);
  nunca valor literal.
- Siga os padrões já existentes no módulo; não desvie sem motivo registrado na PR.
