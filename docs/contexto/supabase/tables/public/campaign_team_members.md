# public.campaign_team_members

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
| 2 | `team_id` | `uuid` | não |  |  |  |
| 3 | `campaign_id` | `uuid` | não |  |  |  |
| 4 | `user_id` | `uuid` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_team_members_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_team_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_team_members_team_id_fkey | FOREIGN KEY | `FOREIGN KEY (team_id) REFERENCES campaign_teams(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_team_members_unique_per_campaign | UNIQUE | `UNIQUE (campaign_id, user_id)` |  |  | sim |
| campaign_team_members_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_team_members_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_team_members_pkey ON public.campaign_team_members USING btree (id)` |
| campaign_team_members_unique_per_campaign | btree | {campaign_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_team_members_unique_per_campaign ON public.campaign_team_members USING btree (campaign_id, user_id)` |
| idx_campaign_team_members_team | btree | {team_id} | não | sim |  | `CREATE INDEX idx_campaign_team_members_team ON public.campaign_team_members USING btree (team_id)` |
| idx_campaign_team_members_user | btree | {campaign_id,user_id} | não | sim |  | `CREATE INDEX idx_campaign_team_members_user ON public.campaign_team_members USING btree (campaign_id, user_id)` |


## Policies (RLS)

### `campaign_team_members_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `campaign_team_members_select`

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
| trg_campaign_team_members_consistency | BEFORE | INSERT OR UPDATE | ROW | enabled | public.enforce_campaign_team_consistency |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
