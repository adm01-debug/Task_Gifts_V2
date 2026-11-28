# public.climate_question_answers

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `response_id` | `uuid` | não |  |  |  |
| 3 | `question_id` | `uuid` | não |  |  |  |
| 4 | `score` | `integer` | sim |  |  |  |
| 5 | `text_answer` | `text` | sim |  |  |  |
| 6 | `selected_options` | `jsonb` | sim |  |  |  |
| 7 | `skipped` | `boolean` | não | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| climate_question_answers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| climate_question_answers_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES climate_survey_questions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| climate_question_answers_response_id_fkey | FOREIGN KEY | `FOREIGN KEY (response_id) REFERENCES climate_survey_responses(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| climate_question_answers_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX climate_question_answers_pkey ON public.climate_question_answers USING btree (id)` |
| idx_climate_question_answers_question_id | btree | {question_id} | não | sim |  | `CREATE INDEX idx_climate_question_answers_question_id ON public.climate_question_answers USING btree (question_id)` |
| idx_climate_question_answers_response_id | btree | {response_id} | não | sim |  | `CREATE INDEX idx_climate_question_answers_response_id ON public.climate_question_answers USING btree (response_id)` |


## Policies (RLS)

### `Users view own answers`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM climate_survey_responses r   WHERE ((r.id = climate_question_answers.response_id) AND (r.user_id = auth.uid()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
