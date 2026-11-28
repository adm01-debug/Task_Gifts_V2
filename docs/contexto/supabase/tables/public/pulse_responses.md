# public.pulse_responses

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
| 4 | `answers` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 5 | `submitted_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pulse_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pulse_responses_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (survey_id) REFERENCES pulse_surveys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pulse_responses_survey_id | btree | {survey_id} | não | sim |  | `CREATE INDEX idx_pulse_responses_survey_id ON public.pulse_responses USING btree (survey_id)` |
| pulse_responses_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX pulse_responses_pkey ON public.pulse_responses USING btree (id)` |


## Policies (RLS)

### `Managers can view anonymous aggregated responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can submit responses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

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
