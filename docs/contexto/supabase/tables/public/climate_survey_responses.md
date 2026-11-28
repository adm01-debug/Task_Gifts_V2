# public.climate_survey_responses

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
| 2 | `survey_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `is_complete` | `boolean` | não | `false` |  |  |
| 5 | `completion_time_seconds` | `integer` | sim |  |  |  |
| 6 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| climate_survey_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| climate_survey_responses_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (survey_id) REFERENCES climate_surveys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.climate_question_answers | climate_question_answers_response_id_fkey | {response_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| climate_survey_responses_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX climate_survey_responses_pkey ON public.climate_survey_responses USING btree (id)` |
| climate_survey_responses_survey_user_key | btree | {survey_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX climate_survey_responses_survey_user_key ON public.climate_survey_responses USING btree (survey_id, user_id)` |
| idx_climate_survey_responses_survey | btree | {survey_id} | não | sim |  | `CREATE INDEX idx_climate_survey_responses_survey ON public.climate_survey_responses USING btree (survey_id)` |
| idx_climate_survey_responses_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_climate_survey_responses_user ON public.climate_survey_responses USING btree (user_id)` |


## Policies (RLS)

### `Users can view own responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
