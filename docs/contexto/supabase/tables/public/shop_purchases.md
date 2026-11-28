# public.shop_purchases

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `reward_id` | `uuid` | não |  |  |  |
| 4 | `status` | `purchase_status` | não | `'pending'::purchase_status` |  |  |
| 5 | `quantity` | `integer` | não | `1` |  |  |
| 6 | `total_coins` | `integer` | não |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `processed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `processed_by` | `uuid` | sim |  |  |  |
| 11 | `approval_status` | `text` | não | `'pending'::text` |  |  |
| 12 | `approved_by` | `uuid` | sim |  |  |  |
| 13 | `approval_reason` | `text` | sim |  |  |  |
| 14 | `risk_score` | `numeric` | sim |  |  |  |
| 15 | `risk_flags` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 16 | `risk_level` | `text` | sim |  |  |  |
| 17 | `risk_factors` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 18 | `ai_summary` | `text` | sim |  |  |  |
| 19 | `risk_analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `requires_dual_approval` | `boolean` | não | `false` |  |  |
| 21 | `first_approver_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| shop_purchases_approval_status_check | CHECK | `CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'auto_approved'::text]))` |  |  | sim |
| shop_purchases_approved_by_fkey | FOREIGN KEY | `FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| shop_purchases_first_approver_id_fkey | FOREIGN KEY | `FOREIGN KEY (first_approver_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| shop_purchases_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| shop_purchases_reward_id_fkey | FOREIGN KEY | `FOREIGN KEY (reward_id) REFERENCES shop_rewards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| shop_purchases_risk_level_check | CHECK | `CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| shop_purchases_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.purchase_approvals | purchase_approvals_purchase_id_fkey | {purchase_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_shop_purchases_reward_id | btree | {reward_id} | não | sim |  | `CREATE INDEX idx_shop_purchases_reward_id ON public.shop_purchases USING btree (reward_id)` |
| idx_shop_purchases_status_risk | btree | {status,risk_score} | não | sim |  | `CREATE INDEX idx_shop_purchases_status_risk ON public.shop_purchases USING btree (status, risk_score DESC)` |
| idx_shop_purchases_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_shop_purchases_user_id ON public.shop_purchases USING btree (user_id)` |
| shop_purchases_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX shop_purchases_pkey ON public.shop_purchases USING btree (id)` |


## Policies (RLS)

### `Admins can update purchases`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Admins can view all purchases`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can create purchases`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own purchases`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_log_purchase_requested | AFTER | INSERT | ROW | enabled | public.log_purchase_requested |


## Grants

_nenhum_
