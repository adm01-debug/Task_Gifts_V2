# Dimensão 4 — Dados e Runtime (banco vivo)

> **Status de verificação:** `VERIFICADO`. Todas as medições desta página vêm de consulta direta
> ao banco de produção via MCP, em modo somente leitura, em 2026-08-16.
> Nenhum DDL, DML ou migration foi executado. Evidência = nome de objeto de banco + valor medido.

**Projeto auditado:** `eidsaqymojyuhprobfpn` (o mesmo para onde o app aponta em `.env` → `VITE_SUPABASE_URL`).

---

## 1. Veredito da dimensão

O banco está **estruturalmente bem construído e operacionalmente vazio**. A modelagem é séria — 233
tabelas, 536 políticas RLS, 265 funções, 130 triggers, nenhuma tabela desprotegida. Mas 70% dele
nunca recebeu uma escrita, o sistema nunca teve um usuário final real, e existem objetos rodando em
produção que não existem no repositório.

---

## 2. Inventário do banco vivo

| Objeto | Quantidade medida |
|---|---|
| Tabelas (`public`) | 233 |
| Views | 5 |
| Materialized views | 1 (`leaderboard_cache`) |
| Funções / RPC | 265 (250 `SECURITY DEFINER`) |
| Triggers (não internos) | 130 |
| Políticas RLS | 536 |
| Índices | 658 |
| Extensões | `pg_cron`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `unaccent`, `uuid-ossp` |
| Buckets de storage | 1 (`course-uploads`, privado) |
| Objetos em storage | **0** |

Views vivas: `connection_monitor`, `index_health_report`, `profiles_public`,
`query_performance_summary`, `webhook_delivery_stats_24h`.

---

## 3. A prova mais barata: tabelas vazias

| Medição | Valor | % |
|---|---|---|
| Tabelas com pelo menos 1 linha | 69 | 29,6% |
| **Tabelas com 0 linhas** | **164** | **70,4%** |
| **Tabelas que nunca receberam escrita** (`n_tup_ins+upd+del = 0`) | **164** | **70,4%** |
| Índices nunca usados (`idx_scan = 0`) | 537 de 658 | 81,6% |

A maior tabela do sistema inteiro é `quiz_options`, com **48 linhas**. Nenhuma tabela passa de 48.
Todo o volume de dados do sistema cabe em uma planilha.

<details>
<summary>As 69 tabelas com dado (todas ≤ 48 linhas)</summary>

`quiz_options` 48 · `lightning_quiz_questions` 24 · `bingo_board_tasks` 24 ·
`engagement_question_assignments` 24 · `sequence_steps` 20 · `memory_pairs` 16 · `board_tiles` 15 ·
`achievements` 15 · `user_cards` 14 · `department_war_contributions` 14 · `user_achievements` 13 ·
`quiz_questions` 12 · `shop_rewards` 12 · `trail_modules` 12 · `card_definitions` 12 ·
`lucky_wheel_prize_audit` 11 · `lucky_wheel_prizes` 11 · `pulse_responses` 10 · `key_results` 10 ·
`auction_bids` 9 · `feedback_requests` 8 · `scratch_cards` 8 · `sla_targets` 8 ·
`scratch_card_prizes` 7 · `leagues` 6 · `profiles` 6 · `push_outbox` 6 · `card_packs` 6 ·
`engagement_question_pool` 6 · `quiz_answers` 5 · `announcements` 5 · `sales_campaigns` 5 ·
`departments` 4 · `tournament_participants` 4 · `department_war_metrics` 4 ·
`department_war_departments` 4 · `user_combos` 3 · `board_moves` 3 · `user_challenges` 3 ·
`sequence_procedures` 3 · `auctions` 3 · `learning_trails` 3 · `goals` 3 · `weekly_challenges` 3 ·
`tournament_matches` 3 · `notifications` 2 · `tournaments` 2 · `user_leagues` 2 ·
`lucky_wheel_spins` 2 · `pulse_surveys` 2 · `league_history` 2 · `memory_decks` 2 ·
`onboarding_progress` 2 · `engagement_cycles` 1 · `quiz_scores` 1 · `login_attempts` 1 ·
`user_roles` 1 · `geo_settings` 1 · `department_wars` 1 · `feedback_cycles` 1 · `bingo_boards` 1 ·
`bingo_cards` 1 · `board_trails` 1 · `direct_duels` 1 · `board_player_states` 1 ·
`lightning_quiz_sessions` 1 · `memory_sessions` 1 · `wager_budget_settings` 1 ·
`lucky_wheel_settings` 1

