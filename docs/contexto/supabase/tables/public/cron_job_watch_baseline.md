# public.cron_job_watch_baseline

> Primeira vez que o vigia dos jobs viu cada job. Job sem linha aqui nunca foi observado, entao nao e' tratado como parado.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `jobname` | `text` | não |  |  |  |
| 2 | `visto_em` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cron_job_watch_baseline_pkey | PRIMARY KEY | `PRIMARY KEY (jobname)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cron_job_watch_baseline_pkey | btree | {jobname} | sim | sim |  | `CREATE UNIQUE INDEX cron_job_watch_baseline_pkey ON public.cron_job_watch_baseline USING btree (jobname)` |


## Policies (RLS)

> ⚠️ RLS habilitado **sem policies**: nenhum acesso via API (anon/authenticated).



## Triggers

_nenhum_


## Grants

_nenhum_
