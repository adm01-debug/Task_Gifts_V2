# CONTEXTO PARA AGENTES DE IA — ÍNDICE ÚNICO

> Gerado automaticamente por indice.py · 2026-11-28 14:00 UTC · HEAD `6ff726dced` · Não edite à mão.

Um sistema, três fontes de verdade, três produtores independentes. **Leia este arquivo e vá direto à fonte certa.** Cada fato tem um dono: se duas fontes discordarem, vale o dono.

## Onde está cada coisa

| Preciso de… | Fonte (dona do fato) | Onde ler | Estado |
|---|---|---|---|
| Regras que não podem ser quebradas: RLS por operação, estados e transições, validações, fórmulas, prazos, erros de negócio, testes como especificação, inconsistências código×schema (NÃO VERIFICADO) e regras humanas (`manual/`) | **regras de negócio** | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | ok · 1 min atrás |
| Tabelas, colunas, RLS/políticas, funções, triggers, cron, storage, lints — **como está em produção agora** | **banco real** | `docs/contexto/supabase/README.md` | ok · 0 min atrás |
| Rotas, telas, módulos, hooks, edge functions, grafo de dependências, testes, scripts, convenções | **código** | `docs/contexto/codigo/INDEX.md` | ok · 0 min atrás |

## Ordem de leitura antes de qualquer tarefa ou planejamento

1. **regras de negócio** — Qualquer mudança de comportamento · Antes de criar status/valor/validação · Antes de planejar.
2. **banco real** — Vou tocar tabela/coluna/política/função SQL · Quero saber se algo existe de verdade no banco.
3. **código** — Vou mexer em tela/rota/hook/edge · Preciso saber onde uma coisa vive e quem a usa.

## Regras do protocolo

- Tabela/coluna/política existe? → **banco real**. Migrations do repo são histórico, não estado.
- Onde fica, quem chama, o que importa o quê? → **código**.
- Pode fazer isso? Qual estado vem depois? Qual o limite? → **regras de negócio** (inclui `manual/`, escrito por humanos, prioridade máxima).
- Item listado como **NÃO VERIFICADO** ou **inconsistência** em qualquer fonte: confirme na fonte dona antes de assumir.
- Nada aqui é editado à mão. Para registrar uma regra que só o negócio sabe, escreva em `manual/` da fonte de regras.

<details><summary>Arquivos de <b>banco real</b> (`docs/contexto/supabase/`)</summary>

