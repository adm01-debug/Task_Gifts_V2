# public.sequence_steps

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
| 2 | `procedure_id` | `uuid` | não |  |  |  |
| 3 | `label` | `text` | não |  |  |  |
| 4 | `hint` | `text` | sim |  |  |  |
| 5 | `position` | `integer` | não |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_steps_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequence_steps_position_check | CHECK | `CHECK ("position" >= 1 AND "position" <= 20)` |  |  | sim |
| sequence_steps_procedure_id_fkey | FOREIGN KEY | `FOREIGN KEY (procedure_id) REFERENCES sequence_procedures(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_steps_procedure_id_position_key | UNIQUE | `UNIQUE (procedure_id, "position") DEFERRABLE INITIALLY DEFERRED` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sequence_steps_procedure | btree | {procedure_id,position} | não | sim |  | `CREATE INDEX idx_sequence_steps_procedure ON public.sequence_steps USING btree (procedure_id, "position")` |
| sequence_steps_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX sequence_steps_pkey ON public.sequence_steps USING btree (id)` |
| sequence_steps_procedure_id_position_key | btree | {procedure_id,position} | sim | sim |  | `CREATE UNIQUE INDEX sequence_steps_procedure_id_position_key ON public.sequence_steps USING btree (procedure_id, "position")` |


## Policies (RLS)

### `sequence_steps_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `sequence_steps_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| sequence_steps_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
