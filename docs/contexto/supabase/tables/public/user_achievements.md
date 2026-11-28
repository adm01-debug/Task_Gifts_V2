# public.user_achievements

> Registro de conquistas desbloqueadas por usuario. Tabela de relacionamento com timestamp de unlock.

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
| 3 | `achievement_id` | `uuid` | não |  |  |  |
| 4 | `unlocked_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_achievements_achievement_id_fkey | FOREIGN KEY | `FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_achievements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_achievements_user_id_achievement_id_key | UNIQUE | `UNIQUE (user_id, achievement_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_achievements_achievement_id | btree | {achievement_id} | não | sim |  | `CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id)` |
| user_achievements_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_achievements_pkey ON public.user_achievements USING btree (id)` |
| user_achievements_user_id_achievement_id_key | btree | {user_id,achievement_id} | sim | sim |  | `CREATE UNIQUE INDEX user_achievements_user_id_achievement_id_key ON public.user_achievements USING btree (user_id, achievement_id)` |


## Policies (RLS)

### `Managers can view team achievements`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `System can insert achievements`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own achievements`

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

_nenhum_
