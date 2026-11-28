# public.mentorship_pairs

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
| 2 | `mentor_id` | `uuid` | não |  |  |  |
| 3 | `apprentice_id` | `uuid` | não |  |  |  |
| 4 | `status` | `text` | não | `'active'::text` |  |  |
| 5 | `started_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `total_xp_earned` | `integer` | não | `0` |  |  |
| 8 | `total_missions_completed` | `integer` | não | `0` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mentorship_pairs_different_users | CHECK | `CHECK (mentor_id <> apprentice_id)` |  |  | sim |
| mentorship_pairs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mentorship_pairs_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |
| mentorship_pairs_unique | UNIQUE | `UNIQUE (mentor_id, apprentice_id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.mentorship_mission_progress | mentorship_mission_progress_pair_id_fkey | {pair_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| mentorship_pairs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX mentorship_pairs_pkey ON public.mentorship_pairs USING btree (id)` |
| mentorship_pairs_unique | btree | {mentor_id,apprentice_id} | sim | sim |  | `CREATE UNIQUE INDEX mentorship_pairs_unique ON public.mentorship_pairs USING btree (mentor_id, apprentice_id)` |


## Policies (RLS)

### `Users can create mentorship pairs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id))` |

### `Users can update their own pairs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id))` |
| WITH CHECK |  |

### `Users can view their own mentorship pairs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_mentorship_pairs_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
