# public.department_wars

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
| 5 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 7 | `fairness_alpha` | `numeric` | não | `0.5` |  |  |
| 8 | `per_user_cap` | `integer` | não | `0` |  |  |
| 9 | `participation_bonus` | `numeric` | não | `0.2` |  |  |
| 10 | `coins_pool` | `integer` | não | `0` |  |  |
| 11 | `xp_pool` | `integer` | não | `0` |  |  |
| 12 | `placement_shares` | `jsonb` | não | `'[0.5, 0.3, 0.2]'::jsonb` |  |  |
| 13 | `per_member_coins_cap` | `integer` | não | `0` |  |  |
| 14 | `settled_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_by` | `uuid` | sim | `auth.uid()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_wars_coins_pool_check | CHECK | `CHECK (coins_pool >= 0)` |  |  | sim |
| department_wars_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| department_wars_fairness_alpha_check | CHECK | `CHECK (fairness_alpha >= 0::numeric AND fairness_alpha <= 1::numeric)` |  |  | sim |
| department_wars_participation_bonus_check | CHECK | `CHECK (participation_bonus >= 0::numeric AND participation_bonus <= 1::numeric)` |  |  | sim |
| department_wars_per_member_coins_cap_check | CHECK | `CHECK (per_member_coins_cap >= 0)` |  |  | sim |
| department_wars_per_user_cap_check | CHECK | `CHECK (per_user_cap >= 0)` |  |  | sim |
| department_wars_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| department_wars_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'running'::text, 'finished'::text, 'cancelled'::text]))` |  |  | sim |
| department_wars_xp_pool_check | CHECK | `CHECK (xp_pool >= 0)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.department_war_contributions | department_war_contributions_war_id_fkey | {war_id} | CASCADE |
| public.department_war_departments | department_war_departments_war_id_fkey | {war_id} | CASCADE |
| public.department_war_metrics | department_war_metrics_war_id_fkey | {war_id} | CASCADE |
| public.department_war_results | department_war_results_war_id_fkey | {war_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_wars_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_wars_pkey ON public.department_wars USING btree (id)` |
| idx_department_wars_running | btree | {status,starts_at,ends_at} | não | sim | `(status = 'running'::text)` | `CREATE INDEX idx_department_wars_running ON public.department_wars USING btree (status, starts_at, ends_at) WHERE (status = 'running'::text)` |
| idx_department_wars_status_ends_at | btree | {status,ends_at} | não | sim |  | `CREATE INDEX idx_department_wars_status_ends_at ON public.department_wars USING btree (status, ends_at DESC)` |


## Policies (RLS)

### `department_wars_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `department_wars_user_select`

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
| department_wars_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_validate_department_war | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_department_war |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
