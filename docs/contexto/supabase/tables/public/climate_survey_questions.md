# public.climate_survey_questions

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
| 2 | `survey_id` | `uuid` | não |  |  |  |
| 3 | `pillar` | `climate_pillar` | não |  |  |  |
| 4 | `question_text` | `text` | não |  |  |  |
| 5 | `question_text_en` | `text` | sim |  |  |  |
| 6 | `question_text_es` | `text` | sim |  |  |  |
| 7 | `question_type` | `text` | não | `'likert_5'::text` |  |  |
| 8 | `options` | `jsonb` | sim |  |  |  |
| 9 | `is_required` | `boolean` | não | `true` |  |  |
| 10 | `order_index` | `integer` | não | `0` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| climate_survey_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| climate_survey_questions_question_type_check | CHECK | `CHECK (question_type = ANY (ARRAY['likert_5'::text, 'likert_10'::text, 'nps'::text, 'yes_no'::text, 'multiple_choice'::text, 'text'::text]))` |  |  | sim |
| climate_survey_questions_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (survey_id) REFERENCES climate_surveys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.climate_question_answers | climate_question_answers_question_id_fkey | {question_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| climate_survey_questions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX climate_survey_questions_pkey ON public.climate_survey_questions USING btree (id)` |
| idx_climate_survey_questions_survey | btree | {survey_id} | não | sim |  | `CREATE INDEX idx_climate_survey_questions_survey ON public.climate_survey_questions USING btree (survey_id)` |


## Policies (RLS)

### `Managers can add survey questions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |

### `Managers can delete draft survey questions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND (s.status = 'draft'::text) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Managers can update survey questions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |

### `View survey questions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.status = ANY (ARRAY['active'::text, 'completed'::text])) OR (s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
