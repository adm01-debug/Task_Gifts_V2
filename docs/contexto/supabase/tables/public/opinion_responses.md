# public.opinion_responses

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
| 2 | `opinion_id` | `uuid` | não |  |  |  |
| 3 | `responder_id` | `uuid` | não |  |  |  |
| 4 | `content` | `text` | não |  |  |  |
| 5 | `is_internal` | `boolean` | não | `false` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| opinion_responses_opinion_id_fkey | FOREIGN KEY | `FOREIGN KEY (opinion_id) REFERENCES opinions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| opinion_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_opinion_responses_opinion_id | btree | {opinion_id} | não | sim |  | `CREATE INDEX idx_opinion_responses_opinion_id ON public.opinion_responses USING btree (opinion_id)` |
| opinion_responses_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX opinion_responses_pkey ON public.opinion_responses USING btree (id)` |


## Policies (RLS)

### `Responders can create responses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `((auth.uid() = responder_id) AND (EXISTS ( SELECT 1    FROM opinions o   WHERE ((o.id = opinion_responses.opinion_id) AND ((o.recipient_id = auth.uid()) OR ((o.recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((o.recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)))))))` |

### `View opinion responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM opinions o   WHERE ((o.id = opinion_responses.opinion_id) AND ((o.sender_id = auth.uid()) OR (o.recipient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
