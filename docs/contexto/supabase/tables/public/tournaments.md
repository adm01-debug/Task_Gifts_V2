# public.tournaments

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `status` | `text` | não | `'draft'::text` |  |  |
| 5 | `max_participants` | `integer` | não | `32` |  |  |
| 6 | `bracket_size` | `integer` | sim |  |  |  |
| 7 | `rounds` | `integer` | sim |  |  |  |
| 8 | `registration_opens_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `registration_closes_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `coins_per_win` | `integer` | não | `10` |  |  |
| 11 | `xp_per_win` | `integer` | não | `25` |  |  |
| 12 | `coins_champion` | `integer` | não | `150` |  |  |
| 13 | `xp_champion` | `integer` | não | `400` |  |  |
| 14 | `coins_runner_up` | `integer` | não | `60` |  |  |
| 15 | `xp_runner_up` | `integer` | não | `150` |  |  |
| 16 | `champion_user_id` | `uuid` | sim |  |  |  |
| 17 | `runner_up_user_id` | `uuid` | sim |  |  |  |
| 18 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `finished_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `created_by` | `uuid` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tournaments_bracket_size_check | CHECK | `CHECK (bracket_size IS NULL OR bracket_size >= 2 AND bracket_size <= 256)` |  |  | sim |
| tournaments_champion_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (champion_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tournaments_coins_champion_check | CHECK | `CHECK (coins_champion >= 0 AND coins_champion <= 5000)` |  |  | sim |
| tournaments_coins_per_win_check | CHECK | `CHECK (coins_per_win >= 0 AND coins_per_win <= 500)` |  |  | sim |
| tournaments_coins_runner_up_check | CHECK | `CHECK (coins_runner_up >= 0 AND coins_runner_up <= 5000)` |  |  | sim |
| tournaments_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tournaments_description_check | CHECK | `CHECK (description IS NULL OR char_length(description) <= 1000)` |  |  | sim |
| tournaments_max_participants_check | CHECK | `CHECK (max_participants >= 2 AND max_participants <= 256)` |  |  | sim |
| tournaments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tournaments_rounds_check | CHECK | `CHECK (rounds IS NULL OR rounds >= 1 AND rounds <= 8)` |  |  | sim |
| tournaments_runner_up_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (runner_up_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tournaments_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'registration'::text, 'running'::text, 'finished'::text, 'cancelled'::text]))` |  |  | sim |
| tournaments_title_check | CHECK | `CHECK (char_length(btrim(title)) >= 3 AND char_length(btrim(title)) <= 120)` |  |  | sim |
| tournaments_xp_champion_check | CHECK | `CHECK (xp_champion >= 0 AND xp_champion <= 10000)` |  |  | sim |
| tournaments_xp_per_win_check | CHECK | `CHECK (xp_per_win >= 0 AND xp_per_win <= 1000)` |  |  | sim |
| tournaments_xp_runner_up_check | CHECK | `CHECK (xp_runner_up >= 0 AND xp_runner_up <= 10000)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.tournament_matches | tournament_matches_tournament_id_fkey | {tournament_id} | CASCADE |
| public.tournament_participants | tournament_participants_tournament_id_fkey | {tournament_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tournaments_status | btree | {status,registration_opens_at} | não | sim |  | `CREATE INDEX idx_tournaments_status ON public.tournaments USING btree (status, registration_opens_at DESC)` |
| tournaments_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX tournaments_pkey ON public.tournaments USING btree (id)` |


## Policies (RLS)

### `tournaments_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `tournaments_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tournaments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
