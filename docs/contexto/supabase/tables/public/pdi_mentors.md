# public.pdi_mentors

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `plan_id` | `uuid` | não |  |  |  |
| 3 | `mentor_id` | `uuid` | não |  |  |  |
| 4 | `role` | `text` | sim | `'mentor'::text` |  |  |
| 5 | `status` | `text` | sim | `'active'::text` |  |  |
| 6 | `notes` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pdi_mentors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pdi_mentors_plan_id_fkey | FOREIGN KEY | `FOREIGN KEY (plan_id) REFERENCES development_plans(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pdi_mentors_plan_id | btree | {plan_id} | não | sim |  | `CREATE INDEX idx_pdi_mentors_plan_id ON public.pdi_mentors USING btree (plan_id)` |
| pdi_mentors_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX pdi_mentors_pkey ON public.pdi_mentors USING btree (id)` |


## Policies (RLS)

### `Managers assign PDI mentors`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |

### `pdi_mentors_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((auth.uid() = mentor_id) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `pdi_mentors_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = mentor_id) OR (EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = pdi_mentors.plan_id) AND (dp.user_id = auth.uid())))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
