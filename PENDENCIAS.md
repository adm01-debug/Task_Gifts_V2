# PENDÊNCIAS

## ~~P-001 — CI do PR #16 falha por quota esgotada do GitHub Actions~~ ✅ RESOLVIDO

**Data:** 2026-10-29 | **Resolvido em:** 2026-10-29  
**Causa:** Repositório era privado; minutos do GitHub Actions esgotados.  
**Resolução:** Repositório convertido para público — Actions em repos públicos são gratuitos e ilimitados. PR #16 foi substituído pelo PR #17, que foi mergeado com CI verde (run #377: success).

---

## P-002 — PR #18 do Dependabot fechado: contém atualizações major incompatíveis

**Data:** 2026-10-29  
**Workflow:** CI (`.github/workflows/ci.yml`)  
**PR:** [#18 — build(deps): Bump 60 updates](https://github.com/adm01-debug/Task_Gifts_V2/pull/18)  
**Run com falha:** [#378](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/40887067747) — `Install dependencies` falhou (bun.lock frozen)

### Pacotes major problemáticos no PR #18

| Pacote | De | Para | Motivo do bloqueio |
|--------|----|------|--------------------|
| `@hookform/resolvers` | 5.9.1 | **6.0.0** | Major com breaking changes de API |
| `@radix-ui/*` (vários) | 1.x/2.x | **1.x+1 / 2.x+1** | Mudanças de major — necessita validação manual |
| `bun.lock` | — | desatualizado | Dependabot não regenera o bun.lock (usa npm) |

### Ação tomada

- PR #18 **fechado** para evitar regressão.
- `.github/dependabot.yml` atualizado para ignorar majors de `typescript`, `tailwindcss` e `@hookform/resolvers` e limitar o grupo a atualizações minor/patch.
- O Dependabot recriará o PR com apenas atualizações seguras.

### O que o owner precisa fazer quando o próximo PR do Dependabot chegar

1. Verificar se o CI passa (install, lint, typecheck, tests, E2E).
2. Se passar: fazer squash merge normalmente.
3. Se falhar por `bun.lock frozen`: sinal de que o bun.lock não foi regenerado — abrir issue para configurar o Dependabot com `bun` como package manager.
