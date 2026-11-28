# public.announcement_reads

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
| 2 | `announcement_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `read_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| announcement_reads_announcement_id_fkey | FOREIGN KEY | `FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| announcement_reads_announcement_id_user_id_key | UNIQUE | `UNIQUE (announcement_id, user_id)` |  |  | sim |
| announcement_reads_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| announcement_reads_announcement_id_user_id_key | btree | {announcement_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX announcement_reads_announcement_id_user_id_key ON public.announcement_reads USING btree (announcement_id, user_id)` |
| announcement_reads_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX announcement_reads_pkey ON public.announcement_reads USING btree (id)` |


## Policies (RLS)

### `Users can mark as read`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can view own reads`

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
