# public.card_packs

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
| 3 | `source` | `text` | não |  |  |  |
| 4 | `source_ref` | `text` | sim |  |  |  |
| 5 | `dedupe_key` | `text` | não |  |  |  |
| 6 | `size` | `integer` | não | `5` |  |  |
| 7 | `status` | `text` | não | `'sealed'::text` |  |  |
| 8 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `result` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| card_packs_dedupe_unique | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| card_packs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| card_packs_size_check | CHECK | `CHECK (size >= 1)` |  |  | sim |
| card_packs_source_check | CHECK | `CHECK (source = ANY (ARRAY['task'::text, 'training'::text, 'quest'::text, 'campaign'::text, 'manual'::text, 'streak'::text]))` |  |  | sim |
| card_packs_status_check | CHECK | `CHECK (status = ANY (ARRAY['sealed'::text, 'opened'::text]))` |  |  | sim |
| card_packs_user_id_dedupe_key_key | UNIQUE | `UNIQUE (user_id, dedupe_key)` |  |  | sim |
| card_packs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| card_packs_dedupe_unique | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX card_packs_dedupe_unique ON public.card_packs USING btree (dedupe_key)` |
| card_packs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX card_packs_pkey ON public.card_packs USING btree (id)` |
| card_packs_user_id_dedupe_key_key | btree | {user_id,dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX card_packs_user_id_dedupe_key_key ON public.card_packs USING btree (user_id, dedupe_key)` |
| idx_card_packs_user_status | btree | {user_id,status,created_at} | não | sim |  | `CREATE INDEX idx_card_packs_user_status ON public.card_packs USING btree (user_id, status, created_at DESC)` |


## Policies (RLS)

### `card_packs_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `card_packs_user_select`

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
| card_packs_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_card_pack_notify | AFTER | INSERT | ROW | enabled | public.card_pack_notify |


## Grants

_nenhum_
