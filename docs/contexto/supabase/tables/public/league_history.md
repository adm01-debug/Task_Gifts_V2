# public.league_history

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `from_league_id` | `uuid` | sim |  |  |  |
| 4 | `to_league_id` | `uuid` | não |  |  |  |
| 5 | `change_type` | `text` | não |  |  |  |
| 6 | `weekly_xp` | `integer` | não | `0` |  |  |
| 7 | `week_date` | `date` | não |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| league_history_change_type_check | CHECK | `CHECK (change_type = ANY (ARRAY['promotion'::text, 'demotion'::text, 'initial'::text]))` |  |  | sim |
| league_history_from_league_id_fkey | FOREIGN KEY | `FOREIGN KEY (from_league_id) REFERENCES leagues(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| league_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| league_history_to_league_id_fkey | FOREIGN KEY | `FOREIGN KEY (to_league_id) REFERENCES leagues(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| league_history_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_league_history_from_league_id | btree | {from_league_id} | não | sim |  | `CREATE INDEX idx_league_history_from_league_id ON public.league_history USING btree (from_league_id)` |
| idx_league_history_to_league_id | btree | {to_league_id} | não | sim |  | `CREATE INDEX idx_league_history_to_league_id ON public.league_history USING btree (to_league_id)` |
| idx_league_history_user_created | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_league_history_user_created ON public.league_history USING btree (user_id, created_at DESC)` |
| league_history_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX league_history_pkey ON public.league_history USING btree (id)` |


## Policies (RLS)

### `Authenticated insert league history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Everyone can view league history`

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

_nenhum_
