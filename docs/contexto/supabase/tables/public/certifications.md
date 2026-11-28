# public.certifications

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
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `icon` | `text` | não | `'📜'::text` |  |  |
| 5 | `category` | `text` | não | `'general'::text` |  |  |
| 6 | `validity_months` | `integer` | sim |  |  |  |
| 7 | `is_mandatory` | `boolean` | não | `false` |  |  |
| 8 | `xp_reward` | `integer` | não | `100` |  |  |
| 9 | `coin_reward` | `integer` | não | `50` |  |  |
| 10 | `department_id` | `uuid` | sim |  |  |  |
| 11 | `trail_id` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| certifications_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| certifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| certifications_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES learning_trails(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_certifications | user_certifications_certification_id_fkey | {certification_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| certifications_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX certifications_pkey ON public.certifications USING btree (id)` |
| idx_certifications_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_certifications_department_id ON public.certifications USING btree (department_id)` |
| idx_certifications_trail_id | btree | {trail_id} | não | sim |  | `CREATE INDEX idx_certifications_trail_id ON public.certifications USING btree (trail_id)` |


## Policies (RLS)

### `Admins can manage certifications`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view certifications`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_certifications_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
