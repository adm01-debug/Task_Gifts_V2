# public.scratch_cards

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
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
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `prize_id` | `uuid` | sim |  |  |  |
| 8 | `prize_label` | `text` | sim |  |  |  |
| 9 | `prize_type` | `text` | sim |  |  |  |
| 10 | `amount` | `integer` | não | `0` |  |  |
| 11 | `rarity` | `text` | sim |  |  |  |
| 12 | `revealed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scratch_cards_dedupe_key_check | CHECK | `CHECK (length(dedupe_key) <= 160)` |  |  | sim |
| scratch_cards_dedupe_key_unique | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| scratch_cards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scratch_cards_prize_id_fkey | FOREIGN KEY | `FOREIGN KEY (prize_id) REFERENCES scratch_card_prizes(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| scratch_cards_prize_type_check | CHECK | `CHECK (prize_type = ANY (ARRAY['coins'::text, 'xp'::text, 'nothing'::text]))` |  |  | sim |
| scratch_cards_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |
| scratch_cards_source_check | CHECK | `CHECK (source = ANY (ARRAY['task'::text, 'training'::text, 'quest'::text, 'campaign'::text, 'manual'::text]))` |  |  | sim |
| scratch_cards_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'revealed'::text]))` |  |  | sim |
| scratch_cards_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scratch_cards_user_status | btree | {user_id,status} | não | sim |  | `CREATE INDEX idx_scratch_cards_user_status ON public.scratch_cards USING btree (user_id, status)` |
| scratch_cards_dedupe_key_unique | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX scratch_cards_dedupe_key_unique ON public.scratch_cards USING btree (dedupe_key)` |
| scratch_cards_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX scratch_cards_pkey ON public.scratch_cards USING btree (id)` |
| scratch_cards_user_dedupe_uidx | btree | {user_id,dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX scratch_cards_user_dedupe_uidx ON public.scratch_cards USING btree (user_id, dedupe_key)` |
| scratch_cards_user_status_idx | btree | {user_id,status,created_at} | não | sim |  | `CREATE INDEX scratch_cards_user_status_idx ON public.scratch_cards USING btree (user_id, status, created_at DESC)` |


## Policies (RLS)

### `scratch_cards_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `scratch_cards_user_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `scratch_cards_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `scratch_cards_user_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) AND (status = 'pending'::text))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| scratch_cards_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