- `docs/contexto/supabase/CHANGELOG.md`
- `docs/contexto/supabase/README.md`
- `docs/contexto/supabase/auth.md`
- `docs/contexto/supabase/cron-runs.md`
- `docs/contexto/supabase/cron.md`
- `docs/contexto/supabase/edge-functions.md`
- `docs/contexto/supabase/edge-functions/admin-alerts/README.md`
- `docs/contexto/supabase/edge-functions/ai-coach/README.md`
- `docs/contexto/supabase/edge-functions/ai-course-builder/README.md`
- `docs/contexto/supabase/edge-functions/burn-rate-monitor/README.md`
- `docs/contexto/supabase/edge-functions/churn-prediction/README.md`
- `docs/contexto/supabase/edge-functions/competency-alerts/README.md`
- `docs/contexto/supabase/edge-functions/detect-new-device/README.md`
- `docs/contexto/supabase/edge-functions/dispatch-critical-alert/README.md`
- `docs/contexto/supabase/edge-functions/error-budget-monitor/README.md`
- `docs/contexto/supabase/edge-functions/generate-quiz-questions/README.md`
- `docs/contexto/supabase/edge-functions/migrate-helper/README.md`
- `docs/contexto/supabase/edge-functions/passkey-auth/README.md`
- `docs/contexto/supabase/edge-functions/push-device-revoked/README.md`
- `docs/contexto/supabase/edge-functions/push-outbox-dispatcher/README.md`
- `docs/contexto/supabase/edge-functions/push-public-key/README.md`
- `docs/contexto/supabase/edge-functions/reward-approval-review/README.md`
- `docs/contexto/supabase/edge-functions/security-weekly-digest/README.md`
- `docs/contexto/supabase/edge-functions/send-campaign-push/README.md`
- `docs/contexto/supabase/edge-functions/trail-recommendations/README.md`
- `docs/contexto/supabase/edge-functions/verify-ip/README.md`
- `docs/contexto/supabase/edge-functions/webhook-dispatcher/README.md`
- `docs/contexto/supabase/edge-functions/webhook-health-monitor/README.md`
- `docs/contexto/supabase/edge-functions/webhook-ping/README.md`
- `docs/contexto/supabase/errors.md`
- `docs/contexto/supabase/extensions.md`
- `docs/contexto/supabase/foreign-servers.md`
- `docs/contexto/supabase/functions.md`
- `docs/contexto/supabase/grants.md`
- `docs/contexto/supabase/indexes.md`
- `docs/contexto/supabase/lints.md`
- `docs/contexto/supabase/manifest.json`
- `docs/contexto/supabase/migrations.md`
- `docs/contexto/supabase/policies.md`
- `docs/contexto/supabase/project-config.md`
- `docs/contexto/supabase/queues.md`
- `docs/contexto/supabase/realtime.md`
- `docs/contexto/supabase/relationships.md`
- `docs/contexto/supabase/roles.md`
- `docs/contexto/supabase/schemas.md`
- `docs/contexto/supabase/sequences.md`
- `docs/contexto/supabase/snapshot.json`
- `docs/contexto/supabase/stats.json`
- `docs/contexto/supabase/stats.md`
- `docs/contexto/supabase/storage.md`
- `docs/contexto/supabase/tables.md`
- `docs/contexto/supabase/tables/_supabase_internal_triggers.md`
- `docs/contexto/supabase/tables/internal/dispatch_config.md`
- `docs/contexto/supabase/tables/public/achievements.md`
- `docs/contexto/supabase/tables/public/action_plan_items.md`
- `docs/contexto/supabase/tables/public/action_plan_updates.md`
- `docs/contexto/supabase/tables/public/action_plans.md`
- `docs/contexto/supabase/tables/public/activity_comments.md`
- `docs/contexto/supabase/tables/public/activity_reactions.md`
- `docs/contexto/supabase/tables/public/ai_coach_messages.md`
- `docs/contexto/supabase/tables/public/ai_course_jobs.md`
- `docs/contexto/supabase/tables/public/announcement_reactions.md`
- `docs/contexto/supabase/tables/public/announcement_reads.md`
- `docs/contexto/supabase/tables/public/announcements.md`
- `docs/contexto/supabase/tables/public/api_request_logs.md`
- `docs/contexto/supabase/tables/public/attendance_records.md`
- `docs/contexto/supabase/tables/public/attendance_settings.md`
- `docs/contexto/supabase/tables/public/attendance_streaks.md`
- `docs/contexto/supabase/tables/public/auction_admin_events.md`
- `docs/contexto/supabase/tables/public/auction_bids.md`
- `docs/contexto/supabase/tables/public/auctions.md`
- `docs/contexto/supabase/tables/public/audit_logs.md`
- `docs/contexto/supabase/tables/public/avatar_items.md`
- `docs/contexto/supabase/tables/public/bingo_board_tasks.md`
- `docs/contexto/supabase/tables/public/bingo_boards.md`
- `docs/contexto/supabase/tables/public/bingo_cards.md`
- `docs/contexto/supabase/tables/public/bingo_marks.md`
- `docs/contexto/supabase/tables/public/bitrix24_sync_mappings.md`
- `docs/contexto/supabase/tables/public/bitrix24_tokens.md`
- `docs/contexto/supabase/tables/public/bitrix24_webhook_logs.md`
- … +215

</details>

<details><summary>Arquivos de <b>código</b> (`docs/contexto/codigo/`)</summary>

- `docs/contexto/codigo/GRAPH_REPORT.md`
- `docs/contexto/codigo/INDEX.md`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/manifest.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`

</details>

<details><summary>Arquivos de <b>regras de negócio</b> (`docs/contexto/regras/`)</summary>

- `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`
- `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`
- `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md`
- `docs/contexto/regras/context.json`
- `docs/contexto/regras/manifest.json`
- `docs/contexto/regras/manual/README.md`
- `docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md`

</details>
