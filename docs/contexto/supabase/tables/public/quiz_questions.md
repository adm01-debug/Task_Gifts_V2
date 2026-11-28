# public.quiz_questions

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
| 2 | `quiz_type` | `text` | não | `'magic_cards'::text` |  |  |
| 3 | `question` | `text` | não |  |  |  |
| 4 | `explanation` | `text` | sim |  |  |  |
| 5 | `points` | `integer` | não | `100` |  |  |
| 6 | `difficulty` | `text` | não | `'easy'::text` |  |  |
| 7 | `department_id` | `uuid` | sim |  |  |  |
| 8 | `category` | `text` | sim |  |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `created_by` | `uuid` | não |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quiz_questions_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| quiz_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.quiz_answers | quiz_answers_question_id_fkey | {question_id} | CASCADE |
| public.quiz_options | quiz_options_question_id_fkey | {question_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_quiz_questions_department | btree | {department_id} | não | sim |  | `CREATE INDEX idx_quiz_questions_department ON public.quiz_questions USING btree (department_id)` |
| idx_quiz_questions_type | btree | {quiz_type} | não | sim |  | `CREATE INDEX idx_quiz_questions_type ON public.quiz_questions USING btree (quiz_type)` |
| quiz_questions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX quiz_questions_pkey ON public.quiz_questions USING btree (id)` |


## Policies (RLS)

### `Admins and managers can manage questions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Everyone can view active questions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_quiz_questions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
