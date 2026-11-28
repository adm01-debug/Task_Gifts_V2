# public.quiz_options

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
| 2 | `question_id` | `uuid` | não |  |  |  |
| 3 | `text` | `text` | não |  |  |  |
| 4 | `is_correct` | `boolean` | não | `false` |  |  |
| 5 | `order_index` | `integer` | não | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quiz_options_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| quiz_options_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.quiz_answers | quiz_answers_selected_option_id_fkey | {selected_option_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_quiz_options_question | btree | {question_id} | não | sim |  | `CREATE INDEX idx_quiz_options_question ON public.quiz_options USING btree (question_id)` |
| quiz_options_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX quiz_options_pkey ON public.quiz_options USING btree (id)` |


## Policies (RLS)

### `Admins and managers can manage options`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM quiz_questions q   WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |
| WITH CHECK |  |

### `Everyone can view options of active questions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM quiz_questions q   WHERE ((q.id = quiz_options.question_id) AND ((q.is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
