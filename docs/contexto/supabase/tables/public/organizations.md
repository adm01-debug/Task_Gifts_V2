# public.organizations

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
| 3 | `slug` | `text` | não |  |  |  |
| 4 | `logo_url` | `text` | sim |  |  |  |
| 5 | `favicon_url` | `text` | sim |  |  |  |
| 6 | `primary_color` | `text` | sim |  |  |  |
| 7 | `secondary_color` | `text` | sim |  |  |  |
| 8 | `accent_color` | `text` | sim |  |  |  |
| 9 | `custom_domain` | `text` | sim |  |  |  |
| 10 | `tagline` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| organizations_custom_domain_key | UNIQUE | `UNIQUE (custom_domain)` |  |  | sim |
| organizations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| organizations_slug_key | UNIQUE | `UNIQUE (slug)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.org_members | org_members_org_id_fkey | {org_id} | CASCADE |
| public.org_theme_history | org_theme_history_org_id_fkey | {org_id} | CASCADE |
| public.sales_campaigns | sales_campaigns_org_id_fkey | {org_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| organizations_custom_domain_key | btree | {custom_domain} | sim | sim |  | `CREATE UNIQUE INDEX organizations_custom_domain_key ON public.organizations USING btree (custom_domain)` |
| organizations_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id)` |
| organizations_slug_key | btree | {slug} | sim | sim |  | `CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug)` |


## Policies (RLS)

### `Org admins can update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `is_org_admin(auth.uid(), id)` |
| WITH CHECK | `is_org_admin(auth.uid(), id)` |

### `Public can read org branding`

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
| update_organizations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
