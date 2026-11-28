# public.mood_entries

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
| 3 | `mood_score` | `integer` | não |  |  |  |
| 4 | `mood_emoji` | `text` | não | `'😐'::text` |  |  |
| 5 | `note` | `text` | sim |  |  |  |
| 6 | `factors` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 7 | `is_anonymous` | `boolean` | não | `false` |  |  |
| 8 | `entry_date` | `date` | não | `CURRENT_DATE` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mood_entries_mood_score_check | CHECK | `CHECK (mood_score >= 1 AND mood_score <= 5)` |  |  | sim |
| mood_entries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mood_entries_user_id_entry_date_key | UNIQUE | `UNIQUE (user_id, entry_date)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| mood_entries_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX mood_entries_pkey ON public.mood_entries USING btree (id)` |
| mood_entries_user_id_entry_date_key | btree | {user_id,entry_date} | sim | sim |  | `CREATE UNIQUE INDEX mood_entries_user_id_entry_date_key ON public.mood_entries USING btree (user_id, entry_date)` |


## Policies (RLS)

### `Managers and admins can view team mood data`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can manage own mood entries`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
