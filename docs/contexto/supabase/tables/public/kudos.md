# public.kudos

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
| 2 | `from_user_id` | `uuid` | não |  |  |  |
| 3 | `to_user_id` | `uuid` | não |  |  |  |
| 4 | `badge_id` | `uuid` | sim |  |  |  |
| 5 | `message` | `text` | não |  |  |  |
| 6 | `is_public` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kudos_badge_id_fkey | FOREIGN KEY | `FOREIGN KEY (badge_id) REFERENCES kudos_badges(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| kudos_not_self | CHECK | `CHECK (from_user_id <> to_user_id)` |  |  | sim |
| kudos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_kudos_badge_id | btree | {badge_id} | não | sim |  | `CREATE INDEX idx_kudos_badge_id ON public.kudos USING btree (badge_id)` |
| idx_kudos_created_at | btree | {created_at} | não | sim |  | `CREATE INDEX idx_kudos_created_at ON public.kudos USING btree (created_at DESC)` |
| idx_kudos_from_user | btree | {from_user_id} | não | sim |  | `CREATE INDEX idx_kudos_from_user ON public.kudos USING btree (from_user_id)` |
| idx_kudos_to_user | btree | {to_user_id} | não | sim |  | `CREATE INDEX idx_kudos_to_user ON public.kudos USING btree (to_user_id)` |
| kudos_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX kudos_pkey ON public.kudos USING btree (id)` |


## Policies (RLS)

### `Authenticated users can give kudos`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = from_user_id)` |

### `Public kudos are viewable by all`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_public = true) OR (from_user_id = auth.uid()) OR (to_user_id = auth.uid()))` |
| WITH CHECK |  |

### `Users can delete kudos they gave`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = from_user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_war_hook_kudos | AFTER | INSERT | ROW | enabled | public.war_hook_kudos |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
