# public.user_titles

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `title_id` | `uuid` | sim |  |  |  |
| 4 | `is_active` | `boolean` | sim | `true` |  |  |
| 5 | `earned_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `expires_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_titles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_titles_title_id_fkey | FOREIGN KEY | `FOREIGN KEY (title_id) REFERENCES custom_titles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_titles_title_id | btree | {title_id} | não | sim |  | `CREATE INDEX idx_user_titles_title_id ON public.user_titles USING btree (title_id)` |
| idx_user_titles_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_user_titles_user ON public.user_titles USING btree (user_id)` |
| user_titles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_titles_pkey ON public.user_titles USING btree (id)` |


## Policies (RLS)

### `Admins can manage user titles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can view own titles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
