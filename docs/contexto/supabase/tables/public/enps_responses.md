# public.enps_responses

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
| 2 | `survey_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `score` | `integer` | não |  |  |  |
| 5 | `category` | `text` | sim |  |  |  |
| 6 | `follow_up_answer` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| enps_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| enps_responses_score_check | CHECK | `CHECK (score >= 0 AND score <= 10)` |  |  | sim |
| enps_responses_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (survey_id) REFERENCES enps_surveys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| enps_responses_survey_id_user_id_key | UNIQUE | `UNIQUE (survey_id, user_id)` |  |  | sim |
| enps_responses_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| enps_responses_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX enps_responses_pkey ON public.enps_responses USING btree (id)` |
| enps_responses_survey_id_user_id_key | btree | {survey_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX enps_responses_survey_id_user_id_key ON public.enps_responses USING btree (survey_id, user_id)` |
| idx_enps_responses_survey | btree | {survey_id} | não | sim |  | `CREATE INDEX idx_enps_responses_survey ON public.enps_responses USING btree (survey_id)` |
| idx_enps_responses_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_enps_responses_user_id ON public.enps_responses USING btree (user_id)` |


## Policies (RLS)

### `Admins can view all responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can submit their responses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view their own responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
