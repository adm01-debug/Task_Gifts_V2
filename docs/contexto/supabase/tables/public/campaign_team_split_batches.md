# public.campaign_team_split_batches

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `executed_by` | `uuid` | sim |  |  |  |
| 4 | `share_mode` | `text` | não | `'proportional'::text` |  |  |
| 5 | `pool_xp` | `numeric` | não | `0` |  |  |
| 6 | `pool_coins` | `numeric` | não | `0` |  |  |
| 7 | `teams_awarded` | `integer` | não | `0` |  |  |
| 8 | `members_awarded` | `integer` | não | `0` |  |  |
| 9 | `members_skipped` | `integer` | não | `0` |  |  |
| 10 | `total_xp_paid` | `integer` | não | `0` |  |  |
| 11 | `total_coins_paid` | `integer` | não | `0` |  |  |
| 12 | `status` | `text` | não | `'completed'::text` |  |  |
| 13 | `reason` | `text` | sim |  |  |  |
| 14 | `reverted_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `reverted_by` | `uuid` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_team_split_batches_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_team_split_batches_executed_by_fkey | FOREIGN KEY | `FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| campaign_team_split_batches_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_team_split_batches_reverted_by_fkey | FOREIGN KEY | `FOREIGN KEY (reverted_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| campaign_team_split_batches_share_mode_check | CHECK | `CHECK (share_mode = ANY (ARRAY['proportional'::text, 'equal'::text, 'position'::text]))` |  |  | sim |
| campaign_team_split_batches_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'reverted'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.campaign_team_split_entries | campaign_team_split_entries_batch_id_fkey | {batch_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_team_split_batches_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_team_split_batches_pkey ON public.campaign_team_split_batches USING btree (id)` |
| idx_team_split_batches_campaign | btree | {campaign_id,created_at} | não | sim |  | `CREATE INDEX idx_team_split_batches_campaign ON public.campaign_team_split_batches USING btree (campaign_id, created_at DESC)` |


## Policies (RLS)

### `campaign_team_split_batches_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

_nenhum_
