# public.user_seasonal_progress

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `challenge_id` | `uuid` | não |  |  |  |
| 4 | `current_value` | `integer` | não | `0` |  |  |
| 5 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `claimed` | `boolean` | não | `false` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_seasonal_progress_challenge_id_fkey | FOREIGN KEY | `FOREIGN KEY (challenge_id) REFERENCES seasonal_challenges(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_seasonal_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_seasonal_progress_user_id_challenge_id_key | UNIQUE | `UNIQUE (user_id, challenge_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_seasonal_progress_challenge_id | btree | {challenge_id} | não | sim |  | `CREATE INDEX idx_user_seasonal_progress_challenge_id ON public.user_seasonal_progress USING btree (challenge_id)` |
| user_seasonal_progress_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_seasonal_progress_pkey ON public.user_seasonal_progress USING btree (id)` |
| user_seasonal_progress_user_id_challenge_id_key | btree | {user_id,challenge_id} | sim | sim |  | `CREATE UNIQUE INDEX user_seasonal_progress_user_id_challenge_id_key ON public.user_seasonal_progress USING btree (user_id, challenge_id)` |


## Policies (RLS)

### `Managers can view all progress`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can insert own progress`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own progress`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own progress`

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
