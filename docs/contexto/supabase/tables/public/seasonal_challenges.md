# public.seasonal_challenges

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
| 2 | `event_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `icon` | `text` | não | `'🎯'::text` |  |  |
| 6 | `target_value` | `integer` | não | `1` |  |  |
| 7 | `metric_key` | `text` | não |  |  |  |
| 8 | `xp_reward` | `integer` | não | `100` |  |  |
| 9 | `coin_reward` | `integer` | não | `50` |  |  |
| 10 | `badge_name` | `text` | sim |  |  |  |
| 11 | `badge_icon` | `text` | sim |  |  |  |
| 12 | `order_index` | `integer` | não | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| seasonal_challenges_event_id_fkey | FOREIGN KEY | `FOREIGN KEY (event_id) REFERENCES seasonal_events(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| seasonal_challenges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_seasonal_progress | user_seasonal_progress_challenge_id_fkey | {challenge_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_seasonal_challenges_event_id | btree | {event_id} | não | sim |  | `CREATE INDEX idx_seasonal_challenges_event_id ON public.seasonal_challenges USING btree (event_id)` |
| seasonal_challenges_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX seasonal_challenges_pkey ON public.seasonal_challenges USING btree (id)` |


## Policies (RLS)

### `Admins can manage challenges`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view challenges`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM seasonal_events e   WHERE ((e.id = seasonal_challenges.event_id) AND ((e.is_active = true) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
