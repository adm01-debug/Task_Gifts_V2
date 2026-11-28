# public.push_outbox_health_snapshots

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
| 2 | `score` | `integer` | não |  |  |  |
| 3 | `severity` | `text` | não |  |  |  |
| 4 | `pending` | `integer` | não | `0` |  |  |
| 5 | `processing` | `integer` | não | `0` |  |  |
| 6 | `stuck` | `integer` | não | `0` |  |  |
| 7 | `sent` | `integer` | não | `0` |  |  |
| 8 | `failed` | `integer` | não | `0` |  |  |
| 9 | `skipped` | `integer` | não | `0` |  |  |
| 10 | `oldest_pending_minutes` | `integer` | não | `0` |  |  |
| 11 | `minutes_since_last_dispatch` | `integer` | sim |  |  |  |
| 12 | `alerts` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| push_outbox_health_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| push_outbox_health_snapshots_score_check | CHECK | `CHECK (score >= 0 AND score <= 100)` |  |  | sim |
| push_outbox_health_snapshots_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['ok'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_push_outbox_health_snapshots | btree | {created_at} | não | sim |  | `CREATE INDEX idx_push_outbox_health_snapshots ON public.push_outbox_health_snapshots USING btree (created_at DESC)` |
| push_outbox_health_snapshots_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX push_outbox_health_snapshots_pkey ON public.push_outbox_health_snapshots USING btree (id)` |


## Policies (RLS)

### `push_outbox_health_admin_all`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
