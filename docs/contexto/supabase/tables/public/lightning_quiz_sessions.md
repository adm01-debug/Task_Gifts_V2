# public.lightning_quiz_sessions

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
| 3 | `dedupe_key` | `text` | não |  |  |  |
| 4 | `status` | `text` | não | `'active'::text` |  |  |
| 5 | `question_ids` | `uuid[]` | não | `'{}'::uuid[]` |  |  |
| 6 | `current_index` | `integer` | não | `0` |  |  |
| 7 | `correct_count` | `integer` | não | `0` |  |  |
| 8 | `wrong_count` | `integer` | não | `0` |  |  |
| 9 | `current_streak` | `integer` | não | `0` |  |  |
| 10 | `best_streak` | `integer` | não | `0` |  |  |
| 11 | `coins_awarded` | `integer` | não | `0` |  |  |
| 12 | `xp_awarded` | `integer` | não | `0` |  |  |
| 13 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `deadline_at` | `timestamp with time zone` | não |  |  |  |
| 15 | `finished_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lightning_quiz_sessions_best_streak_check | CHECK | `CHECK (best_streak >= 0)` |  |  | sim |
| lightning_quiz_sessions_coins_awarded_check | CHECK | `CHECK (coins_awarded >= 0)` |  |  | sim |
| lightning_quiz_sessions_correct_count_check | CHECK | `CHECK (correct_count >= 0)` |  |  | sim |
| lightning_quiz_sessions_current_index_check | CHECK | `CHECK (current_index >= 0)` |  |  | sim |
| lightning_quiz_sessions_current_streak_check | CHECK | `CHECK (current_streak >= 0)` |  |  | sim |
| lightning_quiz_sessions_dedupe | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| lightning_quiz_sessions_dedupe_key_check | CHECK | `CHECK (length(dedupe_key) <= 120)` |  |  | sim |
| lightning_quiz_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lightning_quiz_sessions_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'expired'::text, 'finished'::text]))` |  |  | sim |
| lightning_quiz_sessions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lightning_quiz_sessions_wrong_count_check | CHECK | `CHECK (wrong_count >= 0)` |  |  | sim |
| lightning_quiz_sessions_xp_awarded_check | CHECK | `CHECK (xp_awarded >= 0)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lightning_quiz_answers | lightning_quiz_answers_session_id_fkey | {session_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lightning_quiz_sessions_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_lightning_quiz_sessions_user ON public.lightning_quiz_sessions USING btree (user_id, created_at DESC)` |
| lightning_quiz_sessions_dedupe | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX lightning_quiz_sessions_dedupe ON public.lightning_quiz_sessions USING btree (dedupe_key)` |
| lightning_quiz_sessions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lightning_quiz_sessions_pkey ON public.lightning_quiz_sessions USING btree (id)` |
| lightning_sessions_user_dedupe_uidx | btree | {user_id,dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX lightning_sessions_user_dedupe_uidx ON public.lightning_quiz_sessions USING btree (user_id, dedupe_key)` |


## Policies (RLS)

### `lightning_quiz_sessions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `lightning_quiz_sessions_user_own`

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
| lightning_quiz_sessions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
