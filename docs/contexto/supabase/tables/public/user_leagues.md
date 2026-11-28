# public.user_leagues

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `league_id` | `uuid` | não |  |  |  |
| 4 | `week_start` | `date` | não | `(date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date` |  |  |
| 5 | `weekly_xp` | `integer` | não | `0` |  |  |
| 6 | `rank_in_league` | `integer` | sim |  |  |  |
| 7 | `promoted_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `demoted_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_leagues_league_id_fkey | FOREIGN KEY | `FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| user_leagues_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_leagues_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_leagues_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_leagues_league_id | btree | {league_id} | não | sim |  | `CREATE INDEX idx_user_leagues_league_id ON public.user_leagues USING btree (league_id)` |
| user_leagues_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_leagues_pkey ON public.user_leagues USING btree (id)` |
| user_leagues_user_id_key | btree | {user_id} | sim | sim |  | `CREATE UNIQUE INDEX user_leagues_user_id_key ON public.user_leagues USING btree (user_id)` |


## Policies (RLS)

### `Everyone can view user leagues`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |

### `System can manage user leagues`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can insert own league`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_user_leagues_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
