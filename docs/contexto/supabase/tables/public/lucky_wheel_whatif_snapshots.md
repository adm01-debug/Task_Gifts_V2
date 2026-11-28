# public.lucky_wheel_whatif_snapshots

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
| 2 | `current_window_start` | `date` | não |  |  |  |
| 3 | `current_window_end` | `date` | não |  |  |  |
| 4 | `previous_window_start` | `date` | não |  |  |  |
| 5 | `previous_window_end` | `date` | não |  |  |  |
| 6 | `active_budget` | `numeric` | não | `0` |  |  |
| 7 | `current_coins_per_spin` | `numeric` | não | `0` |  |  |
| 8 | `baseline_alert_count` | `integer` | não | `0` |  |  |
| 9 | `break_even_budget` | `numeric` | sim |  |  |  |
| 10 | `scenarios` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 11 | `signature` | `text` | não |  |  |  |
| 12 | `created_by` | `uuid` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_whatif_current_window_order | CHECK | `CHECK (current_window_end >= current_window_start)` |  |  | sim |
| lucky_wheel_whatif_previous_window_order | CHECK | `CHECK (previous_window_end >= previous_window_start)` |  |  | sim |
| lucky_wheel_whatif_scenarios_is_array | CHECK | `CHECK (jsonb_typeof(scenarios) = 'array'::text)` |  |  | sim |
| lucky_wheel_whatif_signature_key | UNIQUE | `UNIQUE (signature)` |  |  | sim |
| lucky_wheel_whatif_snapshots_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lucky_wheel_whatif_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lucky_wheel_whatif_snapshots | btree | {current_window_start} | não | sim |  | `CREATE INDEX idx_lucky_wheel_whatif_snapshots ON public.lucky_wheel_whatif_snapshots USING btree (current_window_start DESC)` |
| idx_lucky_wheel_whatif_window | btree | {current_window_end,created_at} | não | sim |  | `CREATE INDEX idx_lucky_wheel_whatif_window ON public.lucky_wheel_whatif_snapshots USING btree (current_window_end DESC, created_at DESC)` |
| lucky_wheel_whatif_signature_key | btree | {signature} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_whatif_signature_key ON public.lucky_wheel_whatif_snapshots USING btree (signature)` |
| lucky_wheel_whatif_snapshots_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_whatif_snapshots_pkey ON public.lucky_wheel_whatif_snapshots USING btree (id)` |


## Policies (RLS)

### `lucky_wheel_whatif_snapshots_admin_all`

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
| lucky_wheel_whatif_snapshots_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
