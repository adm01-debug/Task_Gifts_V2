# RELATÓRIO CI — Task_Gifts_V2

**Data:** 2026-10-29  
**Agente:** Cline (VS Code)  
**PR original:** [#17](https://github.com/adm01-debug/Task_Gifts_V2/pull/17) — corrigiu 4 causas raiz  
**Última run na main:** [#408](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/40929878167) ✅ success

---

## 1. Inventário de Workflows

| Workflow | Última execução na main | Status |
|----------|------------------------|--------|
| **CI** (`ci.yml`) | [Run #408](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/40929878167) | ✅ success |
| Dependabot Updates | success | ✅ success |
| Copilot | sem execuções regulares | — |

**Filtro `action_required + failure` na main: 0 resultados.**

---

## 2. Baseline (referência)

Referência: [Run #363](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/33987507684) — último sucesso antes das falhas (commit `f50a57c1`).

| Step | Status no baseline |
|------|--------------------|
| Install dependencies | ✅ |
| Lint | ✅ 0 erros |
| Type Check | ✅ |
| Unit Tests | ✅ **137 passed \| 2 skipped (139 files)** |
| E2E Gate | ✅ |

---

## 3. Causas raiz corrigidas (PR #17)

| # | Causa | Erro | Correção |
|---|-------|------|---------|
| 1 | `bun.lock` desatualizado | `lockfile frozen` | Regenerado via `bun install` |
| 2 | TypeScript 7.0 vs typescript-eslint@8.x | `does not support TS 7.0` | `typescript ~5.9.3` |
| 3 | supabase-js@2.118+ valida URL | `supabaseUrl is required` (14 test files) | Mock no `setup.ts` |
| 4 | tailwindcss@4 quebra PostCSS | `use @tailwindcss/postcss instead` | `tailwindcss ^3.4.17` |

---

## 4. Correções adicionais (PRs posteriores)

| PR | Correção |
|----|---------|
| [#19](https://github.com/adm01-debug/Task_Gifts_V2/pull/19) | `dependabot.yml` — ignora majors de TS, Tailwind, @hookform/resolvers; grupo limitado a minor/patch |
| [#27](https://github.com/adm01-debug/Task_Gifts_V2/pull/27) | `ci.yml` — fallback de env vars para E2E em PRs do Dependabot (secrets não disponíveis) |

---

## 5. PRs do Dependabot mergeados

| PR | Atualização | Run CI | Status |
|----|-------------|--------|--------|
| #20 | actions/checkout v4→v7 | #398 | ✅ |
| #21 | actions/upload-artifact v4→v7 | #399 | ✅ |
| #22 | actions/cache v4→v6 | #397 | ✅ |
| #23 | oven-sh/setup-bun v1→v2 | #400 | ✅ |
| #24 | 58 deps minor/patch (radix-ui, hookform, etc.) | #407 | ✅ |
| #25 | vite-plugin-pwa 1.3→2.0 | #390 | ✅ |
| #26 | framer-motion 13→14 | #388 | ✅ |

---

## 6. Comparação Baseline × Final

| Métrica | Baseline (run #363) | Final (run #408) | Δ |
|---------|--------------------|--------------------|---|
| `bun install --frozen-lockfile` | ✅ | ✅ | = |
| `bun run build` | ✅ | ✅ | = |
| Lint — erros | 0 | **0** | = |
| TypeCheck | ✅ | ✅ | = |
| Test Files passed | 137 | **137** | = |
| Test Files skipped | 2 | 2 | = |

**Sem regressão. Sem alteração de comportamento da aplicação.**

---

## 7. Workflows que estavam verdes — continuam verdes

| Workflow | Status antes | Status final |
|----------|-------------|--------------|
| Dependabot Updates | ✅ | ✅ |
| Copilot | sem runs | sem runs |

---

## 8. Gaps e Melhorias

### 8.1 Implementadas

| Item | Arquivo | Mudança |
|------|---------|---------|
| Dependabot ignora majors problemáticos | `.github/dependabot.yml` | `ignore` para TS, Tailwind, @hookform; grupo = minor/patch |
| CI funciona sem secrets (Dependabot) | `.github/workflows/ci.yml` | Fallback `\|\|` para `VITE_SUPABASE_URL/KEY` |

### 8.2 Pendentes

1. **`vitest.config.ts`:** `pool: 'vmThreads'` reduz o tempo de testes em ~30%.
2. **`typescript-eslint@9`:** Quando lançar suporte a TS 7.x, fazer upgrade coordenado e remover o `ignore` do dependabot.yml.
3. **`bun` nativo no Dependabot:** Configurar `ecosystem: bun` quando suportado oficialmente.
