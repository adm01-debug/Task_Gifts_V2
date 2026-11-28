# public.mentorship_missions

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
| 4 | `icon` | `text` | não | `'🎯'::text` |  |  |
| 5 | `xp_reward` | `integer` | não | `50` |  |  |
| 6 | `coin_reward` | `integer` | não | `25` |  |  |
| 7 | `mission_type` | `text` | não | `'collaborative'::text` |  |  |
| 8 | `difficulty` | `text` | não | `'medium'::text` |  |  |
| 9 | `order_index` | `integer` | não | `0` |  |  |
| 10 | `is_active` | `boolean` | não | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mentorship_missions_difficulty_check | CHECK | `CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))` |  |  | sim |
| mentorship_missions_mission_type_check | CHECK | `CHECK (mission_type = ANY (ARRAY['mentor_only'::text, 'apprentice_only'::text, 'collaborative'::text]))` |  |  | sim |
| mentorship_missions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.mentorship_mission_progress | mentorship_mission_progress_mission_id_fkey | {mission_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| mentorship_missions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX mentorship_missions_pkey ON public.mentorship_missions USING btree (id)` |


## Policies (RLS)

### `Admins can manage missions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active missions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
