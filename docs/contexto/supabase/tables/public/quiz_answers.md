# public.quiz_answers

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
| 3 | `question_id` | `uuid` | não |  |  |  |
| 4 | `selected_option_id` | `uuid` | sim |  |  |  |
| 5 | `is_correct` | `boolean` | não |  |  |  |
| 6 | `time_spent_ms` | `integer` | sim | `0` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quiz_answers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| quiz_answers_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| quiz_answers_selected_option_id_fkey | FOREIGN KEY | `FOREIGN KEY (selected_option_id) REFERENCES quiz_options(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_quiz_answers_created | btree | {created_at} | não | sim |  | `CREATE INDEX idx_quiz_answers_created ON public.quiz_answers USING btree (created_at DESC)` |
| idx_quiz_answers_question | btree | {question_id} | não | sim |  | `CREATE INDEX idx_quiz_answers_question ON public.quiz_answers USING btree (question_id)` |
| idx_quiz_answers_selected_option_id | btree | {selected_option_id} | não | sim |  | `CREATE INDEX idx_quiz_answers_selected_option_id ON public.quiz_answers USING btree (selected_option_id)` |
| idx_quiz_answers_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_quiz_answers_user ON public.quiz_answers USING btree (user_id)` |
| quiz_answers_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX quiz_answers_pkey ON public.quiz_answers USING btree (id)` |


## Policies (RLS)

### `Users can insert own answers`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own quiz answers`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
