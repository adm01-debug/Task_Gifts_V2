# public.user_demographic_values

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
| usada por views | public.demographic_values_panel |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `attribute_id` | `uuid` | não |  |  |  |
| 4 | `value` | `text` | sim |  |  |  |
| 5 | `values_array` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 6 | `number_value` | `numeric` | sim |  |  |  |
| 7 | `date_value` | `date` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| unique_user_demographic_value | UNIQUE | `UNIQUE (user_id, attribute_id)` |  |  | sim |
| user_demographic_values_attribute_id_fkey | FOREIGN KEY | `FOREIGN KEY (attribute_id) REFERENCES demographic_attributes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_demographic_values_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_demographic_values_attribute_id | btree | {attribute_id} | não | sim |  | `CREATE INDEX idx_user_demographic_values_attribute_id ON public.user_demographic_values USING btree (attribute_id)` |
| unique_user_demographic_value | btree | {user_id,attribute_id} | sim | sim |  | `CREATE UNIQUE INDEX unique_user_demographic_value ON public.user_demographic_values USING btree (user_id, attribute_id)` |
| user_demographic_values_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_demographic_values_pkey ON public.user_demographic_values USING btree (id)` |


## Policies (RLS)

### `Admins can view demographic values`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can manage own demographic values`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_user_demographic_values_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
