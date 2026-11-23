# Ordem das pendencias (por impacto no negocio / custo / retrabalho)

1. **01-mcp-json-com-segredo** — vazamento de acesso admin ao banco. Maior risco (dado + RLS bypass). Preciso de decisao de infra + rotacao do token.
2. **02-profiles-update-sem-restricao-de-coluna** — CONCLUIDO e verificado em producao (PR #78 aplicada; `authenticated` so edita 4 colunas seguras). Risco residual: as RPCs de economia aceitam `p_amount` arbitrario do proprio usuario (falta calculo server-side) — proximo passo de arquitetura.
3. **03-csp-hibp-pwnedpasswords** — CONCLUIDO (PR #71 mergeada em 2026-11-20).
4. **04-navegacao** — CONCLUIDO (PR #72 mergeada em 2026-11-20).
5. **05-lockfiles-triplos** — DESCARTADO (nao bloqueia; bun e o lock efetivo, CI green).

Racional: seguranca/dados (1,2) antes de conveniencia (5). Os itens 3 e 4 ja tem PR pronta.
