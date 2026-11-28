# public.tournament_participants

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
| 2 | `tournament_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `seed` | `integer` | sim |  |  |  |
| 5 | `wins` | `integer` | não | `0` |  |  |
| 6 | `eliminated_round` | `integer` | sim |  |  |  |
| 7 | `placement` | `text` | sim |  |  |  |
| 8 | `coins_awarded` | `integer` | não | `0` |  |  |
| 9 | `xp_awarded` | `integer` | não | `0` |  |  |
| 10 | `rewarded_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tournament_participants_coins_awarded_check | CHECK | `CHECK (coins_awarded >= 0)` |  |  | sim |
| tournament_participants_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tournament_participants_placement_check | CHECK | `CHECK (placement IS NULL OR (placement = ANY (ARRAY['champion'::text, 'runner_up'::text, 'eliminated'::text])))` |  |  | sim |
| tournament_participants_seed_check | CHECK | `CHECK (seed IS NULL OR seed >= 1 AND seed <= 256)` |  |  | sim |
| tournament_participants_tournament_id_fkey | FOREIGN KEY | `FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tournament_participants_tournament_id_seed_key | UNIQUE | `UNIQUE (tournament_id, seed)` |  |  | sim |
| tournament_participants_unique | UNIQUE | `UNIQUE (tournament_id, user_id)` |  |  | sim |
| tournament_participants_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tournament_participants_wins_check | CHECK | `CHECK (wins >= 0)` |  |  | sim |
| tournament_participants_xp_awarded_check | CHECK | `CHECK (xp_awarded >= 0)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.tournament_matches | tournament_matches_away_participant_id_fkey | {away_participant_id} | SET NULL |
| public.tournament_matches | tournament_matches_home_participant_id_fkey | {home_participant_id} | SET NULL |
| public.tournament_matches | tournament_matches_winner_participant_id_fkey | {winner_participant_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tournament_participants | btree | {tournament_id,seed} | não | sim |  | `CREATE INDEX idx_tournament_participants ON public.tournament_participants USING btree (tournament_id, seed)` |
| idx_tournament_participants_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_tournament_participants_user ON public.tournament_participants USING btree (user_id)` |
| tournament_participants_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX tournament_participants_pkey ON public.tournament_participants USING btree (id)` |
| tournament_participants_tournament_id_seed_key | btree | {tournament_id,seed} | sim | sim |  | `CREATE UNIQUE INDEX tournament_participants_tournament_id_seed_key ON public.tournament_participants USING btree (tournament_id, seed)` |
| tournament_participants_unique | btree | {tournament_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX tournament_participants_unique ON public.tournament_participants USING btree (tournament_id, user_id)` |


## Policies (RLS)

### `tournament_participants_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `tournament_participants_user_select`

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
| tournament_participants_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
