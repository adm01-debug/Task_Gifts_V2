# public.leagues

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `tier` | `integer` | não |  |  |  |
| 4 | `icon` | `text` | não | `'🥉'::text` |  |  |
| 5 | `color` | `text` | não | `'#CD7F32'::text` |  |  |
| 6 | `min_xp_weekly` | `integer` | não | `0` |  |  |
| 7 | `promotion_slots` | `integer` | não | `10` |  |  |
| 8 | `demotion_slots` | `integer` | não | `10` |  |  |
| 9 | `xp_bonus_percent` | `integer` | não | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `department_id` | `uuid` | sim |  |  |  |
| 12 | `theme_id` | `uuid` | sim |  |  |  |
| 13 | `description` | `text` | sim |  |  |  |
| 14 | `special_rewards` | `jsonb` | sim | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| leagues_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| leagues_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| leagues_theme_id_fkey | FOREIGN KEY | `FOREIGN KEY (theme_id) REFERENCES gamification_themes(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| leagues_tier_check | CHECK | `CHECK (tier >= 1 AND tier <= 6)` |  |  | sim |
| leagues_tier_key | UNIQUE | `UNIQUE (tier)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.league_history | league_history_from_league_id_fkey | {from_league_id} | RESTRICT |
| public.league_history | league_history_to_league_id_fkey | {to_league_id} | RESTRICT |
| public.user_leagues | user_leagues_league_id_fkey | {league_id} | RESTRICT |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_leagues_department | btree | {department_id} | não | sim |  | `CREATE INDEX idx_leagues_department ON public.leagues USING btree (department_id)` |
| idx_leagues_theme_id | btree | {theme_id} | não | sim |  | `CREATE INDEX idx_leagues_theme_id ON public.leagues USING btree (theme_id)` |
| leagues_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX leagues_pkey ON public.leagues USING btree (id)` |
| leagues_tier_key | btree | {tier} | sim | sim |  | `CREATE UNIQUE INDEX leagues_tier_key ON public.leagues USING btree (tier)` |


## Policies (RLS)

### `Admins can manage leagues`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view leagues`

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