</details>

---

## 4. Uso real: o sistema nunca foi usado

`auth.users` contém **6 contas**:

| E-mail | Criada em | Último login |
|---|---|---|
| `adm01@promobrindes.com.br` | 2026-05-23 | 2026-05-23 |
| `ti@promobrindes.com.br` | 2026-08-06 | 2026-08-06 |
| `jogador1@torneio.local` | 2026-08-07 | **nunca** |
| `jogador2@torneio.local` | 2026-08-07 | **nunca** |
| `jogador3@torneio.local` | 2026-08-07 | **nunca** |
| `jogador4@torneio.local` | 2026-08-07 | **nunca** |

Quatro contas são sintéticas e nunca autenticaram. Duas são administrativas, e a mais recente
autenticou pela última vez em 2026-08-06 — 10 dias antes desta auditoria.

**Consequência para toda a auditoria:** as linhas que existem nas 69 tabelas foram inseridas por
seed, migration ou operação manual de administrador — não por uso. Pela regra de ouro
(*pronto = em produção com uso real*), **nenhuma funcionalidade de negócio deste sistema pode ser
classificada ✅ com honestidade**. O teto real é 🟨.

### Papéis

`public.user_roles` tem **1 linha**: `69cd2b25-…` (`ti@promobrindes.com.br`) → `admin`.

A conta `adm01@promobrindes.com.br` **não possui nenhuma linha em `user_roles`**. Como o controle de
acesso do sistema é feito por `has_role()`, essa conta provavelmente não enxerga a área
administrativa. Não verificado em runtime (exigiria autenticar).

---

## 5. Jobs agendados (`pg_cron`) — o que roda de verdade

11 jobs ativos no banco. Histórico real de execução em `cron.job_run_details`:

| Job | Agenda | Sucessos | Falhas | Última execução |
|---|---|---|---|---|
| `refresh-leaderboard-cache` | `*/5 * * * *` | 4.360 | 0 | 2026-08-16 16:45 |
| `cleanup-expired-challenges` | `0 * * * *` | 364 | 0 | 2026-08-16 16:00 |
| `cleanup-idempotency-keys` | `0 */2 * * *` | 182 | 0 | 2026-08-16 16:00 |
| `cleanup-webhook-logs` | `0 4 * * *` | 15 | 0 | 2026-08-16 04:00 |
| `cleanup-query-telemetry` | `0 1 * * *` | 15 | 0 | 2026-08-16 01:00 |
| `check-overdue-postmortems` | `0 9 * * *` | 15 | 0 | 2026-08-16 09:00 |
| `update-certification-statuses` | `0 6 * * *` | 15 | 0 | 2026-08-16 06:00 |
| `cleanup-old-security-logs` | `0 3 * * *` | 11 | **4** | 2026-08-16 03:00 |
| `weekly-analyze` | `0 2 * * 0` | 3 | 0 | 2026-08-16 02:00 |
| **`close-expired-campaigns`** | `30 * * * *` | **0** | **364** | 2026-08-16 16:30 |
| **`update-profile-name-daily`** | `0 9 * * *` | 9 | 0 | 2026-08-16 09:00 |

### 🔴 `close-expired-campaigns` — 364 falhas, zero sucessos

Falha a cada 30 minutos desde que existe, sempre com o mesmo erro:

