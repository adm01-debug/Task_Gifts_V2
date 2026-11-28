# public.onboarding_progress

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
| 3 | `current_step` | `integer` | não | `0` |  |  |
| 4 | `completed_steps` | `text[]` | sim | `'{}'::text[]` |  |  |
| 5 | `rewards_claimed` | `text[]` | sim | `'{}'::text[]` |  |  |
| 6 | `started_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| onboarding_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| onboarding_progress_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| onboarding_progress_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX onboarding_progress_pkey ON public.onboarding_progress USING btree (id)` |
| onboarding_progress_user_id_key | btree | {user_id} | sim | sim |  | `CREATE UNIQUE INDEX onboarding_progress_user_id_key ON public.onboarding_progress USING btree (user_id)` |


## Policies (RLS)

### `Users can insert own onboarding`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own onboarding`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own onboarding`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_onboarding_progress_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
