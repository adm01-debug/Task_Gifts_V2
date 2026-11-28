# public.lightning_quiz_questions

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
| 2 | `statement` | `text` | não |  |  |  |
| 3 | `is_true` | `boolean` | não |  |  |  |
| 4 | `explanation` | `text` | sim |  |  |  |
| 5 | `category` | `text` | não | `'geral'::text` |  |  |
| 6 | `difficulty` | `text` | não | `'easy'::text` |  |  |
| 7 | `is_active` | `boolean` | não | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lightning_quiz_questions_category_check | CHECK | `CHECK (length(category) <= 40)` |  |  | sim |
| lightning_quiz_questions_difficulty_check | CHECK | `CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))` |  |  | sim |
| lightning_quiz_questions_explanation_check | CHECK | `CHECK (explanation IS NULL OR length(explanation) <= 320)` |  |  | sim |
| lightning_quiz_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lightning_quiz_questions_statement_check | CHECK | `CHECK (btrim(statement) <> ''::text AND length(statement) <= 240)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lightning_quiz_answers | lightning_quiz_answers_question_id_fkey | {question_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lightning_questions_active_idx | btree | {is_active,difficulty} | não | sim |  | `CREATE INDEX lightning_questions_active_idx ON public.lightning_quiz_questions USING btree (is_active, difficulty)` |
| lightning_quiz_questions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lightning_quiz_questions_pkey ON public.lightning_quiz_questions USING btree (id)` |


## Policies (RLS)

### `lightning_quiz_questions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `lightning_quiz_questions_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| lightning_quiz_questions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
