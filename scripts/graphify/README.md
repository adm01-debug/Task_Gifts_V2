# scripts/graphify — grafo de código

Gera o grafo de dependências/chamadas do repo em `graphify-out/`, para que os agentes consultem
estrutura antes de buscar por texto.

## Como rodar

```bash
bun run graph:setup        # ou: bash scripts/graphify/setup.sh
```

Precisa de `uv` ou `pipx` (cai para `pip install --user`). Versão fixada em `setup.sh`
(`GRAPHIFY_VERSION`, hoje `0.9.68`); sobrescreva com `GRAPHIFY_VERSION=x.y.z bash scripts/graphify/setup.sh`.
`.claude/hooks/session-start.sh` lê essa mesma linha para instalar a **mesma** versão nas sessões de
nuvem — mudou aqui, muda lá sem editar nada.

## Saída

`graphify-out/` (no `.gitignore`, cada clone gera o seu):

- `graph.json` — grafo completo (~14 MB neste repo);
- `graph.html` — visão agregada por comunidade;
- `GRAPH_REPORT.md` — relatório; a linha "Built from commit" diz de qual commit o grafo é.

Medido em 2026-11-08: 1.416 arquivos → 8.998 nós, 25.584 arestas, 586 comunidades, ~2,5 min,
**0 token de API** (extração só por AST). `src/integrations/supabase/types.ts` sai parcialmente
extraído (erro de sintaxe na linha 6490 por tamanho) — esperado.

## Como consultar

```bash
graphify query "onde o resgate de recompensa é aprovado"
graphify path "src/pages/Shop.tsx" "supabase/functions/reward-approval-review/index.ts"
graphify explain "edgeAvailability"
graphify update .          # depois de alterar código (só AST, sem custo de API)
```

## Secrets

Nenhum. Sem `GEMINI_API_KEY`/`GOOGLE_API_KEY` o graphify roda só com extração AST — é o modo usado
aqui de propósito (custo zero e nada do código sai da máquina). `.graphifyignore` já exclui `.env*`,
chaves, `dist/`, `coverage/` e os relatórios de auditoria da raiz.
