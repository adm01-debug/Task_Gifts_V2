# public.campaign_result_rows

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `import_id` | `uuid` | não |  |  |  |
| 3 | `campaign_id` | `uuid` | não |  |  |  |
| 4 | `row_number` | `integer` | não | `0` |  |  |
| 5 | `seller_identifier` | `text` | não |  |  |  |
| 6 | `user_id` | `uuid` | sim |  |  |  |
| 7 | `amount` | `numeric` | não | `0` |  |  |
| 8 | `reference_date` | `date` | sim |  |  |  |
| 9 | `external_reference` | `text` | sim |  |  |  |
| 10 | `dedupe_key` | `text` | não |  |  |  |
| 11 | `status` | `text` | não | `'valid'::text` |  |  |
| 12 | `error_reason` | `text` | sim |  |  |  |
| 13 | `applied_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_result_rows_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_result_rows_dedupe_unique | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| campaign_result_rows_import_id_fkey | FOREIGN KEY | `FOREIGN KEY (import_id) REFERENCES campaign_result_imports(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_result_rows_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_result_rows_status_check | CHECK | `CHECK (status = ANY (ARRAY['valid'::text, 'invalid'::text, 'applied'::text, 'skipped'::text, 'reverted'::text]))` |  |  | sim |
| campaign_result_rows_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_result_rows_dedupe_unique | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX campaign_result_rows_dedupe_unique ON public.campaign_result_rows USING btree (dedupe_key)` |
| campaign_result_rows_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_result_rows_pkey ON public.campaign_result_rows USING btree (id)` |
| idx_campaign_result_rows_campaign_status | btree | {campaign_id,status} | não | sim |  | `CREATE INDEX idx_campaign_result_rows_campaign_status ON public.campaign_result_rows USING btree (campaign_id, status)` |
| idx_campaign_result_rows_import | btree | {import_id,row_number} | não | sim |  | `CREATE INDEX idx_campaign_result_rows_import ON public.campaign_result_rows USING btree (import_id, row_number)` |
| uniq_campaign_result_rows_dedupe | btree | {campaign_id,dedupe_key} | sim | sim | `(status = ANY (ARRAY['valid'::text, 'applied'::text]))` | `CREATE UNIQUE INDEX uniq_campaign_result_rows_dedupe ON public.campaign_result_rows USING btree (campaign_id, dedupe_key) WHERE (status = ANY (ARRAY['valid'::text, 'applied'::text]))` |


## Policies (RLS)

### `campaign_result_rows_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| campaign_result_rows_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
