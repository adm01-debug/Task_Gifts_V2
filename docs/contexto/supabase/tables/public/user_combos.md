# public.user_combos

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
| 3 | `combo_date` | `date` | não | `CURRENT_DATE` |  |  |
| 4 | `actions_count` | `integer` | não | `0` |  |  |
| 5 | `current_multiplier` | `numeric(3,1)` | não | `1.0` |  |  |
| 6 | `max_multiplier_reached` | `numeric(3,1)` | não | `1.0` |  |  |
| 7 | `total_bonus_xp` | `integer` | não | `0` |  |  |
| 8 | `last_action_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_combos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_combos_user_id_combo_date_key | UNIQUE | `UNIQUE (user_id, combo_date)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_combos_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_combos_pkey ON public.user_combos USING btree (id)` |
| user_combos_user_id_combo_date_key | btree | {user_id,combo_date} | sim | sim |  | `CREATE UNIQUE INDEX user_combos_user_id_combo_date_key ON public.user_combos USING btree (user_id, combo_date)` |


## Policies (RLS)

### `Managers can view team combos`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can insert own combos`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own combos`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own combos`

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
| update_user_combos_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