```
ERROR:  column "goal_amount" does not exist
QUERY:  SELECT id, name, goal_amount FROM public.sales_campaigns
        WHERE status = 'active' AND end_date < now() FOR UPDATE SKIP LOCKED
CONTEXT: PL/pgSQL function close_expired_sales_campaigns() line 6 at FOR over SELECT rows
```

A coluna não existe. `sales_campaigns` tem 22 colunas e a equivalente chama-se `target_global`.
Nenhuma campanha de vendas jamais foi encerrada automaticamente. É o exemplo perfeito de falha
sem erro visível: nada quebra na tela, ninguém abre chamado.

### 🔴 `update-profile-name-daily` — job fantasma escrevendo dado fictício

```sql
UPDATE public.profiles
SET display_name = 'Abner Pereira ' ||
    (COALESCE(NULLIF(regexp_replace(display_name,'^Abner Pereira\s*','','i'),''),'0')::integer + 1)::text
WHERE id = '69cd2b25-189d-47f8-99eb-33cb5bda9267'
```

- Roda diariamente às 09:00, **9 execuções bem-sucedidas**.
- O alvo `69cd2b25-…` é a conta **`ti@promobrindes.com.br`** — a conta do dono do sistema, e a única
  com papel `admin`.
- Valor atual de `profiles.display_name` para essa conta: **`"Abner Pereira 9"`**.
- `grep -rin "Abner\|update.profile.name"` em todo o repositório retorna **zero ocorrências**.

O job não existe em nenhuma migration, em nenhum arquivo, em lugar nenhum do código versionado. Foi
criado diretamente no banco. Um reprovisionamento a partir do repositório não o recriaria — e
tampouco revelaria que ele existe.

---

## 6. Reconstrutibilidade: o ambiente NÃO nasce do repositório

| Verificação | Resultado |
|---|---|
| Existe `supabase_migrations.schema_migrations`? | **Não.** `relation does not exist` |
| Migrations versionadas no repo | 262 |
| Migrations rastreadas como aplicadas no banco | **0 — não há registro algum** |
| Jobs cron declarados no repo | 22 |
| Jobs cron vivos no banco | 11 |
| Jobs vivos **ausentes** do repo | 1 (`update-profile-name-daily`) |
| Jobs declarados no repo que **não** estão vivos | 12 |

Não existe forma de provar que o banco vivo corresponde às migrations. Os números divergem em todas
as dimensões: o repo declara 228 tabelas, o banco tem 233; o repo declara 244 funções, o banco tem
265; o repo declara 579 políticas, o banco tem 536.

### Objetos que o repositório/documentação assume e que não existem no banco

| Objeto esperado | Onde é assumido | No banco |
|---|---|---|
| `email_outbox` | `.claude/prompts/deploy-edge-functions.md` (functions de e-mail) | **não existe** |
| `push_devices` | idem (functions de push) | **não existe** |
| `webhook_deliveries` | idem (webhook-dispatcher) | **não existe** |
| `public.security_logs` | `migrations/20260520162624_…sql:10` faz `DELETE FROM` | **não existe** |

### Divergência de projeto

`supabase/config.toml:1` declara `project_id = "awzhgfmqwddzgbqzqusc"`, mas o app aponta para
`eidsaqymojyuhprobfpn` (`.env`) e o MCP também. O `config.toml` versionado aponta para um projeto
diferente do que está em uso.

---

## 7. Segurança do banco — aqui o quadro é bom

Não há motivo para alarme nesta dimensão, e seria desonesto fabricar um:

| Verificação | Resultado |
|---|---|
| Tabelas com RLS habilitado | **233 de 233 (100%)** |
| Tabelas com RLS ligado e **sem nenhuma policy** (bloqueio acidental total) | **0** |
| Políticas abertas (`USING true`) para `anon`/`public` em **escrita** | **0** |
| Políticas abertas para `anon`/`public` em **leitura** | 31 |
| Funções `SECURITY DEFINER` sem `search_path` fixado | **1 de 250** (`audit_lucky_wheel_prize`) |

