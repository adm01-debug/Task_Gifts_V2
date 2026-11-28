# public.opinion_tags

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
| 2 | `opinion_id` | `uuid` | não |  |  |  |
| 3 | `tag` | `text` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| opinion_tags_opinion_id_fkey | FOREIGN KEY | `FOREIGN KEY (opinion_id) REFERENCES opinions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| opinion_tags_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_opinion_tags_opinion_id | btree | {opinion_id} | não | sim |  | `CREATE INDEX idx_opinion_tags_opinion_id ON public.opinion_tags USING btree (opinion_id)` |
| opinion_tags_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX opinion_tags_pkey ON public.opinion_tags USING btree (id)` |


## Policies (RLS)

### `Manage opinion tags`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM opinions o   WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
