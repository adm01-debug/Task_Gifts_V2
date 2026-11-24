# Banco de dados — referência para agentes

Ler quando for rodar SQL, criar/aplicar migration, montar Postgres local ou auditar o schema.
Resumo das regras no `AGENTS.md`; aqui está o detalhe. Errar o projeto já custou retrabalho real
neste repo.

## Onde se trabalha

| Situação | Banco | Como |
|---|---|---|
| Diagnóstico | **produção, só leitura** | `SELECT` pelo MCP `supabase` do `.mcp.json`; nunca escrita para "testar" |
| Migration nova | arquivo em `supabase/migrations/` | PR → merge → deploy do código → apply (abaixo) |
| Teste de comportamento de banco | **Postgres descartável** | nunca no banco oficial |
| Prova de caminho interno que só existe em produção (trigger → edge → notificação) | **produção, com autorização do dono do projeto** | exceção à linha acima: Postgres descartável não tem o segredo do Vault nem a edge real. Uma linha sintética mínima (ex.: `security_alerts` `critical` com `[TESTE]` no título), conferir `net._http_response` e a notificação criada, e apagar as linhas na mesma sessão. Feito em 2026-11-24 para o `trigger_dispatch_critical_alert`: 200 e `in_app_notifications: 1`, depois `security_alerts` de volta a 0. O passo do Slack respondeu `skipped` (sem `SLACK_ALERT_WEBHOOK_URL` no projeto), então não sobraram mensagens para apagar — **com** o webhook configurado o aviso de teste fica no canal e não sai ao apagar as linhas: avise o dono antes |
| Migration destrutiva, segredos, rotação de chaves | **só com o dono do projeto** | — |

1. **O app aponta para produção por padrão.** `src/integrations/supabase/client.ts:5-6` lê
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do ambiente, sem fallback e sem desvio para
   banco local. `bun run dev` com o `.env` de produção fala com **produção** — confira antes de testar tela.
2. **Não há `.env` versionado** (só `.env.example`, e `.gitignore` cobre `.env`). Quem for rodar local
   precisa criar o seu. Atenção: `.env.example` documenta `VITE_SUPABASE_ANON_KEY`, mas o código lê
   `VITE_SUPABASE_PUBLISHABLE_KEY` — ver "Divergências conhecidas".
3. **Migrations deste repo criam jobs de `pg_cron` com URL e chave fixas em SQL** (ex.
   `supabase/migrations/20260712194718_bff07c8c-5744-4682-bba1-33f9ca2a1ecb.sql:4-5`). Um Postgres local
   montado com essas migrations faz POST nas edge functions **reais** se `pg_cron`/`pg_net` estiverem
   ativos. Antes de aplicar migrations em qualquer Postgres local: aponte o host do projeto para
   `127.0.0.1` no `/etc/hosts` do contêiner e `alter system set cron.launch_active_jobs = off`.

## Banco OFICIAL

| O que | Valor |
|---|---|
| Projeto Supabase em uso | **`eidsaqymojyuhprobfpn`** |
| URL | `https://eidsaqymojyuhprobfpn.supabase.co` (valor de `VITE_SUPABASE_URL`) |
| Dashboard | https://supabase.com/dashboard/project/eidsaqymojyuhprobfpn |
| MCP para SQL | servidor **`supabase`** declarado em `.mcp.json` (gateway Cloudflare Worker `supabase-eidsaqymo-mcp`) — acesso total: `SELECT/INSERT/UPDATE/DELETE/DDL` |
| Ledger de migrations | **existe** (`supabase_migrations.schema_migrations`, **281 versões para 281 arquivos**, medido em 2026-11-24T17:46Z — nenhum arquivo sem registro). Mesmo assim **não é fonte de verdade** do estado dos objetos; ver regra 2 |
| Migrations no repo | 281 arquivos `.sql` em `supabase/migrations/` |

### Projetos que NÃO são este (não escrever neles)

