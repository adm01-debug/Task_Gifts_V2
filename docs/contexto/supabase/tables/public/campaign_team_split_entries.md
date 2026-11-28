# public.campaign_team_split_entries

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
| 2 | `batch_id` | `uuid` | não |  |  |  |
| 3 | `campaign_id` | `uuid` | não |  |  |  |
| 4 | `team_id` | `uuid` | sim |  |  |  |
| 5 | `team_name` | `text` | sim |  |  |  |
| 6 | `user_id` | `uuid` | sim |  |  |  |
| 7 | `user_identifier` | `text` | sim |  |  |  |
| 8 | `member_progress` | `numeric` | não | `0` |  |  |
| 9 | `team_progress` | `numeric` | não | `0` |  |  |
| 10 | `team_target` | `numeric` | não | `0` |  |  |
| 11 | `share_percent` | `numeric` | não | `0` |  |  |
| 12 | `xp_allocated` | `integer` | não | `0` |  |  |
| 13 | `coins_allocated` | `integer` | não | `0` |  |  |
| 14 | `outcome` | `text` | não | `'paid'::text` |  |  |
| 15 | `failure_reason` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_team_split_entries_batch_id_fkey | FOREIGN KEY | `FOREIGN KEY (batch_id) REFERENCES campaign_team_split_batches(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_team_split_entries_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_team_split_entries_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['paid'::text, 'skipped'::text, 'failed'::text]))` |  |  | sim |
| campaign_team_split_entries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_team_split_entries_team_id_fkey | FOREIGN KEY | `FOREIGN KEY (team_id) REFERENCES campaign_teams(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| campaign_team_split_entries_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_team_split_entries_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_team_split_entries_pkey ON public.campaign_team_split_entries USING btree (id)` |
| idx_campaign_team_split_entries | btree | {batch_id,user_id} | não | sim |  | `CREATE INDEX idx_campaign_team_split_entries ON public.campaign_team_split_entries USING btree (batch_id, user_id)` |
| idx_team_split_entries_batch | btree | {batch_id} | não | sim |  | `CREATE INDEX idx_team_split_entries_batch ON public.campaign_team_split_entries USING btree (batch_id)` |
| idx_team_split_entries_campaign | btree | {campaign_id,created_at} | não | sim |  | `CREATE INDEX idx_team_split_entries_campaign ON public.campaign_team_split_entries USING btree (campaign_id, created_at DESC)` |
| idx_team_split_entries_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_team_split_entries_user ON public.campaign_team_split_entries USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `campaign_team_split_entries_admin_all`

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
