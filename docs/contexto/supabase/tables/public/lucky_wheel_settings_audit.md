# public.lucky_wheel_settings_audit

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `old_budget` | `numeric` | sim |  |  |  |
| 3 | `new_budget` | `numeric` | não |  |  |  |
| 4 | `changed_by` | `uuid` | sim |  |  |  |
| 5 | `changed_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_settings_audit_changed_by_fkey | FOREIGN KEY | `FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lucky_wheel_settings_audit_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lw_settings_audit_changed_at | btree | {changed_at} | não | sim |  | `CREATE INDEX idx_lw_settings_audit_changed_at ON public.lucky_wheel_settings_audit USING btree (changed_at DESC)` |
| lucky_wheel_settings_audit_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_settings_audit_pkey ON public.lucky_wheel_settings_audit USING btree (id)` |


## Policies (RLS)

### `lucky_wheel_settings_audit_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
