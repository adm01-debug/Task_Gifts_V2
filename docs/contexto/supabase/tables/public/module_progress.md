# public.module_progress

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `module_id` | `uuid` | não |  |  |  |
| 4 | `started_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 5 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `score` | `integer` | sim |  |  |  |
| 7 | `attempts` | `integer` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| module_progress_module_id_fkey | FOREIGN KEY | `FOREIGN KEY (module_id) REFERENCES trail_modules(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| module_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| module_progress_user_id_module_id_key | UNIQUE | `UNIQUE (user_id, module_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_module_progress_module_id | btree | {module_id} | não | sim |  | `CREATE INDEX idx_module_progress_module_id ON public.module_progress USING btree (module_id)` |
| module_progress_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX module_progress_pkey ON public.module_progress USING btree (id)` |
| module_progress_user_id_module_id_key | btree | {user_id,module_id} | sim | sim |  | `CREATE UNIQUE INDEX module_progress_user_id_module_id_key ON public.module_progress USING btree (user_id, module_id)` |


## Policies (RLS)

### `Users can insert own progress`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can update own progress`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view own progress`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_war_hook_module_progress | AFTER | INSERT OR UPDATE | ROW | enabled | public.war_hook_module_progress |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
