# public.feedback_requests

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
| 2 | `cycle_id` | `uuid` | não |  |  |  |
| 3 | `from_user_id` | `uuid` | não |  |  |  |
| 4 | `to_user_id` | `uuid` | não |  |  |  |
| 5 | `relationship` | `text` | não |  |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `due_date` | `date` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_requests_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (cycle_id) REFERENCES feedback_cycles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| feedback_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| feedback_requests_relationship_check | CHECK | `CHECK (relationship = ANY (ARRAY['self'::text, 'manager'::text, 'peer'::text, 'direct_report'::text]))` |  |  | sim |
| feedback_requests_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'submitted'::text, 'skipped'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.feedback_responses | feedback_responses_request_id_fkey | {request_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_requests_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX feedback_requests_pkey ON public.feedback_requests USING btree (id)` |
| idx_feedback_requests_cycle_id | btree | {cycle_id} | não | sim |  | `CREATE INDEX idx_feedback_requests_cycle_id ON public.feedback_requests USING btree (cycle_id)` |


## Policies (RLS)

### `Admins can view all requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can create requests`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `Users can update their requests`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(from_user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view their feedback requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((from_user_id = auth.uid()) OR (to_user_id = auth.uid()))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_feedback_requests_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
