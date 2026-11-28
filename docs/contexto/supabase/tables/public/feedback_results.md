# public.feedback_results

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
| 2 | `cycle_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `competency_id` | `uuid` | sim |  |  |  |
| 5 | `self_score` | `numeric(4,2)` | sim |  |  |  |
| 6 | `manager_score` | `numeric(4,2)` | sim |  |  |  |
| 7 | `peer_score` | `numeric(4,2)` | sim |  |  |  |
| 8 | `direct_report_score` | `numeric(4,2)` | sim |  |  |  |
| 9 | `overall_score` | `numeric(4,2)` | sim |  |  |  |
| 10 | `response_count` | `integer` | sim | `0` |  |  |
| 11 | `blind_spots` | `jsonb` | sim |  |  |  |
| 12 | `hidden_strengths` | `jsonb` | sim |  |  |  |
| 13 | `calculated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_results_competency_id_fkey | FOREIGN KEY | `FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| feedback_results_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (cycle_id) REFERENCES feedback_cycles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| feedback_results_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_results_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX feedback_results_pkey ON public.feedback_results USING btree (id)` |
| idx_feedback_results_competency_id | btree | {competency_id} | não | sim |  | `CREATE INDEX idx_feedback_results_competency_id ON public.feedback_results USING btree (competency_id)` |
| idx_feedback_results_cycle_id | btree | {cycle_id} | não | sim |  | `CREATE INDEX idx_feedback_results_cycle_id ON public.feedback_results USING btree (cycle_id)` |


## Policies (RLS)

### `Managers insert feedback results`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |

### `feedback_results_select`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
