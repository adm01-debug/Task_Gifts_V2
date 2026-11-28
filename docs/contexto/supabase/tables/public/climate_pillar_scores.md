# public.climate_pillar_scores

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
| 2 | `survey_id` | `uuid` | não |  |  |  |
| 3 | `department_id` | `uuid` | sim |  |  |  |
| 4 | `pillar` | `climate_pillar` | não |  |  |  |
| 5 | `score` | `numeric(5,2)` | não |  |  |  |
| 6 | `response_count` | `integer` | não | `0` |  |  |
| 7 | `previous_score` | `numeric(5,2)` | sim |  |  |  |
| 8 | `trend` | `text` | sim |  |  |  |
| 9 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| climate_pillar_scores_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| climate_pillar_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| climate_pillar_scores_survey_id_department_id_pillar_key | UNIQUE | `UNIQUE (survey_id, department_id, pillar)` |  |  | sim |
| climate_pillar_scores_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (survey_id) REFERENCES climate_surveys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| climate_pillar_scores_trend_check | CHECK | `CHECK (trend = ANY (ARRAY['up'::text, 'down'::text, 'stable'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| climate_pillar_scores_global_key | btree | {survey_id,pillar} | sim | sim | `(department_id IS NULL)` | `CREATE UNIQUE INDEX climate_pillar_scores_global_key ON public.climate_pillar_scores USING btree (survey_id, pillar) WHERE (department_id IS NULL)` |
| climate_pillar_scores_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX climate_pillar_scores_pkey ON public.climate_pillar_scores USING btree (id)` |
| climate_pillar_scores_survey_id_department_id_pillar_key | btree | {survey_id,department_id,pillar} | sim | sim |  | `CREATE UNIQUE INDEX climate_pillar_scores_survey_id_department_id_pillar_key ON public.climate_pillar_scores USING btree (survey_id, department_id, pillar)` |
| idx_climate_pillar_scores_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_climate_pillar_scores_department_id ON public.climate_pillar_scores USING btree (department_id)` |
| idx_climate_pillar_scores_survey | btree | {survey_id} | não | sim |  | `CREATE INDEX idx_climate_pillar_scores_survey ON public.climate_pillar_scores USING btree (survey_id)` |


## Policies (RLS)

### `Managers can view pillar scores`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `System can manage pillar scores`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
