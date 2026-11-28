# public.memory_sessions

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
| 3 | `deck_id` | `uuid` | não |  |  |  |
| 4 | `status` | `text` | não | `'active'::text` |  |  |
| 5 | `pairs_total` | `integer` | não | `0` |  |  |
| 6 | `matched_pairs` | `integer` | não | `0` |  |  |
| 7 | `moves` | `integer` | não | `0` |  |  |
| 8 | `duration_ms` | `integer` | não | `0` |  |  |
| 9 | `coins_awarded` | `integer` | não | `0` |  |  |
| 10 | `xp_awarded` | `integer` | não | `0` |  |  |
| 11 | `session_date` | `date` | não | `((now() AT TIME ZONE 'utc'::text))::date` |  |  |
| 12 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `finished_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| memory_sessions_deck_id_fkey | FOREIGN KEY | `FOREIGN KEY (deck_id) REFERENCES memory_decks(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| memory_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| memory_sessions_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text, 'finished'::text]))` |  |  | sim |
| memory_sessions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_memory_sessions_leaderboard | btree | {deck_id,session_date,status} | não | sim |  | `CREATE INDEX idx_memory_sessions_leaderboard ON public.memory_sessions USING btree (deck_id, session_date, status)` |
| idx_memory_sessions_user | btree | {user_id,session_date} | não | sim |  | `CREATE INDEX idx_memory_sessions_user ON public.memory_sessions USING btree (user_id, session_date DESC)` |
| memory_sessions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX memory_sessions_pkey ON public.memory_sessions USING btree (id)` |


## Policies (RLS)

### `memory_sessions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `memory_sessions_user_own`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| memory_sessions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
