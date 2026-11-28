# public.executive_monthly_reports

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
| 2 | `period_year` | `integer` | não |  |  |  |
| 3 | `period_month` | `integer` | não |  |  |  |
| 4 | `incidents_total` | `integer` | não | `0` |  |  |
| 5 | `incidents_resolved` | `integer` | não | `0` |  |  |
| 6 | `incidents_critical` | `integer` | não | `0` |  |  |
| 7 | `incidents_high` | `integer` | não | `0` |  |  |
| 8 | `mtta_minutes_avg` | `numeric` | sim |  |  |  |
| 9 | `mttr_minutes_avg` | `numeric` | sim |  |  |  |
| 10 | `mttr_minutes_p95` | `numeric` | sim |  |  |  |
| 11 | `sla_breaches` | `integer` | não | `0` |  |  |
| 12 | `postmortems_created` | `integer` | não | `0` |  |  |
| 13 | `postmortems_published` | `integer` | não | `0` |  |  |
| 14 | `action_items_total` | `integer` | não | `0` |  |  |
| 15 | `action_items_done` | `integer` | não | `0` |  |  |
| 16 | `action_items_overdue` | `integer` | não | `0` |  |  |
| 17 | `breakdown_by_type` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 18 | `generated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `commentary` | `text` | sim |  |  |  |
| 21 | `commentary_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `commentary_updated_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| executive_monthly_reports_period_month_check | CHECK | `CHECK (period_month >= 1 AND period_month <= 12)` |  |  | sim |
| executive_monthly_reports_period_year_period_month_key | UNIQUE | `UNIQUE (period_year, period_month)` |  |  | sim |
| executive_monthly_reports_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| executive_monthly_reports_period_year_period_month_key | btree | {period_year,period_month} | sim | sim |  | `CREATE UNIQUE INDEX executive_monthly_reports_period_year_period_month_key ON public.executive_monthly_reports USING btree (period_year, period_month)` |
| executive_monthly_reports_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX executive_monthly_reports_pkey ON public.executive_monthly_reports USING btree (id)` |
| idx_exec_reports_period | btree | {period_year,period_month} | não | sim |  | `CREATE INDEX idx_exec_reports_period ON public.executive_monthly_reports USING btree (period_year DESC, period_month DESC)` |


## Policies (RLS)

### `Admins manage monthly reports`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins read monthly reports`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notify_admins_monthly_report | AFTER | INSERT | ROW | enabled | public.notify_admins_of_monthly_report |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
