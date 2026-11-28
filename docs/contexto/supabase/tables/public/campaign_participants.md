# public.campaign_participants

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `target_adjusted` | `numeric(14,2)` | não | `0` |  |  |
| 5 | `progress` | `numeric(14,2)` | não | `0` |  |  |
| 6 | `progress_percent` | `numeric(6,2)` | não | `0` |  |  |
| 7 | `accepted_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `declined_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `xp_earned` | `integer` | não | `0` |  |  |
| 11 | `coins_earned` | `integer` | não | `0` |  |  |
| 12 | `rank_position` | `integer` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_participants_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_participants_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_participants_unique | UNIQUE | `UNIQUE (campaign_id, user_id)` |  |  | sim |
| campaign_participants_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_participants_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_participants_pkey ON public.campaign_participants USING btree (id)` |
| campaign_participants_unique | btree | {campaign_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_participants_unique ON public.campaign_participants USING btree (campaign_id, user_id)` |
| idx_campaign_participants_campaign | btree | {campaign_id,rank_position} | não | sim |  | `CREATE INDEX idx_campaign_participants_campaign ON public.campaign_participants USING btree (campaign_id, rank_position)` |
| idx_campaign_participants_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_campaign_participants_user ON public.campaign_participants USING btree (user_id)` |


## Policies (RLS)

### `participants_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `participants_insert_self_or_admin`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `participants_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |

### `participants_update_self_or_admin`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_campaign_participants_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
