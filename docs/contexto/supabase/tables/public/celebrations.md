# public.celebrations

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
| 3 | `celebration_type` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `celebration_date` | `date` | não |  |  |  |
| 7 | `year_count` | `integer` | sim |  |  |  |
| 8 | `is_public` | `boolean` | não | `true` |  |  |
| 9 | `auto_generated` | `boolean` | não | `false` |  |  |
| 10 | `xp_reward` | `integer` | não | `50` |  |  |
| 11 | `coin_reward` | `integer` | não | `25` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| celebrations_celebration_type_check | CHECK | `CHECK (celebration_type = ANY (ARRAY['birthday'::text, 'work_anniversary'::text, 'milestone'::text, 'custom'::text]))` |  |  | sim |
| celebrations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| celebrations_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| celebrations_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX celebrations_pkey ON public.celebrations USING btree (id)` |
| idx_celebrations_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_celebrations_user_id ON public.celebrations USING btree (user_id)` |


## Policies (RLS)

### `Authenticated create celebrations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |

### `Users can manage own celebrations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view public celebrations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_public = true) OR (user_id = auth.uid()))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
