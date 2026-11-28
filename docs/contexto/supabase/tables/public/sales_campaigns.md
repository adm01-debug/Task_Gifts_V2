# public.sales_campaigns

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
| 2 | `org_id` | `uuid` | sim |  |  |  |
| 3 | `department_id` | `uuid` | sim |  |  |  |
| 4 | `name` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `sku` | `text` | sim |  |  |  |
| 7 | `product_name` | `text` | sim |  |  |  |
| 8 | `metric_key` | `text` | não | `'sales_amount'::text` |  |  |
| 9 | `metric_unit` | `text` | não | `'BRL'::text` |  |  |
| 10 | `start_date` | `date` | não |  |  |  |
| 11 | `end_date` | `date` | não |  |  |  |
| 12 | `target_global` | `numeric(14,2)` | não | `0` |  |  |
| 13 | `target_individual_default` | `numeric(14,2)` | não | `0` |  |  |
| 14 | `progress_global` | `numeric(14,2)` | não | `0` |  |  |
| 15 | `split_rule` | `jsonb` | não | `'{"type": "proportional", "xp_per_unit": 1, "coin_per_unit": 0.1, "global_bonus_xp": 500, "global_bonus_coins": 100}'::jsonb` |  |  |
| 16 | `xp_reward` | `integer` | não | `0` |  |  |
| 17 | `coin_reward` | `integer` | não | `0` |  |  |
| 18 | `status` | `text` | não | `'draft'::text` |  |  |
| 19 | `cover_image_url` | `text` | sim |  |  |  |
| 20 | `created_by` | `uuid` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_campaigns_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sales_campaigns_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sales_campaigns_org_id_fkey | FOREIGN KEY | `FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sales_campaigns_period_valid | CHECK | `CHECK (end_date >= start_date)` |  |  | sim |
| sales_campaigns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_campaigns_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.campaign_participants | campaign_participants_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_progress_events | campaign_progress_events_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_result_imports | campaign_result_imports_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_result_rows | campaign_result_rows_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_team_members | campaign_team_members_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_team_split_batches | campaign_team_split_batches_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_team_split_entries | campaign_team_split_entries_campaign_id_fkey | {campaign_id} | CASCADE |
| public.campaign_teams | campaign_teams_campaign_id_fkey | {campaign_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_campaigns_created_by | btree | {created_by} | não | sim |  | `CREATE INDEX idx_sales_campaigns_created_by ON public.sales_campaigns USING btree (created_by)` |
| idx_sales_campaigns_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_sales_campaigns_department_id ON public.sales_campaigns USING btree (department_id)` |
| idx_sales_campaigns_metric_key | btree | {metric_key} | não | sim | `(status = 'active'::text)` | `CREATE INDEX idx_sales_campaigns_metric_key ON public.sales_campaigns USING btree (metric_key) WHERE (status = 'active'::text)` |
| idx_sales_campaigns_org_id | btree | {org_id} | não | sim |  | `CREATE INDEX idx_sales_campaigns_org_id ON public.sales_campaigns USING btree (org_id)` |
| idx_sales_campaigns_org_status | btree | {org_id,status} | não | sim |  | `CREATE INDEX idx_sales_campaigns_org_status ON public.sales_campaigns USING btree (org_id, status)` |
| idx_sales_campaigns_period | btree | {start_date,end_date} | não | sim |  | `CREATE INDEX idx_sales_campaigns_period ON public.sales_campaigns USING btree (start_date, end_date)` |
| sales_campaigns_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX sales_campaigns_pkey ON public.sales_campaigns USING btree (id)` |


## Policies (RLS)

### `campaigns_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `campaigns_insert_admin_manager`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `campaigns_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |

### `campaigns_update_admin_manager`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sales_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
