# public.user_positions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.leaderboard_cache |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `position_id` | `uuid` | não |  |  |  |
| 4 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `is_primary` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_positions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_positions_position_id_fkey | FOREIGN KEY | `FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_positions_user_id_position_id_key | UNIQUE | `UNIQUE (user_id, position_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_positions_position_id | btree | {position_id} | não | sim |  | `CREATE INDEX idx_user_positions_position_id ON public.user_positions USING btree (position_id)` |
| user_positions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_positions_pkey ON public.user_positions USING btree (id)` |
| user_positions_user_id_position_id_key | btree | {user_id,position_id} | sim | sim |  | `CREATE UNIQUE INDEX user_positions_user_id_position_id_key ON public.user_positions USING btree (user_id, position_id)` |


## Policies (RLS)

### `Admins can manage user positions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can view team positions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can view own positions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
