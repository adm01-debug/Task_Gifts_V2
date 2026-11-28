# public.wager_questions

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
| 2 | `question` | `text` | não |  |  |  |
| 3 | `options` | `jsonb` | não |  |  |  |
| 4 | `correct_option` | `text` | não |  |  |  |
| 5 | `explanation` | `text` | sim |  |  |  |
| 6 | `difficulty` | `text` | não | `'medium'::text` |  |  |
| 7 | `base_multiplier` | `numeric` | não | `2.00` |  |  |
| 8 | `max_stake` | `integer` | não | `100` |  |  |
| 9 | `scheduled_date` | `date` | não |  |  |  |
| 10 | `is_active` | `boolean` | não | `true` |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| wager_questions_base_multiplier_check | CHECK | `CHECK (base_multiplier >= 1::numeric AND base_multiplier <= 10::numeric)` |  |  | sim |
| wager_questions_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| wager_questions_difficulty_check | CHECK | `CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))` |  |  | sim |
| wager_questions_max_stake_check | CHECK | `CHECK (max_stake >= 1)` |  |  | sim |
| wager_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.wager_entries | wager_entries_question_id_fkey | {question_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_wager_questions_date | btree | {scheduled_date} | não | sim |  | `CREATE INDEX idx_wager_questions_date ON public.wager_questions USING btree (scheduled_date DESC)` |
| uq_wager_questions_date_active | btree | {scheduled_date} | sim | sim | `is_active` | `CREATE UNIQUE INDEX uq_wager_questions_date_active ON public.wager_questions USING btree (scheduled_date) WHERE is_active` |
| wager_questions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX wager_questions_pkey ON public.wager_questions USING btree (id)` |


## Policies (RLS)

### `wager_questions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `wager_questions_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `wager_questions_user_select_own_entries`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM wager_entries e   WHERE ((e.question_id = wager_questions.id) AND (e.user_id = auth.uid()))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| wager_questions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
