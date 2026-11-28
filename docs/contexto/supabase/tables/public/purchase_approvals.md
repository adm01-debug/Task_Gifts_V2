# public.purchase_approvals

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
| 2 | `purchase_id` | `uuid` | não |  |  |  |
| 3 | `actor_id` | `uuid` | sim |  |  |  |
| 4 | `action` | `text` | não |  |  |  |
| 5 | `from_status` | `purchase_status` | sim |  |  |  |
| 6 | `to_status` | `purchase_status` | sim |  |  |  |
| 7 | `reason` | `text` | sim |  |  |  |
| 8 | `risk_snapshot` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| purchase_approvals_action_check | CHECK | `CHECK (action = ANY (ARRAY['requested'::text, 'ai_review'::text, 'approve'::text, 'first_approval'::text, 'reject'::text, 'deliver'::text, 'cancel'::text, 'reopen'::text]))` |  |  | sim |
| purchase_approvals_actor_id_fkey | FOREIGN KEY | `FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| purchase_approvals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| purchase_approvals_purchase_id_fkey | FOREIGN KEY | `FOREIGN KEY (purchase_id) REFERENCES shop_purchases(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_purchase_approvals_purchase | btree | {purchase_id,created_at} | não | sim |  | `CREATE INDEX idx_purchase_approvals_purchase ON public.purchase_approvals USING btree (purchase_id, created_at DESC)` |
| purchase_approvals_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX purchase_approvals_pkey ON public.purchase_approvals USING btree (id)` |


## Policies (RLS)

### `purchase_approvals_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `purchase_approvals_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM shop_purchases sp   WHERE ((sp.id = purchase_approvals.purchase_id) AND (sp.user_id = auth.uid()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
