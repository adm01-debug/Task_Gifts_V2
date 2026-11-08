# ci — guardas do repositório

Scripts que o job `quality` do `.github/workflows/ci.yml` roda. Nenhum acessa banco, rede ou
credencial; todos usam fixtures em `tmpdir`. Detalhe dos passos em `docs/agentes/github-ci.md`.

| Arquivo | O que guarda | Como rodar |
|---|---|---|
| `check-claude-md-integrity.mjs` | GA02: exige os 8 cabeçalhos do `AGENTS.md` e barra o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30% (sessão paralela apagando instrução) | `CLAUDE_MD_BASE=origin/main node scripts/ci/check-claude-md-integrity.mjs` |
| `commit-msg-lint.mjs` | Conventional commit em PT-BR; tipos aceitos: `feat fix docs style refactor perf test build ci chore security revert` | hook `commit-msg` do husky, ou `node scripts/ci/commit-msg-lint.mjs <arquivo>` |
| `contexto-indice.unit.mjs` | `scripts/regras_negocio/indice.py`: frescor por fonte (`ok`/`parcial`/`desatualizado`/ausente) e anti-churn do `00-INDEX.md` | `node --test scripts/ci/contexto-indice.unit.mjs` |
| `contexto-publicacao.unit.mjs` | Executa o **publisher real** do `contexto.yml` contra um Git local: primeira publicação, fonte ausente, gate de métricas, push sem mudança. Mexer no job `publicar` sem atualizar este teste reprova o CI | `node --test scripts/ci/contexto-publicacao.unit.mjs` |
| `regras-negocio.unit.mjs` | `scripts/regras_negocio/`: roda a suíte Python e cobre `publish.sh` (publicador genérico do pacote, **não usado neste repo**) | `node --test scripts/ci/regras-negocio.unit.mjs` |
| `supabase-snapshot.unit.mjs` | Roda `scripts/supabase_snapshot/test_snapshot.py` (109 casos, conexão simulada) | `node --test scripts/ci/supabase-snapshot.unit.mjs` |
| `check-migration-drift.unit.mjs` | `scripts/db-audit/check-migration-drift.mjs`: 41 casos, 14 de regressão da auditoria adversarial | `bun run db:guard:test` |

Atalhos: `bun run contexto:test` (as 5 suítes do pacote de contexto) e `bun run db:guard:test`.

## Regras ao alterar

- **`eslint.config.js` ignora `scripts/**`**: estes arquivos não passam por `bun run lint`. A garantia
  de qualidade aqui são os próprios `node --test`.
- Guarda que precisa de rede, banco ou secret **não entra aqui** — o job `quality` roda em PR de fork,
  onde secret não existe.
- Suíte nova precisa ser adicionada **explicitamente** ao passo do `ci.yml`: ele lista os arquivos, não
  usa glob. Arquivo `*.unit.mjs` que ninguém lista é código morto.
