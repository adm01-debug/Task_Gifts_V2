# public.lucky_wheel_payout_snapshots

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `snapshot_date` | `date` | não |  |  |  |
| 3 | `spins` | `integer` | não | `0` |  |  |
| 4 | `unique_users` | `integer` | não | `0` |  |  |
| 5 | `coins_paid` | `integer` | não | `0` |  |  |
| 6 | `xp_paid` | `integer` | não | `0` |  |  |
| 7 | `projected_coins` | `numeric` | não | `0` |  |  |
| 8 | `projected_xp` | `numeric` | não | `0` |  |  |
| 9 | `chi_square` | `numeric` | não | `0` |  |  |
| 10 | `degrees_of_freedom` | `integer` | não | `0` |  |  |
| 11 | `duplicate_spins` | `integer` | não | `0` |  |  |
| 12 | `unconfigured_spins` | `integer` | não | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_payout_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lucky_wheel_payout_snapshots_snapshot_date_key | UNIQUE | `UNIQUE (snapshot_date)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lucky_wheel_payout_snapshots_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_payout_snapshots_pkey ON public.lucky_wheel_payout_snapshots USING btree (id)` |
| lucky_wheel_payout_snapshots_snapshot_date_key | btree | {snapshot_date} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_payout_snapshots_snapshot_date_key ON public.lucky_wheel_payout_snapshots USING btree (snapshot_date)` |


## Policies (RLS)

### `lucky_wheel_payout_snapshots_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| lucky_wheel_payout_snapshots_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
