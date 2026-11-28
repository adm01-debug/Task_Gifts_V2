# public.lucky_wheel_settings

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
| 1 | `id` | `boolean` | não | `true` |  |  |
| 2 | `coins_per_spin_budget` | `numeric` | não | `30` |  |  |
| 3 | `updated_by` | `uuid` | sim |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_settings_coins_per_spin_budget_check | CHECK | `CHECK (coins_per_spin_budget > 0::numeric AND coins_per_spin_budget <= 10000::numeric)` |  |  | sim |
| lucky_wheel_settings_id_check | CHECK | `CHECK (id = true)` |  |  | sim |
| lucky_wheel_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lucky_wheel_settings_updated_by_fkey | FOREIGN KEY | `FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lucky_wheel_settings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_settings_pkey ON public.lucky_wheel_settings USING btree (id)` |


## Policies (RLS)

### `lucky_wheel_settings_admin_all`

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
| lucky_wheel_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_lucky_wheel_budget_audit | AFTER | INSERT OR UPDATE | ROW | enabled | public.log_lucky_wheel_budget_change |


## Grants

_nenhum_