- **`awzhgfmqwddzgbqzqusc`** — era o `project_id` em `config.toml` e estava hardcoded em migrations/cron;
  ambos foram corrigidos (PR #33 e fix de migrations 2026-11). **Não é o projeto que o app usa**; nunca
  escreva nele.
- **`pgxfvjmuubtbowutlide`** — MCP "SUPABASE - GESTÃO DE CLIENTES" (CRM). Projeto externo, **só leitura**.
- **`doufsxqlfjyuvxuezpln`** — MCP "SUPABASE - GESTÃO DE PRODUTOS" (Catálogo). Projeto externo, **só leitura**.
- Qualquer MCP com nome parecido carregado na sessão: **confira qual é** (`get_project_url` /
  `db_connection_info`) antes de rodar SQL.

## Segredo exposto — leia antes de tocar em `.mcp.json`

`.mcp.json` é versionado e contém a URL do gateway de SQL; o segmento hexadecimal do caminho é o
**único fator de autenticação** e dá execução de SQL arbitrário no banco de produção. O repositório é
**público** desde 2026-10-29 (`PENDENCIAS.md`, P-001) — ou seja, qualquer pessoa na internet tem hoje
controle total do banco por esse endpoint. Não é tarefa de agente resolver sozinho (envolve rotação de
credencial e decisão do dono), mas:

- **nunca** imprima, copie para outro arquivo, cole em PR/issue/comentário ou mande para serviço externo;
- **nunca** "melhore" o arquivo mexendo na URL — rotação é com o dono;
- se o dono pedir, o caminho é: gerar novo token no Worker → mover para fora do versionamento →
  `git rm --cached .mcp.json` + entrada no `.gitignore` → invalidar o antigo.

## Regras de migration

1. **Ordem obrigatória: arquivo → PR → merge em `main` → deploy do código → apply.** Nunca DDL a partir
   de branch aberta. `REVOKE`, `DROP`, rename ou mudança de contrato de função usada pelo front/edges:
   **nunca** antes do deploy do código correspondente.
2. **Toda migration idempotente** — `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY` guardado por
   `DROP POLICY IF EXISTS`, `INSERT ... ON CONFLICT DO NOTHING` (o
   `.github/PULL_REQUEST_TEMPLATE.md` cobra isso). O ledger (`supabase_migrations.schema_migrations`)
   **existe** e **cobre o repo hoje** (contagem na tabela do **Banco OFICIAL**, acima), mas a linha
   registrada diz que *a versão foi marcada como aplicada* — por execução do arquivo ou por registro
   manual depois de conferir os objetos-chave (foi o caso de seis versões em 2026-11-24) — e não *em que
   estado* ficaram os objetos. Reaplicar idempotente continua sendo o modo normal de operar: uma migration
   não idempotente trava o próximo apply.
3. **Versão sem colisão:** antes de criar arquivo, no mesmo turno: `ls supabase/migrations | tail` e busca
   de PRs abertas tocando `supabase/migrations/`. O padrão de nome vigente é `AAAAMMDDHHMMSS_<slug>.sql`
   (os arquivos antigos usam `_<uuid>`; para arquivo novo prefira o slug descritivo).
4. **RLS obrigatória em toda tabela nova** — é o padrão do projeto (a auditoria de 2026-08 mediu RLS em
   100% das tabelas; não regrida isso). Policy mínima: `SELECT` para o dono da linha / papel autorizado,
   escrita por `service_role` ou policy específica. `GRANT` explícito para `authenticated`/`service_role`
   quando a função/tabela for consumida por edge.
5. **`CREATE INDEX CONCURRENTLY` não funciona pelo MCP** (a chamada é envolvida em transação) — use
   `CREATE INDEX` simples. `VACUUM` também não roda por lá.
6. **O estado real do banco é a verdade, não o arquivo.** O ledger diz que a migration rodou, não que o
   objeto ficou como o arquivo descreve (funções alteradas direto no banco, ordem de aplicação), então só a
   introspecção prova o que está vivo: `pg_get_functiondef`, `pg_policies`, `pg_indexes`,
   `information_schema.columns`. Antes de criar um objeto "ausente", confira se ele já existe com outro nome.
7. Objetos que o código assume e que a auditoria de 2026-08 não encontrou no banco (confira antes de usar):
   `email_outbox`, `push_devices`, `webhook_deliveries`, `public.security_logs`. Se o seu fix depende de um
   deles, o primeiro passo é a migration, não o patch no front.
8. **Arquivo `.sql` de migration sem BOM.** O CLI lê o arquivo como SQL cru: um `EF BB BF` no começo faz o
   Postgres devolver `syntax error at or near "\ufeff"` (SQLSTATE 42601) já no statement 0 e o check
   `Supabase Preview` reprova. Grave sempre UTF-8 **sem** BOM — no Windows PowerShell 5.1 `Set-Content` e
   `Out-File -Encoding utf8` gravam BOM por padrão (no PowerShell 7, `utf8` já é sem BOM; com BOM é
   `utf8BOM`); confira os 3 primeiros bytes antes de commitar. O guarda `scripts/db-audit/check-migration-drift.mjs`
   (job `quality`) acusa o caso como `codificacao`.

## Divergências conhecidas (confirmar antes de agir)

| Divergência | Evidência | Efeito |
|---|---|---|
| Ledger × repo (regularizado em 2026-11-24) | Fecham em **281 × 281**: medido em 2026-11-24T17:46Z, `supabase_migrations.schema_migrations` tem 281 versões e todas as 281 versões de `supabase/migrations/*.sql` estão registradas (a `20261224130000`, antecipação do fim da pesquisa de clima da PR #148, entrou às 17:46Z) — **zero** arquivo sem registro (comparação versão a versão, `so_no_ledger` e `so_no_repo` vazios). Eram 277 até 14:15Z; as três migrations de 24/11 (`20261224100000`, `20261224110000`, `20261224120000`) entraram no ledger ao serem aplicadas. Antes disso, os dois pendentes (`20261218000000`, `20261220000000`) entraram após a auditoria das 14:00Z; mais quatro (`20261109120000`, `20261114110500`, `20261122140000`, `20261123000000`) entraram na mesma rodada — `xmin` consecutivos 1752544-1752547, na ordem de versão, parando exatamente no arquivo com BOM que o check acusa; nesses, a conferência foi por introspecção dos objetos-chave, não pela execução integral do SQL | o ledger **não** prova banco == repo, só que a versão foi **marcada** como aplicada — não que o SQL de cada arquivo rodou; introspecção continua obrigatória |
| Migration duplicada e obsoleta removida (2026-11-24) | `20261123000001_create_acknowledge_security_digest.sql` era um rascunho anterior da mesma RPC, com BOM, nunca registrado no ledger e **sem** o gate de papel. Em produção a versão viva é a de `20261122140000` — exige `has_role(admin/manager)` e faz `REVOKE ALL ... FROM PUBLIC`; conferido com `pg_get_functiondef`. Como o CLI aplica pendências em ordem de versão, o rascunho (versão maior) sobrescreveria a versão boa e derrubaria o gate | o arquivo foi deletado: nenhuma função muda hoje e o próximo apply deixa de rebaixar o `acknowledge_security_digest` |
| Versão do ledger com nome de arquivo (corrigida em 2026-11-24) | a linha `20261114134238_9b119528-da6f-4f43-b6cb-dcdcd7aa7ab1` tinha `version` = nome completo do arquivo, mas o CLI deriva a versão só até o primeiro `_`; a comparação repo×banco falhava e o check `Supabase Preview` reprovava em toda PR. Normalizada em produção: `version = '20261114134238'`, `name` intacto, 1 linha afetada, nenhum objeto do banco tocado | o CLI volta a reconhecer a migration; nada mudou em dados ou objetos |
| `trigger_dispatch_critical_alert` reconciliado (2026-11-24) | produção lê `_internal.dispatch_config`; `20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` foi alinhado em 2026-11-24 ao corpo vivo — Vault primeiro, depois `dispatch_secret`, depois `cron_secret`, com a URL lida de `project_url` — corpo idêntico byte a byte ao `pg_get_functiondef` (2.427 chars); `20261224120000_dispatch_critical_alert_config.sql` reescreve a função de novo — a definição viva em produção é a desse arquivo (conferido por `pg_get_functiondef`: 2603 chars, contém `_internal.dispatch_config`/`dispatch_secret`/`x-internal-secret` e **não** contém `v_project_url TEXT :=`). Os dois segredos em jogo têm 64 chars e **não** são iguais (conferido em 2026-11-24: comparação direta entre `vault.decrypted_secrets` (`internal_dispatch_secret`) e `_internal.dispatch_config.cron_secret` → `iguais = false`), e a tabela **não** tem a chave `dispatch_secret` — o trigger autentica pelo Vault e os jobs do cron pelo `cron_secret` | aplicar os dois na ordem do CLI (`20261220000000` e depois `20261224120000`) é no-op de comportamento, e reaplicar **só** `20261220000000` sobre a base atual também é — o corpo do arquivo ficou igual ao vivo; a entrega do alerta foi medida ponta a ponta em 2026-11-24T17:45:27Z (alerta `critical` de teste → `net._http_response` 200 com `in_app_notifications: 1` → notificação in-app do admin; as linhas de teste foram removidas e `security_alerts` voltou a 0); sem segredo em nenhuma fonte o trigger avisa e NÃO dispara (nunca chama a edge function sem autenticar) |
| Jobs internos de cron (resolvido em 2026-11-24) | `20261224110000_cron_internal_jobs_drift.sql` cria `_internal.dispatch_config` (RLS ligada), grava `project_url` e semeia `cron_secret` copiando o header de um dos cinco jobs medidos, depois reagenda os cinco (#30–#34) por `cron.schedule`, lendo URL e segredo em tempo de execução; recusa-se a agendar sem credencial. Conferido em `cron.job`: 5 jobs `active=true`, nenhum comando com JWT literal | antes disso os jobs #31/#32 não existiam em migration nenhuma e #30/#33/#34 carregavam a anon key de `awzhgfmqwddzgbqzqusc` em texto claro; reconstruir hoje reproduz a autenticação correta **desde que `cron_secret` exista em `_internal.dispatch_config`**: em banco novo a semeadura (`:57-72`) não tem header antigo para copiar e o guard (`:104-111`) recusa agendar (ver `docs/estado/05-edge-functions.md` §3) |
| `VITE_SUPABASE_ANON_KEY` no `.env.example`, `VITE_SUPABASE_PUBLISHABLE_KEY` no código | `.env.example:9` vs `src/integrations/supabase/client.ts:6` | quem seguir o example sobe o app sem chave; dois testes de segurança (`src/test/rls.test.ts`, `src/test/rpcAccess.test.ts`) ficam `skip` por causa dessa variável |
| Anon key errada em SQL de cron | `supabase/migrations/20260712194718_*.sql:5`, `20260712203400_*.sql:11` | URL corrigida; a anon key de `awzhgfmqwddzgbqzqusc` continua nos arquivos, mas `20261224110000` recria os cinco jobs depois deles lendo `cron_secret` de `_internal.dispatch_config`, então os cinco jobs carregam `x-internal-secret` e **nenhum usa a anon key**. O 200 medido em `net._http_response` cobre #30–#32 e #34; o digest semanal (#33, `0 13 * * 1`) fica **fora** da janela de 6 h observada e não tem resposta medida (ver `docs/estado/05-edge-functions.md:207`). O `UPDATE cron.job` de `20261109120000` é guardado por exceção: `postgres` não tem UPDATE em `cron.job` (conferido: `has_table_privilege = false`), então ele aplicava 42501 e abortava a migration |

Sessões paralelas commitam no mesmo repo e no mesmo banco: re-sync antes de editar e confira o estado
real do objeto antes de criar/alterar.
