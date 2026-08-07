# Tarefa: Validar e preparar banco para suportar todas as Edge Functions

## Contexto

Sou dev front-end do projeto **task-gifts-v2** (React + Vite + Supabase, project-ref `eidsaqymo`).

Você (Claude Web) já fez a **migração inicial do banco**. Agora preciso que você **valide e prepare o banco** para que todas as 36 Edge Functions do projeto consigam rodar sem erro 404/500 quando forem deployadas.

**Importante**: você **NÃO** tem acesso a deployar Edge Functions nem a CLI `supabase functions deploy`. Isso é trabalho meu (front). Seu trabalho é garantir que o **banco está pronto** para receber as funções.

## Funções envolvidas e suas dependências de schema

Liste as tabelas/views/RPCs que cada função precisa. Quero saber **o status de cada dependência** no banco.

### Edge Functions críticas (consultadas pelo front em produção)

**`verify-ip`** (`supabase/functions/verify-ip/index.ts`)
- Lê: `ip_whitelist` (cols: `id`, `ip_address`, `is_active`, `expires_at`, `description`)
- Escreve: `ip_access_logs` (cols: `ip_address`, `endpoint`, `was_allowed`, `reason`, `user_agent`, `created_at`)
- Env vars usadas: nenhuma direta (só `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)

**`verify-geo`** (`supabase/functions/verify-geo/index.ts`)
- Lê: `geo_settings` (cols: `is_enabled`, `block_unknown_countries`, `log_all_access`)
- Lê: `geo_allowed_countries` (cols: `country_code`, `is_active`)
- Escreve: `geo_access_logs` (cols: `ip_address`, `country_code`, `country_name`, `was_allowed`, `reason`, `user_agent`)
- Chama: API externa `ip-api.com` (HTTP)

**`external-db-bridge`** (telemetria — usada por AdminTelemetria)
- Lê: tabela de telemetria
- Escreve: batch de telemetria

**`webhook-dispatcher` + `webhook-health-monitor`**
- Lê/escreve: `webhook_subscriptions`, `webhook_deliveries`

**`push-outbox-dispatcher` + `push-public-key` + `push-device-revoked`**
- Lê/escreve: `push_outbox`, `push_devices`

**`send-email-notifications` + `send-email-digest` + `send-campaign-push`**
- Lê: `email_outbox`
- Env vars: `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

**`ai-coach` + `ai-course-builder`**
- Env vars: `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`

**`bitrix24-webhook` + `bitrix24-oauth` + `bitrix24-api`**
- Env vars: `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `BITRIX24_WEBHOOK_URL`

**`admin-alerts`**
- Lê/escreve: `admin_alerts`

**`security-weekly-digest` + `send-rate-limit-alert` + `dispatch-critical-alert`**
- Lê: `audit_logs`, `rate_limit_logs`, `security_events`

**Demais**: `survey-reminders`, `checkin-reminders`, `birthday-celebrations`, `reward-approval-review`, `trail-recommendations`, `generate-quiz-questions`, `weekly-league-processing`, `competency-alerts`, `churn-prediction`, `burn-rate-monitor`, `error-budget-monitor`, `cleanup-old-security-logs`, `cleanup-rate-limit-logs`, `detect-new-device`

## O que você precisa fazer (via MCP do Supabase)

### 1. Inventário completo do banco atual

Liste TODAS as tabelas existentes. Para cada tabela, mostre:
- Nome
- Row count atual
- RLS habilitado? (`rowsecurity`)
- Policies existentes

```sql
select schemaname, tablename,
       (select n_live_tup from pg_stat_user_tables where relname = tablename) as rows,
       rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;
```

### 2. Verificar dependências das Edge Functions

Para cada tabela citada acima, faça:
```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = '<nome>'
order by ordinal_position;
```

**Resultado esperado**: confirme quais tabelas **existem** vs. **faltam** vs. **existem mas faltam colunas**.

### 3. Verificar RPCs esperadas

O código chama várias funções RPC. Confirme se existem:

```sql
select routine_name, data_type
from information_schema.routines
where routine_schema = 'public'
order by routine_name;
```

Exemplos críticos (referenciados em `src/services/`):
- `get_executive_metrics`
- `get_department_metrics`
- `get_monthly_trends`
- `get_security_stats`
- `get_quiz_category_stats`
- `get_leaderboard_api`
- `get_user_stats_api`
- `get_2fa_status`
- `validate_reset_token`

Para cada RPC listada pelos serviços do front, verifique:
- Se existe
- Se a assinatura (args) bate com o que o front chama

### 4. Garantir extensões habilitadas

```sql
select * from pg_extension
where extname in ('pgcrypto', 'uuid-ossp', 'pg_stat_statements', 'pg_cron', 'pg_net');
```

Se faltarem `pg_cron` (para jobs de cleanup) ou `pg_net` (para chamadas HTTP das Edge Functions), habilite-as.

### 5. Criar tabelas e migrations faltantes

Para cada dependência listada no passo 2 que **não existe** ou está **incompleta**, gere o SQL da migration (CREATE TABLE + RLS policies + índices) e aplique via MCP.

Critério de RLS: **todas as tabelas devem ter RLS habilitado** (padrão do projeto). Policies mínimas:
- `SELECT` para usuários autenticados nas colunas próprias
- `INSERT/UPDATE/DELETE` apenas para `service_role` ou policies específicas

### 6. Seed mínimo (apenas onde faz sentido)

Para tabelas de configuração (ex.: `geo_settings`, `ip_whitelist`), insira um registro padrão que libera acesso (fail-open). Exemplo:

```sql
insert into geo_settings (is_enabled, block_unknown_countries, log_all_access)
values (false, false, false)
on conflict do nothing;
```

### 7. Criar/confirmar buckets de Storage

Verifique se os buckets necessários existem:

```sql
select id, name, public from storage.buckets;
```

Se faltarem buckets como `avatars`, `certificates`, `campaign-images`, crie via MCP.

## Entregáveis

Me devolva um relatório com:

### A) Inventário
- Total de tabelas existentes (X)
- Total de RPCs existentes (Y)
- Tabelas com RLS habilitada vs. sem RLS

### B) Gaps encontrados
- Tabelas que **faltam** (lista com nome + SQL da migration criada)
- Tabelas que existem mas **faltam colunas** (lista)
- RPCs que **faltam** (lista com nome + assinatura esperada + SQL da função)
- Extensões que precisaram ser habilitadas
- Buckets de storage que precisaram ser criados

### C) Seeds aplicados
- Lista de registros padrão inseridos (geo_settings, ip_whitelist, etc.)

### D) Pendências para mim (dev front)
- Secrets que eu preciso configurar no painel do Supabase (lista de nomes, sem valores):
  - [ ] `RESEND_API_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `BITRIX24_CLIENT_ID` / `BITRIX24_CLIENT_SECRET`
  - [ ] `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
  - [ ] `SENTRY_DSN` (se aplicável)
  - [ ] outros

### E) Comando final que eu vou rodar

A linha de comando que eu vou usar para deployar todas as Edge Functions de uma vez:

```bash
for fn in $(ls supabase/functions/); do
  [ "$fn" = "_shared" ] && continue
  supabase functions deploy "$fn" --project-ref eidsaqymo --no-verify-jwt
done
```

Me avise se algo nessa lista precisa ser deployado com flags diferentes (ex.: `--no-verify-jwt` deve ser usado para todas? alguma precisa de verify-jwt?).

## Restrições

- **NÃO** altere código fonte do projeto (front)
- **NÃO** tente fazer deploy de Edge Functions (você não tem CLI)
- **PODE** criar/alterar tabelas, RPCs, policies, extensões e seeds via MCP
- Use **transações** para qualquer alteração destrutiva
- Sempre me avise **antes** de dropar/recriar qualquer tabela existente