# public.lucky_wheel_spins

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `prize_id` | `uuid` | sim |  |  |  |
| 4 | `prize_label` | `text` | não |  |  |  |
| 5 | `prize_type` | `text` | não |  |  |  |
| 6 | `amount` | `integer` | não | `0` |  |  |
| 7 | `spin_date` | `date` | não | `((now() AT TIME ZONE 'America/Sao_Paulo'::text))::date` |  |  |
| 8 | `dedupe_key` | `text` | não |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_spins_dedupe_key_unique | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| lucky_wheel_spins_one_per_day | UNIQUE | `UNIQUE (user_id, spin_date)` |  |  | sim |
| lucky_wheel_spins_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lucky_wheel_spins_prize_id_fkey | FOREIGN KEY | `FOREIGN KEY (prize_id) REFERENCES lucky_wheel_prizes(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lucky_wheel_spins_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lucky_wheel_spins_user | btree | {user_id,spin_date} | não | sim |  | `CREATE INDEX idx_lucky_wheel_spins_user ON public.lucky_wheel_spins USING btree (user_id, spin_date DESC)` |
| lucky_wheel_spins_dedupe_key_idx | btree | {user_id,dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_spins_dedupe_key_idx ON public.lucky_wheel_spins USING btree (user_id, dedupe_key)` |
| lucky_wheel_spins_dedupe_key_unique | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_spins_dedupe_key_unique ON public.lucky_wheel_spins USING btree (dedupe_key)` |
| lucky_wheel_spins_one_per_day | btree | {user_id,spin_date} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_spins_one_per_day ON public.lucky_wheel_spins USING btree (user_id, spin_date)` |
| lucky_wheel_spins_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_spins_pkey ON public.lucky_wheel_spins USING btree (id)` |
| lucky_wheel_spins_user_created_idx | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX lucky_wheel_spins_user_created_idx ON public.lucky_wheel_spins USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `lucky_wheel_spins_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `lucky_wheel_spins_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
