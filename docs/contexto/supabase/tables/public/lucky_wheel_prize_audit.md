# public.lucky_wheel_prize_audit

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
| 2 | `prize_id` | `uuid` | sim |  |  |  |
| 3 | `operation` | `text` | não |  |  |  |
| 4 | `changed_by` | `uuid` | sim |  |  |  |
| 5 | `changed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `before_data` | `jsonb` | sim |  |  |  |
| 7 | `after_data` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lucky_wheel_prize_audit_changed_by_fkey | FOREIGN KEY | `FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lucky_wheel_prize_audit_operation_check | CHECK | `CHECK (operation = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))` |  |  | sim |
| lucky_wheel_prize_audit_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lucky_wheel_prize_audit_prize_id_fkey | FOREIGN KEY | `FOREIGN KEY (prize_id) REFERENCES lucky_wheel_prizes(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lucky_wheel_prize_audit_prize | btree | {prize_id,changed_at} | não | sim |  | `CREATE INDEX idx_lucky_wheel_prize_audit_prize ON public.lucky_wheel_prize_audit USING btree (prize_id, changed_at DESC)` |
| lucky_wheel_prize_audit_changed_at_idx | btree | {changed_at} | não | sim |  | `CREATE INDEX lucky_wheel_prize_audit_changed_at_idx ON public.lucky_wheel_prize_audit USING btree (changed_at DESC)` |
| lucky_wheel_prize_audit_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX lucky_wheel_prize_audit_pkey ON public.lucky_wheel_prize_audit USING btree (id)` |


## Policies (RLS)

### `lucky_wheel_prize_audit_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
