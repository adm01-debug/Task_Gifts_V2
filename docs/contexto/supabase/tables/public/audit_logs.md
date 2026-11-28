# public.audit_logs

> Log de auditoria de todas as acoes criticas — compliance e rastreabilidade de eventos.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `action` | `audit_action` | não |  |  |  |
| 4 | `entity_type` | `text` | não |  |  |  |
| 5 | `entity_id` | `uuid` | sim |  |  |  |
| 6 | `old_data` | `jsonb` | sim |  |  |  |
| 7 | `new_data` | `jsonb` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `ip_address` | `text` | sim |  |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| audit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| audit_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)` |
| idx_audit_logs_action | btree | {action} | não | sim |  | `CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action)` |
| idx_audit_logs_created_at | btree | {created_at} | não | sim |  | `CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)` |
| idx_audit_logs_entity | btree | {entity_type,entity_id} | não | sim |  | `CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id)` |
| idx_audit_logs_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)` |


## Policies (RLS)

### `Admins can view all audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authenticated insert audit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Managers can view team audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'manager'::app_role) AND (EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = audit_logs.user_id)))))` |
| WITH CHECK |  |

### `Users can view own audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
