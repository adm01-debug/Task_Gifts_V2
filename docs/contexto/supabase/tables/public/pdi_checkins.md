# public.pdi_checkins

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
| 2 | `plan_id` | `uuid` | não |  |  |  |
| 3 | `checkin_date` | `timestamp with time zone` | não |  |  |  |
| 4 | `progress_summary` | `text` | sim |  |  |  |
| 5 | `blockers` | `text` | sim |  |  |  |
| 6 | `next_steps` | `text` | sim |  |  |  |
| 7 | `mood_rating` | `integer` | sim |  |  |  |
| 8 | `manager_feedback` | `text` | sim |  |  |  |
| 9 | `created_by` | `uuid` | não |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pdi_checkins_mood_rating_check | CHECK | `CHECK (mood_rating >= 1 AND mood_rating <= 5)` |  |  | sim |
| pdi_checkins_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pdi_checkins_plan_id_fkey | FOREIGN KEY | `FOREIGN KEY (plan_id) REFERENCES development_plans(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pdi_checkins_plan_id | btree | {plan_id} | não | sim |  | `CREATE INDEX idx_pdi_checkins_plan_id ON public.pdi_checkins USING btree (plan_id)` |
| pdi_checkins_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX pdi_checkins_pkey ON public.pdi_checkins USING btree (id)` |


## Policies (RLS)

### `pdi_checkins_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = created_by)` |

### `pdi_checkins_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = pdi_checkins.plan_id) AND (dp.user_id = auth.uid()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
