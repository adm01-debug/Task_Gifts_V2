# public.achievements

> Conquistas desbloqueaveis — badges, trofeus e milestones com raridade (common/rare/epic/legendary).

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
| 2 | `key` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `icon` | `text` | não | `'🏆'::text` |  |  |
| 6 | `category` | `text` | não | `'general'::text` |  |  |
| 7 | `xp_reward` | `integer` | não | `50` |  |  |
| 8 | `coin_reward` | `integer` | não | `25` |  |  |
| 9 | `rarity` | `text` | não | `'common'::text` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| achievements_key_key | UNIQUE | `UNIQUE (key)` |  |  | sim |
| achievements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lucky_wheel_prizes | lucky_wheel_prizes_achievement_id_fkey | {achievement_id} | SET NULL |
| public.user_achievements | user_achievements_achievement_id_fkey | {achievement_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| achievements_key_key | btree | {key} | sim | sim |  | `CREATE UNIQUE INDEX achievements_key_key ON public.achievements USING btree (key)` |
| achievements_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id)` |
| idx_achievements_fts | gin | {} | não | sim |  | `CREATE INDEX idx_achievements_fts ON public.achievements USING gin (to_tsvector('portuguese'::regconfig, ((COALESCE(name, ''::text) \|\| ' '::text) \|\| COALESCE(description, ''::text))))` |
| idx_achievements_name_trgm | gin | {name} | não | sim |  | `CREATE INDEX idx_achievements_name_trgm ON public.achievements USING gin (name gin_trgm_ops)` |


## Policies (RLS)

### `Admins can manage achievements`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view achievements`

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
