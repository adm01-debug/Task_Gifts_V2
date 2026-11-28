# public.mentorship_mission_progress

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
| 2 | `pair_id` | `uuid` | não |  |  |  |
| 3 | `mission_id` | `uuid` | não |  |  |  |
| 4 | `completed_by_mentor` | `boolean` | não | `false` |  |  |
| 5 | `completed_by_apprentice` | `boolean` | não | `false` |  |  |
| 6 | `mentor_completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `apprentice_completed_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `rewards_claimed` | `boolean` | não | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mentorship_mission_progress_mission_id_fkey | FOREIGN KEY | `FOREIGN KEY (mission_id) REFERENCES mentorship_missions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| mentorship_mission_progress_pair_id_fkey | FOREIGN KEY | `FOREIGN KEY (pair_id) REFERENCES mentorship_pairs(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| mentorship_mission_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mentorship_progress_unique | UNIQUE | `UNIQUE (pair_id, mission_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_mentorship_mission_progress_mission_id | btree | {mission_id} | não | sim |  | `CREATE INDEX idx_mentorship_mission_progress_mission_id ON public.mentorship_mission_progress USING btree (mission_id)` |
| mentorship_mission_progress_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX mentorship_mission_progress_pkey ON public.mentorship_mission_progress USING btree (id)` |
| mentorship_progress_unique | btree | {pair_id,mission_id} | sim | sim |  | `CREATE UNIQUE INDEX mentorship_progress_unique ON public.mentorship_mission_progress USING btree (pair_id, mission_id)` |


## Policies (RLS)

### `Users can insert progress for their pairs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM mentorship_pairs mp   WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid())))))` |

### `Users can update their pair progress`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM mentorship_pairs mp   WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid())))))` |
| WITH CHECK |  |

### `Users can view their pair progress`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM mentorship_pairs mp   WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid())))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_mentorship_mission_progress_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
