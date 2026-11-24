# Assercoes do motor de Pesquisa de Clima

Testes SQL que exercitam `supabase/migrations/20261123180000_climate_survey_engine.sql`
sobre um Postgres 16 efemero, sem depender de projeto Supabase.

```
bash supabase/tests/climate/run.sh   # requer Docker
```

O runner aplica `stubs.sql`, aplica a migration **duas vezes** (prova de
idempotencia) e roda `assertions.sql` com `ON_ERROR_STOP=1`: qualquer assercao
falsa aborta com erro.

`stubs.sql` nao e' migration. Ele monta o minimo que a migration espera do
Supabase: `auth.uid()` lendo o GUC `app.user_id`, `has_role()` lendo
`app.is_admin`, os papeis `anon`/`authenticated`, o enum `climate_pillar`, as 5
tabelas `climate_*` com as politicas **originais** (as que a migration endurece)
e os grants de tabela do cliente.

Cobertura das assercoes:

| Bloco | O que prova |
| --- | --- |
| placar por pilar | 2 pilares com media 50/80; reexecucao idempotente; amostra abaixo do minimo zera o placar; pilar removido para de pontuar; pesquisa inexistente nao escreve |
| piso de anonimato | 5 respondentes na pesquisa mas so 2 no pilar `autonomy` => pilar omitido; `p_min_responses` do cliente nao reduz o piso de 5 |
| eNPS | 4 promotores + 1 detrator = 60; suprimido (nao zero) quando nao ha nota elegivel; suprimido com 4 respondentes mesmo pedindo minimo 1 |
| envio atomico | periodo encerrado e periodo futuro recusados; rascunho recusado; payload vazio, nota fora da escala e pergunta de outra pesquisa recusados; envio duplicado viola unicidade |
| RLS | cliente nao insere resposta nem nota direto; autor (e admin) so ve a propria resposta/nota; nao-admin nao chama o recalculo interno nem le eNPS alheio; pergunta publicada nao pode ser excluida; rascunho pode |

Este diretorio fica fora de `supabase/migrations/`, entao nao entra no ratchet de
migration-drift. A CI do repositorio nao sobe Postgres, portanto estes testes sao
executados localmente/sob demanda pelo comando acima.