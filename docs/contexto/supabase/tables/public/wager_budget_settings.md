# public.wager_budget_settings

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
| 1 | `id` | `boolean` | não | `true` |  |  |
| 2 | `monthly_coin_budget` | `integer` | não | `20000` |  |  |
| 3 | `expected_players` | `integer` | não | `30` |  |  |
| 4 | `updated_by` | `uuid` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| wager_budget_settings_expected_players_check | CHECK | `CHECK (expected_players >= 0 AND expected_players <= 100000)` |  |  | sim |
| wager_budget_settings_id_check | CHECK | `CHECK (id = true)` |  |  | sim |
| wager_budget_settings_monthly_coin_budget_check | CHECK | `CHECK (monthly_coin_budget >= 0 AND monthly_coin_budget <= 10000000)` |  |  | sim |
| wager_budget_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| wager_budget_settings_updated_by_fkey | FOREIGN KEY | `FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| wager_budget_settings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX wager_budget_settings_pkey ON public.wager_budget_settings USING btree (id)` |


## Policies (RLS)

### `wager_budget_settings_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `wager_budget_settings_manager_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'manager'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| wager_budget_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
