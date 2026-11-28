# public.lightning_quiz_answers

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `session_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `question_id` | `uuid` | não |  |  |  |
| 5 | `idx` | `integer` | não |  |  |  |
| 6 | `answered_true` | `boolean` | não |  |  |  |
| 7 | `is_correct` | `boolean` | não |  |  |  |
| 8 | `elapsed_ms` | `integer` | não | `0` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lightning_quiz_answers_elapsed_ms_check | CHECK | `CHECK (elapsed_ms >= 0)` |  |  | sim |
| lightning_quiz_answers_idx_check | CHECK | `CHECK (idx >= 0)` |  |  | sim |
| lightning_quiz_answers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lightning_quiz_answers_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES lightning_quiz_questions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lightning_quiz_answers_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (session_id) REFERENCES lightning_quiz_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lightning_quiz_answers_unique | UNIQUE | `UNIQUE (session_id, idx)` |  |  | sim |
| lightning_quiz_answers_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lightning_quiz_answers_session | btree | {session_id} | não | sim |  | `CREATE INDEX idx_lightning_quiz_answers_session ON public.lightning_quiz_answers USING btree (session_id)` |
| lightning_answers_user_idx | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX lightning_answers_user_idx ON public.lightning_quiz_answers USING btree (user_id, created_at DESC)` |
| lightning_quiz_answers_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lightning_quiz_answers_pkey ON public.lightning_quiz_answers USING btree (id)` |
| lightning_quiz_answers_unique | btree | {session_id,idx} | sim | sim |  | `CREATE UNIQUE INDEX lightning_quiz_answers_unique ON public.lightning_quiz_answers USING btree (session_id, idx)` |


## Policies (RLS)

### `lightning_quiz_answers_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `lightning_quiz_answers_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `lightning_quiz_answers_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