As 31 leituras públicas incidem quase todas sobre tabelas de catálogo/referência (`achievements`,
`departments`, `leagues`, `positions`, `competencies`, `level_configs`…), o que é legítimo. Dois
subconjuntos merecem revisão, sem urgência:

- **Configuração de segurança legível por anônimo:** `geo_settings`, `geo_blocking_rules`,
  `geo_allowed_countries` — expõem as próprias regras de bloqueio.
- **Modelo de permissões legível por anônimo:** `roles`, `permissions`, `role_permissions`,
  `permission_groups` — revela a estrutura de RBAC.

`audit_lucky_wheel_prize` é o único `SECURITY DEFINER` sem `search_path` fixado — endurecimento
barato e recomendado, mas não é uma brecha explorável por si só.

---

## 8. Dado fictício confirmado em produção

| Origem | Evidência | Efeito |
|---|---|---|
| Job cron fantasma | `cron.job` jobid 12 | `profiles.display_name` = `"Abner Pereira 9"` na conta do dono |
| Seed de benchmark | `migrations/20251225223108_0cefeb56-…sql:490-503`, marcado no próprio SQL como *"dados fictícios para exemplo"*, `sample_size = 1500` | Alimenta comparativo de clima organizacional exibido como benchmark de mercado |
| Contas sintéticas | `auth.users` (`jogador1..4@torneio.local`) | Aparecem em rankings, contribuições de guerra de departamentos e lances de leilão |

---

## 9. Correções a achados de subagente (Fase D)

O prompt exige que achado errado ou exagerado seja corrigido no próprio documento, sem apagar o
original. Dois achados classificados como "graves" por um subagente foram reproduzidos por mim e
**estavam superdimensionados**:

> **Achado original (subagente de migrations), G2:** *"Escalação de privilégio hardcoded —
> `migrations/20260306012145_…sql:1-2` concede `admin` e `manager` ao UUID literal
> `2ad6e986-5a6c-4173-8d39-40de4287bba7`."*

**Correção.** O código da migration é exatamente esse — confirmado. Mas a verificação no banco vivo
mostra que o UUID `2ad6e986-…` **não existe em `auth.users`** e **não tem nenhuma linha em
`user_roles`**. A concessão é **inerte hoje**. Continua sendo prática ruim (concessão de papel
administrativo a UUID literal, sem comentário, versionada), mas **não é uma brecha ativa**.
Severidade real: baixa. Reclassificado de "grave" para "dívida de higiene".

> **Achado original (subagente de migrations), G3:** *"Senha admin em texto claro versionada —
> `20260306011941_…sql:18` cria `qa-test@taskgifts.com` com `crypt('QaTest2026!', …)` e role admin."*

**Correção.** O literal está no arquivo — confirmado. Mas `qa-test@taskgifts.com` **não existe em
`auth.users`**: a conta foi removida. O risco residual não é "existe um admin de QA em produção"
(não existe), e sim "a string `QaTest2026!` está no histórico do git para sempre". Severidade real:
média **se e somente se** essa senha for reutilizada em outro sistema. Reclassificado de "grave" para
"rotação de credencial recomendada".

O achado G1 (job cron fantasma `update-profile-name-daily`), ao contrário, foi **confirmado
integralmente** e é o mais grave desta dimensão.

---

## 10. O que esta dimensão NÃO cobriu

- Revisão semântica das 536 políticas RLS uma a uma (verifiquei apenas propriedades estruturais:
  cobertura, aberturas de escrita, tabelas sem policy).
- Corretude interna das 265 funções — apenas as que falharam em execução real foram analisadas.
- Backups, PITR, réplicas, e configuração de rede/Vault do projeto Supabase.
- Comportamento sob carga: com 6 usuários e nenhuma tabela acima de 48 linhas, não há dado de
  performance real a medir. `537 índices nunca usados` reflete ausência de uso, não má modelagem.
</content>
