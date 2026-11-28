# public.lucky_wheel_prizes

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
| 2 | `label` | `text` | não |  |  |  |
| 3 | `prize_type` | `text` | não |  |  |  |
| 4 | `amount` | `integer` | não | `0` |  |  |
| 5 | `achievement_id` | `uuid` | sim |  |  |  |
| 6 | `weight` | `integer` | não | `1` |  |  |
| 7 | `color` | `text` | não | `'hsl(var(--primary))'::text` |  |  |
| 8 | `icon` | `text` | não | `'gift'::text` |  |  |
| 9 | `rarity` | `text` | não | `'common'::text` |  |  |
| 10 | `is_active` | `boolean` | não | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_prizes_achievement_id_fkey | FOREIGN KEY | `FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lucky_wheel_prizes_amount_check | CHECK | `CHECK (amount >= 0)` |  |  | sim |
| lucky_wheel_prizes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lucky_wheel_prizes_prize_type_check | CHECK | `CHECK (prize_type = ANY (ARRAY['coins'::text, 'xp'::text, 'achievement'::text, 'nothing'::text]))` |  |  | sim |
| lucky_wheel_prizes_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |
| lucky_wheel_prizes_weight_check | CHECK | `CHECK (weight >= 1)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lucky_wheel_prize_audit | lucky_wheel_prize_audit_prize_id_fkey | {prize_id} | SET NULL |
| public.lucky_wheel_spins | lucky_wheel_spins_prize_id_fkey | {prize_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lucky_wheel_prizes_active_idx | btree | {is_active} | não | sim | `is_active` | `CREATE INDEX lucky_wheel_prizes_active_idx ON public.lucky_wheel_prizes USING btree (is_active) WHERE is_active` |
| lucky_wheel_prizes_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_prizes_pkey ON public.lucky_wheel_prizes USING btree (id)` |


## Policies (RLS)

### `lucky_wheel_prizes_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `lucky_wheel_prizes_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| lucky_wheel_prizes_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.log_lucky_wheel_prize_change |
| lucky_wheel_prizes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
