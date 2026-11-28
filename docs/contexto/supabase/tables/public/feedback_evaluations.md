# public.feedback_evaluations

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
| 2 | `cycle_id` | `uuid` | não |  |  |  |
| 3 | `evaluator_id` | `uuid` | não |  |  |  |
| 4 | `evaluatee_id` | `uuid` | não |  |  |  |
| 5 | `evaluator_type` | `text` | sim | `'peer'::text` |  |  |
| 6 | `status` | `text` | sim | `'pending'::text` |  |  |
| 7 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `reminder_sent_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_evaluations_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (cycle_id) REFERENCES feedback_cycles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| feedback_evaluations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_evaluations_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX feedback_evaluations_pkey ON public.feedback_evaluations USING btree (id)` |
| idx_feedback_evaluations_cycle_id | btree | {cycle_id} | não | sim |  | `CREATE INDEX idx_feedback_evaluations_cycle_id ON public.feedback_evaluations USING btree (cycle_id)` |


## Policies (RLS)

### `Users insert own evaluations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(evaluator_id = auth.uid())` |

### `feedback_evaluations_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = evaluator_id) OR (auth.uid() = evaluatee_id))` |
| WITH CHECK |  |

### `feedback_evaluations_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = evaluator_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
