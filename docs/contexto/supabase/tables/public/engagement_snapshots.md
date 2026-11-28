# public.engagement_snapshots

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
| 2 | `department_id` | `uuid` | sim |  |  |  |
| 3 | `snapshot_date` | `date` | não | `CURRENT_DATE` |  |  |
| 4 | `period_type` | `text` | não | `'weekly'::text` |  |  |
| 5 | `enps_score` | `numeric(5,2)` | sim |  |  |  |
| 6 | `mood_avg` | `numeric(3,2)` | sim |  |  |  |
| 7 | `participation_rate` | `numeric(5,2)` | sim |  |  |  |
| 8 | `active_users` | `integer` | sim |  |  |  |
| 9 | `total_users` | `integer` | sim |  |  |  |
| 10 | `quests_completed` | `integer` | sim |  |  |  |
| 11 | `training_completion_rate` | `numeric(5,2)` | sim |  |  |  |
| 12 | `punctuality_rate` | `numeric(5,2)` | sim |  |  |  |
| 13 | `kudos_given` | `integer` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_snapshots_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| engagement_snapshots_department_id_snapshot_date_period_typ_key | UNIQUE | `UNIQUE (department_id, snapshot_date, period_type)` |  |  | sim |
| engagement_snapshots_period_type_check | CHECK | `CHECK (period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text]))` |  |  | sim |
| engagement_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_snapshots_department_id_snapshot_date_period_typ_key | btree | {department_id,snapshot_date,period_type} | sim | sim |  | `CREATE UNIQUE INDEX engagement_snapshots_department_id_snapshot_date_period_typ_key ON public.engagement_snapshots USING btree (department_id, snapshot_date, period_type)` |
| engagement_snapshots_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_snapshots_pkey ON public.engagement_snapshots USING btree (id)` |
| idx_engagement_snapshots_date | btree | {snapshot_date} | não | sim |  | `CREATE INDEX idx_engagement_snapshots_date ON public.engagement_snapshots USING btree (snapshot_date)` |


## Policies (RLS)

### `Admins can manage snapshots`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can view department snapshots`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM team_members tm   WHERE ((tm.user_id = auth.uid()) AND (tm.is_manager = true) AND ((engagement_snapshots.department_id IS NULL) OR (tm.department_id = engagement_snapshots.department_id)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
