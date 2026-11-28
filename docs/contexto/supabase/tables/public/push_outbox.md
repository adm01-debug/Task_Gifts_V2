# public.push_outbox

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `type` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `message` | `text` | não |  |  |  |
| 6 | `url` | `text` | sim |  |  |  |
| 7 | `data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 8 | `dedupe_key` | `text` | não |  |  |  |
| 9 | `status` | `text` | não | `'pending'::text` |  |  |
| 10 | `attempts` | `integer` | não | `0` |  |  |
| 11 | `last_error` | `text` | sim |  |  |  |
| 12 | `processed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `deferred_until` | `timestamp with time zone` | sim |  |  | Fim da janela de silencio do usuario (notification_preferences.do_not_disturb_*). Preenchido apenas com status = deferred; claim_push_outbox devolve a linha para pending quando vence. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| push_outbox_dedupe_key_unique | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| push_outbox_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| push_outbox_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'deferred'::text, 'sent'::text, 'failed'::text, 'skipped'::text]))` |  |  | sim |
| push_outbox_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_push_outbox_pending | btree | {created_at} | não | sim | `(status = 'pending'::text)` | `CREATE INDEX idx_push_outbox_pending ON public.push_outbox USING btree (created_at) WHERE (status = 'pending'::text)` |
| idx_push_outbox_status | btree | {status,created_at} | não | sim | `(status = ANY (ARRAY['pending'::text, 'processing'::text]))` | `CREATE INDEX idx_push_outbox_status ON public.push_outbox USING btree (status, created_at) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]))` |
| idx_push_outbox_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_push_outbox_user ON public.push_outbox USING btree (user_id)` |
| push_outbox_dedupe_key_unique | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX push_outbox_dedupe_key_unique ON public.push_outbox USING btree (dedupe_key)` |
| push_outbox_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX push_outbox_pkey ON public.push_outbox USING btree (id)` |


## Policies (RLS)

### `push_outbox_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `push_outbox_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| push_outbox_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
