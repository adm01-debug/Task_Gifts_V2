# public.sla_targets

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
| 2 | `alert_type` | `text` | não |  |  |  |
| 3 | `mtta_target_seconds` | `integer` | não |  |  |  |
| 4 | `mttr_target_seconds` | `integer` | não |  |  |  |
| 5 | `notes` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sla_targets_alert_type_key | UNIQUE | `UNIQUE (alert_type)` |  |  | sim |
| sla_targets_mtta_target_seconds_check | CHECK | `CHECK (mtta_target_seconds > 0)` |  |  | sim |
| sla_targets_mttr_target_seconds_check | CHECK | `CHECK (mttr_target_seconds > 0)` |  |  | sim |
| sla_targets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sla_targets_alert_type_key | btree | {alert_type} | sim | sim |  | `CREATE UNIQUE INDEX sla_targets_alert_type_key ON public.sla_targets USING btree (alert_type)` |
| sla_targets_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX sla_targets_pkey ON public.sla_targets USING btree (id)` |


## Policies (RLS)

### `Admins manage SLA targets`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sla_targets_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
