# public.position_competencies

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
| 2 | `position_id` | `uuid` | não |  |  |  |
| 3 | `competency_id` | `uuid` | não |  |  |  |
| 4 | `required_level` | `integer` | não |  |  |  |
| 5 | `weight` | `numeric(3,2)` | sim | `1.0` |  |  |
| 6 | `is_mandatory` | `boolean` | sim | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| position_competencies_competency_id_fkey | FOREIGN KEY | `FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| position_competencies_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| position_competencies_position_id_fkey | FOREIGN KEY | `FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| position_competencies_required_level_check | CHECK | `CHECK (required_level >= 1 AND required_level <= 5)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_position_competencies_competency_id | btree | {competency_id} | não | sim |  | `CREATE INDEX idx_position_competencies_competency_id ON public.position_competencies USING btree (competency_id)` |
| idx_position_competencies_position_id | btree | {position_id} | não | sim |  | `CREATE INDEX idx_position_competencies_position_id ON public.position_competencies USING btree (position_id)` |
| position_competencies_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX position_competencies_pkey ON public.position_competencies USING btree (id)` |


## Policies (RLS)

### `Admins manage position competencies`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `position_competencies_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
