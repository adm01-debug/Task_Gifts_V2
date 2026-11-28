# public.action_plan_items

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
| 2 | `plan_id` | `uuid` | não |  |  |  |
| 3 | `what_title` | `text` | não |  |  |  |
| 4 | `what_description` | `text` | sim |  |  |  |
| 5 | `why_reason` | `text` | sim |  |  |  |
| 6 | `where_location` | `text` | sim |  |  |  |
| 7 | `when_start` | `date` | sim |  |  |  |
| 8 | `when_end` | `date` | sim |  |  |  |
| 9 | `who_responsible_id` | `uuid` | não |  |  |  |
| 10 | `who_participants` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `how_method` | `text` | sim |  |  |  |
| 12 | `how_much_cost` | `numeric(12,2)` | sim | `0` |  |  |
| 13 | `how_much_currency` | `text` | sim | `'BRL'::text` |  |  |
| 14 | `status` | `text` | não | `'pending'::text` |  |  |
| 15 | `progress_percent` | `integer` | não | `0` |  |  |
| 16 | `priority` | `text` | não | `'medium'::text` |  |  |
| 17 | `impact_score` | `numeric(5,2)` | sim |  |  |  |
| 18 | `impact_notes` | `text` | sim |  |  |  |
| 19 | `order_index` | `integer` | não | `0` |  |  |
| 20 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| action_plan_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| action_plan_items_plan_id_fkey | FOREIGN KEY | `FOREIGN KEY (plan_id) REFERENCES action_plans(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| action_plan_items_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| action_plan_items_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'blocked'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| action_plan_items_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX action_plan_items_pkey ON public.action_plan_items USING btree (id)` |
| idx_action_plan_items_plan | btree | {plan_id} | não | sim |  | `CREATE INDEX idx_action_plan_items_plan ON public.action_plan_items USING btree (plan_id)` |


## Policies (RLS)

### `Manage action plan items`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM action_plans ap   WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |

### `View action plan items`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM action_plans ap   WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
