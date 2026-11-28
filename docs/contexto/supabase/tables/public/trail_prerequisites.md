# public.trail_prerequisites

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
| 2 | `trail_id` | `uuid` | não |  |  |  |
| 3 | `prerequisite_trail_id` | `uuid` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trail_prerequisites_check | CHECK | `CHECK (trail_id <> prerequisite_trail_id)` |  |  | sim |
| trail_prerequisites_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trail_prerequisites_prerequisite_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (prerequisite_trail_id) REFERENCES learning_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trail_prerequisites_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES learning_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trail_prerequisites_trail_id_prerequisite_trail_id_key | UNIQUE | `UNIQUE (trail_id, prerequisite_trail_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trail_prerequisites_prerequisite_id | btree | {prerequisite_trail_id} | não | sim |  | `CREATE INDEX idx_trail_prerequisites_prerequisite_id ON public.trail_prerequisites USING btree (prerequisite_trail_id)` |
| idx_trail_prerequisites_trail_id | btree | {trail_id} | não | sim |  | `CREATE INDEX idx_trail_prerequisites_trail_id ON public.trail_prerequisites USING btree (trail_id)` |
| trail_prerequisites_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX trail_prerequisites_pkey ON public.trail_prerequisites USING btree (id)` |
| trail_prerequisites_trail_id_prerequisite_trail_id_key | btree | {trail_id,prerequisite_trail_id} | sim | sim |  | `CREATE UNIQUE INDEX trail_prerequisites_trail_id_prerequisite_trail_id_key ON public.trail_prerequisites USING btree (trail_id, prerequisite_trail_id)` |


## Policies (RLS)

### `Admins and managers can manage prerequisites`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Everyone can view prerequisites`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
