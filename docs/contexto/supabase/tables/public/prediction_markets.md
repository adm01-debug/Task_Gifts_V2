# public.prediction_markets

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
| 4 | `status` | `text` | não | `'draft'::text` |  |  |
| 5 | `min_stake` | `integer` | não | `10` |  |  |
| 6 | `max_stake_per_user` | `integer` | não | `0` |  |  |
| 7 | `rake_bps` | `integer` | não | `0` |  |  |
| 8 | `locks_at` | `timestamp with time zone` | não |  |  |  |
| 9 | `resolves_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `winning_option_id` | `uuid` | sim |  |  |  |
| 11 | `total_pool` | `integer` | não | `0` |  |  |
| 12 | `rake_collected` | `integer` | não | `0` |  |  |
| 13 | `settled_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `settled_by` | `uuid` | sim |  |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prediction_markets_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| prediction_markets_max_stake_per_user_check | CHECK | `CHECK (max_stake_per_user >= 0)` |  |  | sim |
| prediction_markets_min_stake_check | CHECK | `CHECK (min_stake >= 1)` |  |  | sim |
| prediction_markets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prediction_markets_rake_bps_check | CHECK | `CHECK (rake_bps >= 0 AND rake_bps <= 2000)` |  |  | sim |
| prediction_markets_rake_collected_check | CHECK | `CHECK (rake_collected >= 0)` |  |  | sim |
| prediction_markets_settled_by_fkey | FOREIGN KEY | `FOREIGN KEY (settled_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| prediction_markets_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'locked'::text, 'settled'::text, 'voided'::text]))` |  |  | sim |
| prediction_markets_total_pool_check | CHECK | `CHECK (total_pool >= 0)` |  |  | sim |
| prediction_markets_winning_option_fk | FOREIGN KEY | `FOREIGN KEY (winning_option_id) REFERENCES prediction_options(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.prediction_admin_events | prediction_admin_events_market_id_fkey | {market_id} | CASCADE |
| public.prediction_options | prediction_options_market_id_fkey | {market_id} | CASCADE |
| public.prediction_stakes | prediction_stakes_market_id_fkey | {market_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_prediction_markets_status | btree | {status,locks_at} | não | sim |  | `CREATE INDEX idx_prediction_markets_status ON public.prediction_markets USING btree (status, locks_at DESC)` |
| prediction_markets_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX prediction_markets_pkey ON public.prediction_markets USING btree (id)` |


## Policies (RLS)

### `prediction_markets_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `prediction_markets_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| prediction_markets_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_log_prediction_settlement | AFTER | UPDATE | ROW | enabled | public.log_prediction_settlement |


## Grants

_nenhum_
