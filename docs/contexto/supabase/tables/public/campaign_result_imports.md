# public.campaign_result_imports

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `file_name` | `text` | não |  |  |  |
| 4 | `source` | `text` | não | `'spreadsheet'::text` |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `total_rows` | `integer` | não | `0` |  |  |
| 7 | `valid_rows` | `integer` | não | `0` |  |  |
| 8 | `error_rows` | `integer` | não | `0` |  |  |
| 9 | `applied_rows` | `integer` | não | `0` |  |  |
| 10 | `skipped_rows` | `integer` | não | `0` |  |  |
| 11 | `total_amount` | `numeric` | não | `0` |  |  |
| 12 | `summary` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `error_message` | `text` | sim |  |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `applied_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `reverted_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_result_imports_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_result_imports_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| campaign_result_imports_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_result_imports_source_check | CHECK | `CHECK (source = ANY (ARRAY['spreadsheet'::text, 'api'::text, 'manual'::text]))` |  |  | sim |
| campaign_result_imports_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'applied'::text, 'reverted'::text, 'failed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.campaign_result_rows | campaign_result_rows_import_id_fkey | {import_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_result_imports_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_result_imports_pkey ON public.campaign_result_imports USING btree (id)` |
| idx_campaign_result_imports_campaign | btree | {campaign_id,created_at} | não | sim |  | `CREATE INDEX idx_campaign_result_imports_campaign ON public.campaign_result_imports USING btree (campaign_id, created_at DESC)` |


## Policies (RLS)

### `campaign_imports_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `campaign_imports_creator_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(created_by = auth.uid())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| campaign_result_imports_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
