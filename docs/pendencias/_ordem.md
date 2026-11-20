# Ordem das pendencias (por impacto no negocio / custo / retrabalho)

1. **01-mcp-json-com-segredo** — vazamento de acesso admin ao banco. Maior risco (dado + RLS bypass). Preciso de decisao de infra + rotacao do token.
2. **02-profiles-update-sem-restricao-de-coluna** — economia manipulavel (xp/coins/level). Exige migration + mover escritas p/ RPC (evitar regressao da loja/ranks).
3. **03-csp-hibp-pwnedpasswords** — CONCLUIDO via PR #71 (aguarda merge, infra).
4. **04-navegacao** — CONCLUIDO via PR #72 (aguarda merge, escopo comum).
5. **05-lockfiles-triplos** — DESCARTADO (nao bloqueia; bun e o lock efetivo, CI green).

Racional: seguranca/dados (1,2) antes de conveniencia (5). Os itens 3 e 4 ja tem PR pronta.
