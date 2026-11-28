# public.runbook_executions

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
| 2 | `alert_id` | `uuid` | sim |  |  |  |
| 3 | `runbook_slug` | `text` | não |  |  |  |
| 4 | `phase` | `text` | não |  |  |  |
| 5 | `step_index` | `integer` | sim |  |  |  |
| 6 | `step_title` | `text` | sim |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `performed_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| runbook_executions_alert_id_fkey | FOREIGN KEY | `FOREIGN KEY (alert_id) REFERENCES security_alerts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| runbook_executions_performed_by_fkey | FOREIGN KEY | `FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| runbook_executions_phase_check | CHECK | `CHECK (phase = ANY (ARRAY['diagnose'::text, 'mitigate'::text, 'recover'::text, 'postmortem'::text, 'note'::text]))` |  |  | sim |
| runbook_executions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_runbook_exec_alert | btree | {alert_id,created_at} | não | sim |  | `CREATE INDEX idx_runbook_exec_alert ON public.runbook_executions USING btree (alert_id, created_at DESC)` |
| idx_runbook_exec_slug | btree | {runbook_slug,created_at} | não | sim |  | `CREATE INDEX idx_runbook_exec_slug ON public.runbook_executions USING btree (runbook_slug, created_at DESC)` |
| idx_runbook_executions_performed_by | btree | {performed_by} | não | sim |  | `CREATE INDEX idx_runbook_executions_performed_by ON public.runbook_executions USING btree (performed_by)` |
| runbook_executions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX runbook_executions_pkey ON public.runbook_executions USING btree (id)` |


## Policies (RLS)

### `Admins manage runbook executions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

_nenhum_
