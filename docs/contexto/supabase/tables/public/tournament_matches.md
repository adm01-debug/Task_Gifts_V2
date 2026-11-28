# public.tournament_matches

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
| 3 | `round` | `integer` | não |  |  |  |
| 4 | `slot` | `integer` | não |  |  |  |
| 5 | `home_participant_id` | `uuid` | sim |  |  |  |
| 6 | `away_participant_id` | `uuid` | sim |  |  |  |
| 7 | `home_score` | `integer` | não | `0` |  |  |
| 8 | `away_score` | `integer` | não | `0` |  |  |
| 9 | `winner_participant_id` | `uuid` | sim |  |  |  |
| 10 | `status` | `text` | não | `'pending'::text` |  |  |
| 11 | `decided_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tournament_matches_away_participant_id_fkey | FOREIGN KEY | `FOREIGN KEY (away_participant_id) REFERENCES tournament_participants(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tournament_matches_away_score_check | CHECK | `CHECK (away_score >= 0)` |  |  | sim |
| tournament_matches_home_participant_id_fkey | FOREIGN KEY | `FOREIGN KEY (home_participant_id) REFERENCES tournament_participants(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tournament_matches_home_score_check | CHECK | `CHECK (home_score >= 0)` |  |  | sim |
| tournament_matches_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tournament_matches_round_check | CHECK | `CHECK (round >= 1 AND round <= 8)` |  |  | sim |
| tournament_matches_slot_check | CHECK | `CHECK (slot >= 0)` |  |  | sim |
| tournament_matches_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'ready'::text, 'active'::text, 'decided'::text, 'bye'::text]))` |  |  | sim |
| tournament_matches_tournament_id_fkey | FOREIGN KEY | `FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tournament_matches_unique | UNIQUE | `UNIQUE (tournament_id, round, slot)` |  |  | sim |
| tournament_matches_winner_participant_id_fkey | FOREIGN KEY | `FOREIGN KEY (winner_participant_id) REFERENCES tournament_participants(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tournament_matches | btree | {tournament_id,round} | não | sim |  | `CREATE INDEX idx_tournament_matches ON public.tournament_matches USING btree (tournament_id, round)` |
| idx_tournament_matches_tid | btree | {tournament_id,round,slot} | não | sim |  | `CREATE INDEX idx_tournament_matches_tid ON public.tournament_matches USING btree (tournament_id, round, slot)` |
| tournament_matches_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX tournament_matches_pkey ON public.tournament_matches USING btree (id)` |
| tournament_matches_unique | btree | {tournament_id,round,slot} | sim | sim |  | `CREATE UNIQUE INDEX tournament_matches_unique ON public.tournament_matches USING btree (tournament_id, round, slot)` |


## Policies (RLS)

### `tournament_matches_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `tournament_matches_user_select`

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
| tournament_matches_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
