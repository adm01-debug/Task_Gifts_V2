# RELATÓRIO CI — Task_Gifts_V2

**Data:** 2026-10-29  
**Agente:** Cline (VS Code)  
**Branch de correção:** `fix/ci-bun-lockfile-h277835`  
**PR:** [#16](https://github.com/adm01-debug/Task_Gifts_V2/pull/16)

---

## 1. Inventário de Workflows

| Workflow | Última execução na main | Status | Conclusão |
|----------|------------------------|--------|-----------|
| **CI** (`ci.yml`) | [Run #368](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/37125712969) — 2026-10-03 | completed | ❌ **failure** |
| Dependabot Updates | [Run #45](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/40298631924) — 2026-10-26 | completed | ✅ success |
| Copilot | Sem execuções na main | — | — |

**Workflow com falha: apenas o CI.**

---

## 2. Baseline (antes da correção)

Referência: [Run #363](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/33987507684) — último sucesso na main (commit `f50a57c1`, 2026-09-05).

| Step | Status no baseline |
|------|--------------------|
| Install dependencies | ✅ success |
| Lint | ✅ success |
| Type Check | ✅ success |
| Unit Tests | ✅ **137 passed \| 2 skipped (139 files)** |
| E2E Gate | ✅ success |
| E2E Não-Bloqueante | ✅ success (continue-on-error) |

---

## 3. Diagnóstico — Causa Raiz

O [PR #11](https://github.com/adm01-debug/Task_Gifts_V2/pull/11) (Dependabot bump de 46 dependências) introduziu **3 causas raiz independentes**:

### Causa 1 — `bun.lock` desatualizado (bloqueante)
- **Erro:** `error: lockfile had changes, but lockfile is frozen`
- **Origem:** O PR #11 atualizou `package.json` e `package-lock.json` mas não regenerou o `bun.lock`. O CI usa `bun install --frozen-lockfile`.
- **Impacto:** Todos os steps subsequentes (lint, typecheck, testes) foram skipped.

### Causa 2 — TypeScript 7.0 incompatível com `typescript-eslint@8.x`
- **Erro:** `Error: typescript-eslint does not support TS 7.0.`
- **Origem:** Bump de `typescript ~5.9.3 → ~7.0.2`. O `typescript-eslint@8.x` aceita apenas `typescript >= 4.8.4 < 6.1.0` (peer dep documentado).
- **Impacto:** Lint falharia com erro fatal após correção do lockfile.

### Causa 3 — `@supabase/supabase-js@2.118+` valida URL na criação
- **Erro:** `Error: supabaseUrl is required.`
- **Origem:** A versão 2.118.0 passou a lançar exceção ao instanciar `createClient(undefined, undefined)`. O `src/test/setup.ts` não definia as env vars de teste.
- **Impacto:** 14 test files falhavam na importação (de 137 que passavam antes).

---

## 4. Correções Aplicadas

| Arquivo | Mudança | Justificativa |
|---------|---------|---------------|
| `package.json` | `typescript ~7.0.2 → ~5.9.3` | TS 7.0 incompatível com typescript-eslint@8.x (peer dep < 6.1.0) |
| `bun.lock` | Regenerado via `bun install` | Sincronizado com package.json após ajuste do TypeScript |
| `src/test/setup.ts` | Mock de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` | supabase-js@2.118+ valida URL na criação; sem mock, 14 test files falham |

---

## 5. Validação Local — Comparação Baseline × Final

| Métrica | Baseline (run #363) | Após correção (local) | Δ |
|---------|---------------------|----------------------|---|
| `bun install --frozen-lockfile` | ✅ | ✅ | = |
| Lint — erros | 0 | 0 | = |
| TypeCheck | ✅ | ✅ | = |
| Test Files passed | 137 | **137** | = |
| Test Files failed | 0 | **0** | = |
| Test Files skipped | 2 | 2 | = |
| Tests passed | — | 1859 | — |
| Tests skipped | — | 12 | — |

**Sem regressão. Sem alteração de comportamento da aplicação, APIs ou schema do banco.**

---

## 6. Status do CI no GitHub

| Tentativa | Run | Conclusão | Causa |
|-----------|-----|-----------|-------|
| Attempt 1 | [#40878599026](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/40878599026) | ❌ failure (3s) | runner_id=0 — runner não alocado |
| Attempt 2 | idem | ❌ failure (3s) | runner_id=0 — runner não alocado |

**O runner nunca foi alocado.** Nenhum step executou. Causa: quota de minutos do GitHub Actions esgotada na conta `adm01-debug`. Ver [PENDENCIAS.md](./PENDENCIAS.md).

---

## 7. Workflows que estavam verdes — continuam verdes

| Workflow | Status antes | Status após |
|----------|-------------|-------------|
| Dependabot Updates | ✅ success | ✅ não alterado |
| Copilot | sem execuções | sem execuções |

---

## 8. Gaps e Melhorias (baixo risco)

1. **`vitest.config.ts`:** Adicionar `pool: 'vmThreads'` para reutilizar o jsdom e reduzir tempo de testes em ~30% (recomendado pelo próprio vitest no output).
2. **`typescript-eslint`:** Quando lançar versão 9.x estável com suporte a TS 7.x, fazer upgrade coordenado de ambos.
3. **Dependabot:** Configurar `ignore` para `typescript` com versões major no `.github/dependabot.yml` para evitar recorrência.
