# public.engagement_question_pool

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
| 2 | `code` | `text` | não |  |  |  |
| 3 | `question_text` | `text` | não |  |  |  |
| 4 | `helper_text` | `text` | sim |  |  |  |
| 5 | `pillar` | `climate_pillar` | não |  |  |  |
| 6 | `factor_id` | `uuid` | sim |  |  |  |
| 7 | `answer_format` | `engagement_answer_format` | não | `'slider'::engagement_answer_format` |  |  |
| 8 | `options` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `weight` | `numeric` | não | `1` |  |  |
| 10 | `is_reverse` | `boolean` | não | `false` |  |  |
| 11 | `is_nr1` | `boolean` | não | `false` |  |  |
| 12 | `copsoq_dimension` | `text` | sim |  |  |  |
| 13 | `is_active` | `boolean` | não | `true` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_question_pool_code_key | UNIQUE | `UNIQUE (code)` |  |  | sim |
| engagement_question_pool_factor_id_fkey | FOREIGN KEY | `FOREIGN KEY (factor_id) REFERENCES engagement_factors(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| engagement_question_pool_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.engagement_answers | engagement_answers_question_id_fkey | {question_id} | CASCADE |
| public.engagement_question_assignments | engagement_question_assignments_question_id_fkey | {question_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_question_pool_code_key | btree | {code} | sim | sim |  | `CREATE UNIQUE INDEX engagement_question_pool_code_key ON public.engagement_question_pool USING btree (code)` |
| engagement_question_pool_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_question_pool_pkey ON public.engagement_question_pool USING btree (id)` |
| idx_engagement_question_pool_pillar | btree | {pillar,is_active} | não | sim |  | `CREATE INDEX idx_engagement_question_pool_pillar ON public.engagement_question_pool USING btree (pillar, is_active)` |
| idx_eqp_active | btree | {is_active} | não | sim | `is_active` | `CREATE INDEX idx_eqp_active ON public.engagement_question_pool USING btree (is_active) WHERE is_active` |
| idx_eqp_factor | btree | {factor_id} | não | sim |  | `CREATE INDEX idx_eqp_factor ON public.engagement_question_pool USING btree (factor_id)` |
| idx_eqp_pillar | btree | {pillar} | não | sim |  | `CREATE INDEX idx_eqp_pillar ON public.engagement_question_pool USING btree (pillar)` |


## Policies (RLS)

### `engagement_question_pool_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `engagement_question_pool_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| engagement_question_pool_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
