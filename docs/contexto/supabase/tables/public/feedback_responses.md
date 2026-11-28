# public.feedback_responses

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
| 2 | `request_id` | `uuid` | não |  |  |  |
| 3 | `answers` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 4 | `strengths` | `text` | sim |  |  |  |
| 5 | `improvements` | `text` | sim |  |  |  |
| 6 | `overall_rating` | `integer` | sim |  |  |  |
| 7 | `is_anonymous` | `boolean` | não | `false` |  |  |
| 8 | `submitted_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_responses_overall_rating_check | CHECK | `CHECK (overall_rating >= 1 AND overall_rating <= 5)` |  |  | sim |
| feedback_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| feedback_responses_request_id_fkey | FOREIGN KEY | `FOREIGN KEY (request_id) REFERENCES feedback_requests(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.development_plans | development_plans_linked_feedback_id_fkey | {linked_feedback_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_responses_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX feedback_responses_pkey ON public.feedback_responses USING btree (id)` |
| idx_feedback_responses_request_id | btree | {request_id} | não | sim |  | `CREATE INDEX idx_feedback_responses_request_id ON public.feedback_responses USING btree (request_id)` |


## Policies (RLS)

### `Admins can view all responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Receivers can view non-anonymous feedback`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_anonymous = false) AND (EXISTS ( SELECT 1    FROM feedback_requests r   WHERE ((r.id = feedback_responses.request_id) AND (r.to_user_id = auth.uid())))))` |
| WITH CHECK |  |

### `Submitters can create responses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM feedback_requests r   WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid()))))` |

### `Submitters can view own responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM feedback_requests r   WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
