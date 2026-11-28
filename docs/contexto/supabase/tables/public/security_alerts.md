# public.security_alerts

> Alertas de seguranca gerados automaticamente — inclui SLA tracking, MTTR e runbook execution.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `alert_type` | `text` | não |  |  |  |
| 3 | `severity` | `text` | não | `'medium'::text` |  | Nível: critical/high/medium/low — indexado para SLA tracking |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `ip_address` | `inet` | sim |  |  |  |
| 7 | `user_id` | `uuid` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `is_resolved` | `boolean` | não | `false` |  | Flag de resolução — índice parcial WHERE is_resolved=false |
| 10 | `resolved_by` | `uuid` | sim |  |  |  |
| 11 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `resolution_notes` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `acknowledged_at` | `timestamp with time zone` | sim |  |  | NULL = não reconhecido — índice parcial WHERE acknowledged_at IS NULL |
| 15 | `acknowledged_by` | `uuid` | sim |  |  |  |
| 16 | `acknowledgment_notes` | `text` | sim |  |  |  |
| 17 | `runbook_slug` | `text` | sim |  |  |  |
| 18 | `resolved` | `boolean` | sim | `is_resolved` | s |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| security_alerts_acknowledged_by_fkey | FOREIGN KEY | `FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| security_alerts_alert_type_check | CHECK | `CHECK ((alert_type = ANY (ARRAY['rate_limit_exceeded'::text, 'brute_force'::text, 'suspicious_login'::text, 'ip_blocked'::text, 'multiple_failed_2fa'::text, 'unusual_location'::text])) OR alert_type ~~ 'burn_rate_%'::text OR alert_type ~~ 'error_budget_%'::text OR alert_type ~~ 'sla_%'::text OR alert_type ~~ 'digest_%'::text OR alert_type ~~ 'lucky_wheel_%'::text OR alert_type ~~ 'prediction_%'::text OR alert_type = 'push_queue_degraded'::text)` |  |  | sim |
| security_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| security_alerts_resolved_by_fkey | FOREIGN KEY | `FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| security_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| security_alerts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.postmortems | postmortems_alert_id_fkey | {alert_id} | SET NULL |
| public.runbook_executions | runbook_executions_alert_id_fkey | {alert_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_security_alerts_ack | btree | {acknowledged_at} | não | sim | `(acknowledged_at IS NULL)` | `CREATE INDEX idx_security_alerts_ack ON public.security_alerts USING btree (acknowledged_at) WHERE (acknowledged_at IS NULL)` |
| idx_security_alerts_acknowledged_by | btree | {acknowledged_by} | não | sim |  | `CREATE INDEX idx_security_alerts_acknowledged_by ON public.security_alerts USING btree (acknowledged_by)` |
| idx_security_alerts_resolved_by | btree | {resolved_by} | não | sim |  | `CREATE INDEX idx_security_alerts_resolved_by ON public.security_alerts USING btree (resolved_by)` |
| idx_security_alerts_severity | btree | {severity} | não | sim |  | `CREATE INDEX idx_security_alerts_severity ON public.security_alerts USING btree (severity)` |
| idx_security_alerts_type | btree | {alert_type} | não | sim |  | `CREATE INDEX idx_security_alerts_type ON public.security_alerts USING btree (alert_type)` |
| idx_security_alerts_type_date | btree | {alert_type,created_at} | não | sim |  | `CREATE INDEX idx_security_alerts_type_date ON public.security_alerts USING btree (alert_type, created_at DESC)` |
| idx_security_alerts_unresolved | btree | {is_resolved} | não | sim | `(is_resolved = false)` | `CREATE INDEX idx_security_alerts_unresolved ON public.security_alerts USING btree (is_resolved) WHERE (is_resolved = false)` |
| idx_security_alerts_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_security_alerts_user_id ON public.security_alerts USING btree (user_id)` |
| security_alerts_lucky_wheel_dedupe_idx | btree | {alert_type} | sim | sim | `(alert_type ~~ 'lucky_wheel_%'::text)` | `CREATE UNIQUE INDEX security_alerts_lucky_wheel_dedupe_idx ON public.security_alerts USING btree (alert_type, ((metadata ->> 'ref_date'::text))) WHERE (alert_type ~~ 'lucky_wheel_%'::text)` |
| security_alerts_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX security_alerts_pkey ON public.security_alerts USING btree (id)` |
| security_alerts_prediction_dedupe_idx | btree | {alert_type} | sim | sim | `(alert_type ~~ 'prediction_%'::text)` | `CREATE UNIQUE INDEX security_alerts_prediction_dedupe_idx ON public.security_alerts USING btree (alert_type, ((metadata ->> 'dedupe_key'::text))) WHERE (alert_type ~~ 'prediction_%'::text)` |


## Policies (RLS)

### `Admins can manage security alerts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_auto_create_postmortem | AFTER | UPDATE | ROW | enabled | public.auto_create_postmortem_on_resolve |
| trg_security_alerts_dispatch_critical | AFTER | INSERT | ROW | enabled | public.trigger_dispatch_critical_alert |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
