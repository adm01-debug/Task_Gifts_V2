# public.profiles

> Perfis de usuarios da plataforma — dados pessoais, cargo, departamento, XP, nivel e moedas. Central para gamificacao.

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
| usada por views | public.leaderboard_cache, public.profiles_public |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não |  |  |  |
| 2 | `email` | `text` | sim |  |  |  |
| 3 | `display_name` | `text` | sim |  |  |  |
| 4 | `avatar_url` | `text` | sim |  |  |  |
| 5 | `level` | `integer` | não | `1` |  | Nível atual do usuário — calculado por XP acumulado |
| 6 | `xp` | `integer` | não | `0` |  | Pontos de experiência acumulados — base para level e ranking |
| 7 | `coins` | `integer` | não | `0` |  | Moedas virtuais — usadas para compras na loja de recompensas |
| 8 | `streak` | `integer` | não | `0` |  | Dias consecutivos de engajamento — streak atual |
| 9 | `best_streak` | `integer` | não | `0` |  | Melhor streak histórica do usuário |
| 10 | `quests_completed` | `integer` | não | `0` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `birth_date` | `date` | sim |  |  |  |
| 14 | `hire_date` | `date` | sim |  |  |  |
| 15 | `status` | `text` | não | `'confirmed'::text` |  | Status ativo/inativo — filtro principal em todas as queries |
| 16 | `phone` | `text` | sim |  |  |  |
| 17 | `personal_email` | `text` | sim |  |  |  |
| 18 | `cpf` | `text` | sim |  |  |  |
| 19 | `employee_id` | `text` | sim |  |  |  |
| 20 | `contract_type` | `text` | sim | `'clt'::text` |  |  |
| 21 | `last_access_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| profiles_contract_type_check | CHECK | `CHECK (contract_type = ANY (ARRAY['clt'::text, 'pj'::text, 'intern'::text, 'temporary'::text]))` |  |  | sim |
| profiles_id_fkey | FOREIGN KEY | `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| profiles_status_check | CHECK | `CHECK (status = ANY (ARRAY['invited'::text, 'confirmed'::text, 'inactive'::text, 'deleted'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.announcements | announcements_author_id_fkey | {author_id} | CASCADE |
| public.celebrations | celebrations_user_id_fkey | {user_id} | CASCADE |
| public.league_history | league_history_user_id_fkey | {user_id} | CASCADE |
| public.shop_purchases | shop_purchases_user_id_fkey | {user_id} | CASCADE |
| public.user_leagues | user_leagues_user_id_fkey | {user_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_profiles_confirmed | btree | {id} | não | sim | `(status = ANY (ARRAY['confirmed'::text, 'invited'::text]))` | `CREATE INDEX idx_profiles_confirmed ON public.profiles USING btree (id) WHERE (status = ANY (ARRAY['confirmed'::text, 'invited'::text]))` |
| idx_profiles_display_name_trgm | gin | {display_name} | não | sim |  | `CREATE INDEX idx_profiles_display_name_trgm ON public.profiles USING gin (display_name gin_trgm_ops)` |
| idx_profiles_display_name_unaccent | gin | {} | não | sim |  | `CREATE INDEX idx_profiles_display_name_unaccent ON public.profiles USING gin (to_tsvector('portuguese'::regconfig, COALESCE(display_name, ''::text)))` |
| idx_profiles_email_trgm | gin | {email} | não | sim |  | `CREATE INDEX idx_profiles_email_trgm ON public.profiles USING gin (email gin_trgm_ops)` |
| idx_profiles_employee_id | btree | {employee_id} | não | sim | `(employee_id IS NOT NULL)` | `CREATE INDEX idx_profiles_employee_id ON public.profiles USING btree (employee_id) WHERE (employee_id IS NOT NULL)` |
| idx_profiles_level | btree | {level,xp} | não | sim |  | `CREATE INDEX idx_profiles_level ON public.profiles USING btree (level DESC, xp DESC)` |
| profiles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)` |


## Policies (RLS)

### `Authenticated users can view profiles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |

### `Users can insert their own profile`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(auth.uid() = id)` |

### `Users can update own profile`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(auth.uid() = id)` |
| WITH CHECK | `(auth.uid() = id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_profiles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |


Grants por coluna:

| coluna | role | privilégios |
|---|---|---|
| avatar_url | authenticated | SELECT, UPDATE |
| best_streak | authenticated | SELECT |
| birth_date | authenticated | SELECT, UPDATE |
| coins | authenticated | SELECT |
| created_at | authenticated | SELECT |
| display_name | authenticated | SELECT, UPDATE |
| hire_date | authenticated | SELECT, UPDATE |
| id | authenticated | SELECT |
| last_access_at | authenticated | SELECT |
| level | authenticated | SELECT |
| quests_completed | authenticated | SELECT |
| status | authenticated | SELECT |
| streak | authenticated | SELECT |
| updated_at | authenticated | SELECT |
| xp | authenticated | SELECT |
