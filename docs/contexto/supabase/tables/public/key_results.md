# public.key_results

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
| 2 | `goal_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `metric_type` | `text` | não | `'percentage'::text` |  |  |
| 6 | `target_value` | `numeric` | não | `100` |  |  |
| 7 | `current_value` | `numeric` | não | `0` |  |  |
| 8 | `unit` | `text` | sim |  |  |  |
| 9 | `weight` | `numeric` | não | `1` |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| key_results_goal_id_fkey | FOREIGN KEY | `FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| key_results_metric_type_check | CHECK | `CHECK (metric_type = ANY (ARRAY['percentage'::text, 'number'::text, 'currency'::text, 'boolean'::text]))` |  |  | sim |
| key_results_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| key_results_weight_check | CHECK | `CHECK (weight > 0::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.goal_updates | goal_updates_key_result_id_fkey | {key_result_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_key_results_goal_id | btree | {goal_id} | não | sim |  | `CREATE INDEX idx_key_results_goal_id ON public.key_results USING btree (goal_id)` |
| key_results_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX key_results_pkey ON public.key_results USING btree (id)` |


## Policies (RLS)

### `Goal owners and admins can view key results`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Goal owners can manage key results`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_key_results_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
