# public.postmortems

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
| 3 | `alert_type` | `text` | sim |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'draft'::text` |  |  |
| 6 | `severity` | `text` | sim |  |  |  |
| 7 | `incident_started_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `incident_resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `duration_seconds` | `integer` | sim |  |  |  |
| 10 | `summary` | `text` | sim |  |  |  |
| 11 | `root_cause` | `text` | sim |  |  |  |
| 12 | `contributing_factors` | `text` | sim |  |  |  |
| 13 | `timeline` | `text` | sim |  |  |  |
| 14 | `action_items` | `text` | sim |  |  |  |
| 15 | `lessons_learned` | `text` | sim |  |  |  |
| 16 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 17 | `created_by` | `uuid` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| postmortems_alert_id_fkey | FOREIGN KEY | `FOREIGN KEY (alert_id) REFERENCES security_alerts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| postmortems_alert_id_key | UNIQUE | `UNIQUE (alert_id)` |  |  | sim |
| postmortems_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| postmortems_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| postmortems_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.postmortem_actions | postmortem_actions_postmortem_id_fkey | {postmortem_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_postmortems_alert | btree | {alert_id} | não | sim |  | `CREATE INDEX idx_postmortems_alert ON public.postmortems USING btree (alert_id)` |
| idx_postmortems_created_by | btree | {created_by} | não | sim |  | `CREATE INDEX idx_postmortems_created_by ON public.postmortems USING btree (created_by)` |
| idx_postmortems_status_created | btree | {status,created_at} | não | sim |  | `CREATE INDEX idx_postmortems_status_created ON public.postmortems USING btree (status, created_at DESC)` |
| postmortems_alert_id_key | btree | {alert_id} | sim | sim |  | `CREATE UNIQUE INDEX postmortems_alert_id_key ON public.postmortems USING btree (alert_id)` |
| postmortems_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX postmortems_pkey ON public.postmortems USING btree (id)` |


## Policies (RLS)

### `Admins manage postmortems`

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
| trg_postmortems_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
