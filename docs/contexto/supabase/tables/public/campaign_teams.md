# public.campaign_teams

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
| 3 | `name` | `text` | não |  |  |  |
| 4 | `color` | `text` | sim |  |  |  |
| 5 | `department_id` | `uuid` | sim |  |  |  |
| 6 | `target_team` | `numeric` | não | `0` |  |  |
| 7 | `progress` | `numeric` | não | `0` |  |  |
| 8 | `progress_percent` | `numeric` | não | `0` |  |  |
| 9 | `rank_position` | `integer` | sim |  |  |  |
| 10 | `members_count` | `integer` | não | `0` |  |  |
| 11 | `awarded_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `xp_awarded` | `integer` | não | `0` |  |  |
| 13 | `coins_awarded` | `integer` | não | `0` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_teams_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_teams_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| campaign_teams_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| campaign_teams_name_unique | UNIQUE | `UNIQUE (campaign_id, name)` |  |  | sim |
| campaign_teams_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_teams_target_nonneg | CHECK | `CHECK (target_team >= 0::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.campaign_team_members | campaign_team_members_team_id_fkey | {team_id} | CASCADE |
| public.campaign_team_split_entries | campaign_team_split_entries_team_id_fkey | {team_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_teams_name_unique | btree | {campaign_id,name} | sim | sim |  | `CREATE UNIQUE INDEX campaign_teams_name_unique ON public.campaign_teams USING btree (campaign_id, name)` |
| campaign_teams_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_teams_pkey ON public.campaign_teams USING btree (id)` |
| idx_campaign_teams | btree | {campaign_id,rank_position} | não | sim |  | `CREATE INDEX idx_campaign_teams ON public.campaign_teams USING btree (campaign_id, rank_position)` |
| idx_campaign_teams_campaign | btree | {campaign_id} | não | sim |  | `CREATE INDEX idx_campaign_teams_campaign ON public.campaign_teams USING btree (campaign_id)` |
| idx_campaign_teams_department | btree | {department_id} | não | sim |  | `CREATE INDEX idx_campaign_teams_department ON public.campaign_teams USING btree (department_id)` |


## Policies (RLS)

### `campaign_teams_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `campaign_teams_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| campaign_teams_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
