# PENDÊNCIAS

## ~~P-001 — CI falha por quota esgotada do GitHub Actions~~ ✅ RESOLVIDO

**Resolvido em:** 2026-10-29  
**Resolução:** Repositório convertido para público — Actions em repos públicos são gratuitos. PR #17 mergeado com CI verde (run #377).

---

## ~~P-002 — PR #18 do Dependabot fechado: majors incompatíveis~~ ✅ RESOLVIDO

**Resolvido em:** 2026-10-29  
**Resolução:** `.github/dependabot.yml` atualizado (PR #19) para ignorar majors problemáticos e limitar o grupo a minor/patch. O Dependabot recriou PRs seguros (#20–#26), todos revisados, com CI verde e mergeados.

---

## Estado atual

**Nenhuma pendência ativa.** Todos os workflows estão verdes e todos os PRs do Dependabot foram mergeados.

| Item | Status |
|------|--------|
| `action_required` runs | 0 |
| CI na main (run #408) | ✅ success |
| PRs abertos | 0 |
| Test Files | 137 passed \| 2 skipped |

---

## Melhorias documentadas (sem urgência)

Ver seção 8.2 do `RELATORIO_CI.md`:

1. `vitest.config.ts` — `pool: 'vmThreads'` para testes mais rápidos
2. `typescript-eslint@9` — upgrade quando suportar TS 7.x
3. `bun` no Dependabot — ecosystem nativo quando disponível
