# public.campaign_progress_events

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
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `delta` | `numeric(14,2)` | não |  |  |  |
| 5 | `previous_value` | `numeric(14,2)` | não | `0` |  |  |
| 6 | `new_value` | `numeric(14,2)` | não | `0` |  |  |
| 7 | `source` | `text` | não | `'manual'::text` |  |  |
| 8 | `reference_id` | `text` | sim |  |  |  |
| 9 | `note` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_progress_events_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_progress_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_progress_events_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_progress_events_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX campaign_progress_events_pkey ON public.campaign_progress_events USING btree (id)` |
| idx_campaign_progress_events_campaign | btree | {campaign_id,created_at} | não | sim |  | `CREATE INDEX idx_campaign_progress_events_campaign ON public.campaign_progress_events USING btree (campaign_id, created_at DESC)` |
| idx_campaign_progress_events_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_campaign_progress_events_user ON public.campaign_progress_events USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `campaign_events_insert_self_or_admin`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `campaign_events_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
