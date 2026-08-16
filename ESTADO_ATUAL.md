# Estado Atual do Sistema — TaskGifts v2

**Auditoria de estado · 2026-08-16 · branch `claude/system-status-roadmap-9f4hf9`**

Levantamento do que o sistema **deveria** fazer versus o que **de fato** está implementado e
funcionando. Método: medição direta de 242.673 linhas de código e do banco de produção em modo
somente leitura. Documentação do projeto tratada como hipótese, nunca como fonte.

Detalhamento por dimensão em [`docs/estado/`](./docs/estado/).

> ### ⚠️ Este documento passou por uma segunda passada de validação
> Uma revisão adversarial tentou refutar cada conclusão e caçar o que ficou de fora. Ela achou
> **um erro material** (a afirmação sobre Edge Functions estava errada), **uma lacuna crítica**
> (segredo de banco versionado em `.mcp.json`), quatro achados exagerados e seis números incorretos.
> Tudo está corrigido abaixo e documentado, com o original preservado, em
> [`docs/estado/09-validacao-e-errata.md`](./docs/estado/09-validacao-e-errata.md).

---

## Veredito em uma tela

**O sistema é uma plataforma grande, bem modelada e essencialmente não operante.**

Existem 242 mil linhas de código, 233 tabelas com RLS completa, 265 funções de banco, 36 Edge
Functions e 82 telas roteadas. A engenharia é séria: RLS em 100% das tabelas, nenhuma abertura de
escrita para anônimo, arquitetura consistente, quase nenhum `TODO` abandonado.

E, ainda assim:

- **Nenhum usuário final jamais usou o sistema.** Existem 6 contas: 4 sintéticas que nunca
  autenticaram e 2 administrativas, a última com login em 2026-08-06.
- **70,4% das tabelas (164 de 233) nunca receberam uma única escrita.** A maior tabela do sistema
  tem 48 linhas.
- **34 das 36 Edge Functions estão inalcançáveis pelo frontend** — um kill-switch de uma linha
  desliga quase todas. *(Corrigido: a versão original dizia "as 36" e afirmava não haver rota de
  escape. Há duas.)*
- **Um segredo de acesso total ao banco de produção está versionado no git** (`.mcp.json`).
- **O CI nunca executou um único comando** desde que existe: o YAML é inválido. 372 execuções, 100%
  falha.
- **Um job de produção falha a cada 30 minutos há 364 execuções seguidas**, em silêncio.
- **Um job fantasma, que não existe no repositório, reescreve diariamente o perfil do dono do
  sistema** com um nome fictício.

O trabalho feito é real e de qualidade acima da média. O que falta não é código — é **ligar o que
já existe**, e três desses "ligar" são de uma linha cada.

---

## Contagem honesta

828 unidades auditadas (arquivos de página, componente, hook, service, módulo de lib e Edge
Function). Unidades heterogêneas: em alguns lotes a unidade é o arquivo, em outros a feature
agrupada — o denominador está declarado em cada documento de detalhe.

| Classificação | Unidades | % |
|---|---:|---:|
| ✅ IMPLEMENTADO_TOTAL — *fio de código completo* | 445 | 53,7% |
| 🟨 IMPLEMENTADO_PARCIAL | 307 | 37,1% |
| 🟦 SUGERIDO_OU_INICIADO | 7 | 0,8% |
| ⬛ MORTO_OU_ABANDONADO | 69 | 8,3% |

### A correção que muda a leitura da tabela acima

A regra de ouro desta auditoria é *pronto = em produção com uso real*. Os 445 ✅ significam **"o fio
de código está completo"** — UI, lógica e persistência existem e se conectam. Não significam uso.

Aplicando a regra de ouro contra o banco vivo:

| Critério | ✅ |
|---|---:|
| Fio de código completo | **445** |
| **Com evidência de uso real por usuário final** | **0** |

Nenhuma funcionalidade de negócio deste sistema pode ser honestamente classificada ✅ hoje. Isso não
é um defeito do código — é a constatação de que **o sistema nunca entrou em operação**.

**Precisão sobre "uso"** *(refinado na validação)*: nenhum **usuário final** usou o sistema, mas
houve **smoke-test manual de administrador** em algumas mecânicas, com rastro identificável —
`user_achievements`, `user_cards` e `scratch_cards` contêm linhas pertencentes **apenas** às 2
contas que de fato autenticaram, e raspadinha e cartas só geram registro por clique humano. Já
`auction_bids`, `pulse_responses` e `department_war_contributions` pertencem às 4 contas que nunca
logaram: são seed programático.

> **Errata da minha própria condução.** Ao distribuir o trabalho, instruí os agentes de gamificação
> e RH a tratar "tabela com linhas" como evidência de uso real. Isso estava errado: as linhas
> existentes são seed e teste manual de administrador, feitas por contas que em 4 dos 6 casos nunca
> logaram. Corrigi a classificação na consolidação em vez de propagar a premissa.

### Código morto medido

68 unidades sem caminho de execução **em produção**, com piso medido item a item de **7.852 linhas**
(2.592 em 17 arquivos + 5.260 nas 18 Edge Functions sem chamador). *(Corrigido: o "≈9.500" original
somava relatos de lote que eu nunca recontei; e eram 19 functions sem chamador, não 18 — `ai-coach`
tem chamador via `fetch` cru.)*

**Cuidado antes de apagar:** 8 dos 9 módulos órfãos de `src/lib` **são importados por testes**. Só
`exportReports.ts` (537 linhas) tem zero consumidores em qualquer lugar. Os maiores blocos:
`src/components/ui` (12 órfãos, incl. `sidebar.tsx` 643 ln), Edge Functions (19 sem chamador),
`src/lib` (9 módulos, 1.475 ln, incl. `exportReports.ts` com 537 ln e zero referências),
`src/components/social/` (diretório inteiro), `src/utils/formatters.ts` (49 ln, zero importadores,
funções reimplementadas localmente em outros arquivos).

No nível de função, e não de arquivo: **96 dos 486 hooks exportados (19,8%) não têm nenhum chamador.**

---

## Riscos estruturais, por gravidade

### 🔴 0. Um segredo de acesso total ao banco está versionado no repositório

`.mcp.json:4` contém `https://supabase-eidsaqymo-mcp.adm01.workers.dev/<32 hex>/mcp`. O segmento
hexadecimal do caminho é o **único fator de autenticação** desse gateway, e ele expõe execução de
SQL arbitrário — `SELECT/INSERT/UPDATE/DELETE/DDL`, acesso total. Foi por esse endpoint que esta
auditoria leu o banco.

Versionado desde `df2d2d5`; o `.gitignore` não cobre o arquivo. **Quem tem acesso de leitura ao
repositório tem controle total do banco de produção.** Atenuante: o repositório é privado — o que
limita a exposição, mas não torna aceitável um segredo equivalente a bearer, sem rotação, em texto
claro no controle de versão.

Diferente do risco nº 2, este **não é condicional**. Recomendo rotacionar o segredo do gateway e
remover o arquivo do versionamento antes de qualquer outra ação desta lista.

*(Achado pela revisão de validação. A auditoria original leu este arquivo na Fase A e não o
classificou.)*

### 🔴 1. Qualquer usuário autenticado pode se dar XP, moedas e nível arbitrários

`profiles` tem as colunas `xp`, `coins`, `level`; o grant de `UPDATE` existe para `authenticated`; a
policy é `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` — **sem restrição de coluna** — e não
há trigger protegendo esses campos (o único trigger da tabela é `update_profiles_updated_at`).

Um `PATCH` direto na API REST concede saldo infinito. A economia inteira — loja, leilões, apostas,
roleta — depende desses valores. O código agrava: 6 serviços fazem *read-modify-write* de saldo no
cliente (`avatarService.ts:140-161`, `achievementsService.ts:95-109`, `comboService.ts:90-134`,
`leaguesService.ts:228-246`), quando o padrão correto com RPC `SECURITY DEFINER` já existe e é usado
em auction/luckyWheel/boardTrail.

### 🔴 2. `external-db-bridge` dá controle total do banco a qualquer usuário logado

`supabase/functions/external-db-bridge/index.ts:88` cria o cliente com `SUPABASE_SERVICE_ROLE_KEY`
(ignora RLS). A única checagem é `verifyUser(req)` na linha 92 — um JWT de usuário comum. A partir
daí, `action:"query"` (linhas 215-296) aceita **tabela arbitrária** e operação
`select|insert|update|delete` com dados arbitrários, sem allowlist de tabela e sem checagem de papel.
Inclui `user_roles` — ou seja, autoconcessão de `admin`.

`NAO_VERIFICADO`: não consigo confirmar se a função está deployada (exige token de Management API).
Se estiver, é escalação de privilégio completa. O bloqueio do frontend **não protege** este endpoint,
que é HTTP público.

Na mesma família: `bitrix24-api/index.ts:111-135` expõe um módulo `raw` que proxia qualquer método
REST do Bitrix com o token OAuth corporativo, sem autenticação.

### 🔴 3. O 2FA pode ser contornado com qualquer código

Cadeia confirmada linha a linha:
1. `src/pages/Auth.tsx:185` executa `supabase.auth.signOut()` **antes** da verificação do segundo fator.
2. A sessão passa a ser anônima.
3. A RLS de `user_two_factor` é `TO authenticated` → o `SELECT` de `verifyToken` falha.
4. `src/services/twoFactorService.ts:144-146`: `if (error || !data?.is_enabled) return true;`
   — comentado como *"2FA not enabled, allow access"*.

Qualquer código digitado é aceito. Agravantes: os códigos de backup são gerados com `Math.random()`
(`twoFactorService.ts:29`) e o segredo TOTP trafega para o navegador.

O WebAuthn tem o problema irmão: `webauthnService.ts:271-345` **nunca verifica a assinatura** contra
a `public_key` armazenada nem confere o challenge — a autenticação se resolve num `SELECT` por
`credential_id`. A UI anuncia "não pode ser roubado por phishing" (`PasskeysPanel.tsx:261`).

> Mitigação de fato hoje: `user_two_factor` e `webauthn_credentials` estão **vazias** — ninguém
> ativou 2FA nem passkey. O risco é de ativação, não de exploração corrente.

### 🟠 4. 34 das 36 Edge Functions estão desligadas por um kill-switch de uma linha

`.env:25` contém `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio). `src/lib/edgeAvailability.ts:49` faz
`if (allowlist.size === 0) return false`. `src/lib/requestId.ts:131` devolve um 404 sintético **sem
tocar a rede**. São **18 call sites em 15 arquivos**, cobrindo 13 das 36 funções, todos por esse
wrapper.

> **Correção da versão original.** Eu havia escrito "as 36" e "não há rota de escape". Errado:
> procurei `functions.invoke` e não procurei `fetch` cru. Duas funções escapam do kill-switch —
> `ai-coach` (`src/hooks/useAICoach.ts:15`, `fetch` em `:54` e `:133`) e `trail-recommendations`
> (`src/components/manager/TeamCompetencyDashboard.tsx:68`) — batendo direto em
> `${VITE_SUPABASE_URL}/functions/v1/…`. Justamente as duas que **gastam créditos de IA**. Ambas
> mandam a chave anônima como `Bearer` em vez do JWT do usuário, então a função não sabe quem
> chamou, e ambas ficam fora do contrato de retry, erro e telemetria.

Consequência direta e medida: IA (`ai_coach_messages`=0, `ai_course_jobs`=0), push
(`push_subscriptions`=0, `push_outbox`=6 represados), webhooks (`webhook_delivery_logs`=0),
verificação de IP/geo, alertas administrativos e análise de risco de resgate — tudo inerte.

**O `.env.example:22` documenta o comportamento oposto ao do código**: *"Deixe vazio durante
desenvolvimento local (todas liberadas)"*. É a armadilha da documentação canônica invertida, e
provavelmente a origem do problema.

### 🟠 5. Controles de segurança que falham abertos

- **Guard de IP:** `IpAccessGuard.tsx:29` e `Auth.tsx:51` liberam o acesso quando `verify-ip` não
  está na allowlist — que é sempre. Todos os caminhos de erro também liberam. A tela "Acesso Negado"
  é inalcançável. No servidor, `verify-ip/index.ts:139-145` e `verify-geo/index.ts:186-194` retornam
  `allowed:true` em qualquer exceção.
- **Senha vazada — falha em 100% das execuções, não eventualmente:** `authValidations.ts:94` chama
  `https://api.pwnedpasswords.com`, domínio **ausente** do `connect-src` da CSP (`index.html:6`). A
  requisição é bloqueada pelo próprio navegador, sempre, e `:100,:116` retornam `{isLeaked:false}`.
  A verificação de senha vazada nunca funcionou. *(Agravado pela validação; a versão original dizia
  apenas "quando a API falha".)*
- **Assinatura de webhook:** `webhook-dispatcher:266-284` gera uma assinatura falsa de 32 bits
  rotulada `sha256=` quando `createHmac` falha.
- **Geolocalização por HTTP puro:** `verify-geo/index.ts:19` consulta `ip-api.com` sem TLS.

### 🟠 6. Nenhum portão de qualidade funciona

- `.github/workflows/ci.yml` é **YAML inválido**. As linhas 1-24 têm um espaço extra; na linha 25
  (`- name: Unit Tests`) a indentação salta de 7 para 8 colunas, abrindo um *block sequence* ilegal.
  Workflow inválido não gera job: **os 10 steps nunca executaram**. 372 execuções, 100% falha.
- **Consertar o YAML não basta:** `tsconfig.json:16-24` usa `"files": []` + `references`, e o script
  é `tsc --noEmit` **sem `--build`** → compila zero arquivos e sai com código 0. O `typecheck` é um
  no-op. (O `strict: true` está corretamente configurado em `tsconfig.app.json:17-19` — o problema é
  que nada o executa. `vite build` usa SWC e também não checa tipos.)
- **1.618 casos de teste nunca rodaram em CI.** Além disso: ~2.900 linhas são *testes-espelho* que
  reimplementam a lógica em vez de importá-la (prova: `src/test/external-db-bridge.test.ts:47,56`
  redefine `formatTime` e `getTimeThreshold`, que são exports byte-idênticos de
  `src/pages/AdminTelemetria.tsx:60,44`); 12 casos de RLS/RPC estão desligados por uma env var que
  não existe; o E2E navega para rotas protegidas sem autenticar e usa seletores inexistentes.
- O deploy real acontece pela plataforma Lovable, **fora** do GitHub Actions — portanto sem gate algum.
- **Três lockfiles versionados** (`bun.lock`, `bun.lockb`, `package-lock.json`) e nenhum campo
  `packageManager` em `package.json`. O CI usa `bun install`, então o `package-lock.json` é
  decorativo e divergente — quem instalar com `npm` monta outra árvore de dependências.

Números corrigidos nesta seção: são **347** execuções do `ci.yml` (o 372 original somava o workflow
do Dependabot), e o "100% de falha" — antes extrapolado de uma amostra de 30 — agora é censo:
`status=success` → 0; `status=failure` → 347.

### 🟠 7. O ambiente não é reconstruível a partir do repositório

- **Não existe `supabase_migrations.schema_migrations`.** As 262 migrations do repo não estão
  rastreadas: não há como provar que o banco corresponde ao código.
- Números divergem em todas as dimensões: repo declara 228 tabelas / 244 funções / 579 policies; o
  banco tem 233 / 265 / 536.
- **Job fantasma:** `update-profile-name-daily` roda em produção e `grep -rin "Abner"` no repositório
  inteiro retorna **zero ocorrências**.
- `supabase/config.toml:1` aponta para o projeto `awzhgfmqwddzgbqzqusc`; o app usa
  `eidsaqymojyuhprobfpn`.
- `supabase/config.toml` tem **uma linha só** — sem bloco `[functions]`, logo sem `verify_jwt=false`
  para os webhooks que dependem de HMAC/`x-api-key`, que ficam inatingíveis por chamador externo.
- Objetos assumidos pelo código/doc e inexistentes no banco: `email_outbox`, `push_devices`,
  `webhook_deliveries`, `public.security_logs`.

### 🟠 8. Falhas silenciosas em produção

- **`close-expired-campaigns`: 364 falhas, 0 sucessos**, a cada 30 minutos, sempre
  `ERROR: column "goal_amount" does not exist`. A função referencia coluna que não existe
  (o nome correto é `target_global`). Nenhuma campanha jamais foi encerrada automaticamente.
- **Cadeia cron→edge quebrada:** 4 migrations declaram `net.http_post`; duas não enviam
  `Authorization` (401) e duas enviam a anon key onde se exige service-role (401). Nenhum dos 4 jobs
  está ativo.
- **RPCs inexistentes chamadas com `success:true`:** `increment_user_xp_coins`
  (`birthday-celebrations:89,154`), `add_user_xp` (`bitrix24-webhook:339`), `add_user_rewards`
  (`external-webhook:722`). XP e moedas nunca são creditados, e a resposta é de sucesso.
- **`acknowledge_security_digest`** é chamada em `SecurityDigests.tsx:57` atrás de um
  `(supabase.rpc as any)` com `eslint-disable`. Confirmei no banco: **a função não existe**. Todo
  clique no botão falha.
- **Auditoria que não audita:** `auditService.ts:66-73` nunca verifica o erro do insert e tem um
  `catch {}` vazio comentado como `// Silently fail` — cobrindo justamente as operações de XP.

### 🟡 9. Métricas fictícias apresentadas como reais

O padrão mais perigoso para a tomada de decisão, porque não parece defeito. Nenhum destes tem
`TODO` ou `mock` no nome — estão escritos como código normal:

| Onde | Evidência | O que é exibido |
|---|---|---|
| `pages/ExecutiveDashboard.tsx:34-43` | `trainingCompletionRate*500 + punctualityRate*300` | "Custo Turnover Evitado" com prefixo `R$` |
| `pages/ExecutiveDashboard.tsx:140` | — | literalmente `"Ano anterior: null%"` |
| `pages/BIDashboard.tsx:128-138` | constantes `12/18/25/8` | tendências `+12%`, `+18%`… |
| `pages/BIDashboard.tsx:66-73` | offsets fixos | radar de competências |
| `admin/MoodAnalytics.tsx:52-58` | `// Mock team data for demonstration` | clima "por departamento", com departamentos inexistentes |
| `admin/MoodAnalytics.tsx:24` | histórico pessoal do admin | distribuição de humor "da equipe" |
| `engagementReportsService.ts:306` | `3.5 + completions/10*0.5` | avaliação em estrelas |
| `engagementReportsService.ts:356` | `completions * 0.25` | horas de treinamento |
| `successionService.ts:103-105` | contadores fixos em 0 | `riskLevel` sempre `critical` |
| `ActivityHeatmap.tsx:281-303` | `Math.random()` | heatmap anual de atividade |
| `migrations/20251225223108…:490-503` | `"dados fictícios para exemplo"`, `sample_size=1500` | benchmark de clima de mercado |
| `cron.job` jobid 12 | job fantasma | `profiles.display_name = "Abner Pereira 9"` |

### 🟡 10. Funcionalidades completas e nunca conectadas

Código pronto, sem caminho de execução ou sem dado:

- **Três subsistemas sem entrada na navegação** (~4.779 linhas): `/chefao`, `/previsoes` e
  `/pergunta-do-dia` têm rota em `App.tsx` mas não constam em `AppSidebar.tsx:14-86` nem em
  `MobileDrawer.tsx:27-53`. É a causa mecânica de 11 tabelas zeradas.
- **Bitrix24 é órfão de ponta a ponta**: 1.017 linhas, 3 Edge Functions, 3 tabelas, OAuth completo —
  e **zero chamadores** em qualquer camada. `MobileDrawer.tsx:53` linka `/bitrix24`, rota que não
  existe entre as 83.
- **Diagnóstico de clima é inalcançável por design**: `MIN_RESPONDENTS=5` no cliente e no banco,
  contra 6 perfis e 4 departamentos. ~1.100 linhas e 7 RPCs travadas atrás do guard de anonimato.
- **Componentes prontos, importados e nunca renderizados**: `EditWebhookDialog` e `BulkRotateDialog`
  (`WebhooksAdmin.tsx:18-19`, com a RPC `bulk_rotate_webhook_secrets` existindo no banco),
  `SlaTargetEditor` (`SecurityRunbook.tsx:10`), 3 painéis em `SecurityDashboard.tsx:18-21`, 3
  componentes em `SalesCampaignDetail.tsx:15-18`, `OfflineIndicator` (`App.tsx:7`).
- **`GoalsManager` é 100% memória**: aba ativa do Admin, `handleSubmit`/`handleDelete` só chamam
  `setState` + `toast.success`. Zero Supabase. Perde tudo no F5.
- **`RolePermissionsManager` mente sobre gravar**: `Promise.all` sobre `mutation.mutate` (que retorna
  `void`) → o toast de sucesso dispara antes de qualquer escrita e o `catch` é inalcançável.
- **Desconto de Flash Sale exibido e não cobrado**: `FlashSalesBanner.tsx:184` envia o preço com
  desconto, mas `Shop.tsx:119` refaz o lookup e cobra o `price_coins` cheio.
- i18n completo em 3 locales com **zero componentes consumindo**; 24 schemas de validação em
  `validations.ts`, 2 usados.

---

## O que está bom

Seria desonesto sair daqui só com a lista de problemas. Estes pontos foram medidos e estão sólidos:

- **RLS exemplar.** 233 de 233 tabelas com RLS habilitado; **zero** tabelas com RLS ligado e sem
  policy (o erro clássico que bloqueia tudo em silêncio); **zero** políticas abertas de escrita para
  `anon`/`public`. As 31 leituras públicas são quase todas de catálogo. 250 das 265 funções são
  `SECURITY DEFINER`, e apenas **1** (`audit_lucky_wheel_prize`) não fixa `search_path`.
- **Higiene de código acima da média.** Em ~140 mil linhas auditadas em detalhe: praticamente nenhum
  `TODO`/`FIXME`/`mock` abandonado. Em `src/lib` e `src/hooks` especificamente, os `Math.random()`
  restantes são legítimos (larguras de skeleton, IDs de request, variação de frequência de áudio).
  O problema deste sistema não é código inacabado. *(Corrigido: a versão original generalizava isso
  para o sistema inteiro, contradizendo os próprios achados de `Math.random()` em códigos de backup
  de 2FA e no heatmap de atividade.)*
- **Nenhuma chave hardcoded em `src/`**, nenhum `eval`, e os 2 `dangerouslySetInnerHTML` estão
  sanitizados com DOMPurify + allowlist (`ModuleViewer.tsx:143-154`). *(Achado positivo registrado
  na validação.)*
- **Arquitetura consistente.** Camadas bem separadas (pages → hooks → services → Supabase), padrão
  de erro canônico em `edgeErrors.ts`, retry que corretamente **não** repete 429/4xx, idempotência
  por `dedupeKey` nas mecânicas monetárias mais recentes.
- **82 páginas, 83 rotas, zero órfãs e zero rotas apontando para componente inexistente.**
- **RBAC de verdade no servidor.** `get_security_stats` exige `_require_admin()`; a RLS de
  `audit_logs` está correta. A defesa não depende do cliente.
- **PWA configurada** (134 linhas de manifest/workbox em `vite.config.ts:14-152`, incondicional).
  *Sai da lista de "funcional" após a validação:* `public/` tem **três** service workers e só
  `push-sw.js` é registrado (`pushSubscriptionService.ts:44,82`); `public/sw.js` colide com o
  `dist/sw.js` que o próprio plugin gera — um sobrescreve o outro em silêncio — e `sw-push.js` não
  tem registrador algum. É 🟨 com colisão de build a resolver, não ✅.
- **Modelagem de dados madura**: 658 índices, 130 triggers, particionamento de responsabilidades
  claro, nomenclatura consistente em 233 tabelas.

---

## O que esta auditoria NÃO cobriu

- **Nada foi executado.** `node_modules` está ausente no ambiente: não rodei build, lint, typecheck
  nem um único teste. Toda afirmação sobre execução está marcada `NAO_VERIFICADO`. Em particular,
  **não afirmo que os testes passam** — afirmo que o CI nunca os rodou.
- **Deploy real das Edge Functions**: sem token de Management API, não consigo listar o que está
  publicado. O risco nº 2 depende disso e permanece condicional.
- Revisão semântica das 536 políticas RLS uma a uma (verifiquei estrutura, não regra de negócio).
- Corretude interna das 265 funções de banco, exceto as que falharam em execução real.
- Acessibilidade, performance de runtime, qualidade visual e responsividade.
- Backups, PITR, réplicas e configuração de rede do projeto Supabase.
- **A raiz do repositório não foi fatiada.** Fatiei por `src/` e `supabase/functions/`, e deixei de
  fora `index.html`, `.mcp.json`, os lockfiles e `docs/api/` — dois deles continham achado crítico,
  encontrado só na segunda passada. Corrigido acima, mas é a lacuna estrutural do meu fatiamento.
- **Bundle, assets e dependências não foram medidos** em profundidade: `manualChunks` importando o
  barril de `lucide-react` (`vite.config.ts:157-164`), `public/pwa-192x192.png` com 916 KB, e
  `xlsx@0.18.5` pinado sem caret são indícios levantados na validação, não análises completas.
- **Cobertura de leitura:** 86,4% dos 1.110 arquivos `.ts/.tsx` foram citados nominalmente. Os 151
  restantes são `src/test` (101), `src/tests/unit` (15), `src/stories` (25) e parte de
  `src/components/ui` — todos cobertos **em altitude** (contados, categorizados e classificados em
  bloco), conforme a regra de fatiamento. Os 8 arquivos que caíram entre escopos foram lidos e
  classificados por mim na consolidação.

---

## Próximos passos

### Barato e seguro — posso fazer sozinho, sem tocar em produção

1. **Corrigir o `ci.yml`.** É reindentação. Sem isso nenhum outro portão de qualidade importa.
2. **Corrigir o `typecheck`** para `tsc -b --noEmit` (ou apontar para `tsconfig.app.json`). Hoje o
   comando passa sem checar nada.
3. **Corrigir a semântica invertida da allowlist** — decidir entre "vazio = tudo liberado" (alinhando
   o código ao `.env.example`) ou corrigir o `.env.example`. Uma linha, e reativa **34** funções.
   *(Corrigido: a versão original dizia 36 e tratava isto como suficiente.)* **Não fecha o
   assunto:** `ai-coach` e `trail-recommendations` escapam por `fetch` cru e precisam migrar para
   `invokeEdgeSafe` num segundo movimento — hoje elas mandam a chave anônima em vez do JWT do
   usuário.
4. **Adicionar `.env` ao `.gitignore`.** Hoje ele está versionado e o `.gitignore` não menciona
   `env`. *(As variáveis atualmente no arquivo são a URL e um JWT com `role: anon` — públicas por
   design, então não há vazamento hoje; o risco é o próximo segredo que alguém adicionar.)*
   **Diferente de `.mcp.json`** (risco nº 0), que contém segredo real e exige rotação, não só
   `.gitignore`.
4b. **Corrigir a CSP** (`index.html:6`): incluir `api.pwnedpasswords.com` em `connect-src` para a
   verificação de senha vazada voltar a funcionar, e declarar `frame-src`/`media-src` se o vídeo do
   LMS for para produção.
4c. **Escolher um gerenciador de pacotes** e remover os outros dois lockfiles; declarar
   `packageManager` em `package.json`.
5. **Corrigir `close_expired_sales_campaigns()`**: trocar `goal_amount` por `target_global`. Entrego
   a migration; aplicar é decisão sua.
6. **Ligar os três subsistemas invisíveis** ao `AppSidebar`/`MobileDrawer` e renderizar os
   componentes importados e nunca montados. Ganho alto, risco quase nulo.
7. **Remover código morto** — começando pelo que é seguro. `src/lib/exportReports.ts` (537 linhas)
   tem zero consumidores em qualquer lugar, incluindo testes: remoção limpa. Os outros 8 órfãos de
   `src/lib` **são importados por arquivos de teste** — apagá-los quebra a suíte, então exigem
   decidir antes se o teste também vai embora. *(Corrigido: a versão original dizia "~9.500 linhas
   sem nenhum caminho de execução" e não avisava do acoplamento com os testes.)*
8. **Substituir as métricas fictícias por "sem dado"** nos dashboards. Um painel vazio e honesto vale
   mais que um R$ inventado para a diretoria.
9. **Reconciliar os 8 inventários existentes** — ou marcá-los como obsoletos. Detalhe abaixo.

### Toca produção ou muda o modelo — é decisão sua

10. **Investigar o job fantasma `update-profile-name-daily`.** Ele reescreve o seu perfil diariamente
    e não existe no repositório. Precisa ser identificado antes de removido: quem criou, quando e por
    quê. **Recomendo tratar como incidente**, não como bugzinho.
11. **Blindar a economia**: revogar o `UPDATE` de `xp`/`coins`/`level` em `profiles` para
    `authenticated` (grant por coluna ou trigger de guarda) e migrar os 6 serviços de
    read-modify-write para RPC `SECURITY DEFINER`. É o risco nº 1.
12. **Decidir o destino de `external-db-bridge` e do módulo `raw` do `bitrix24-api`.** Se estiverem
    deployados, recomendo derrubá-los hoje e rediscutir o requisito.
13. **Corrigir 2FA e WebAuthn antes de qualquer usuário ativá-los.** Enquanto as tabelas estiverem
    vazias, o custo é zero; depois, não é.
14. **Resolver a rastreabilidade de migrations.** Sem `schema_migrations`, não há prova de que o
    ambiente nasce do repositório — e este é, estruturalmente, o achado mais grave da auditoria.
15. **Decidir sobre Bitrix24**: 1.017 linhas prontas e desconectadas. Ou conecta, ou remove.

---

## Reconciliação com os inventários anteriores

Havia 8 documentos de auditoria/inventário no repositório. Conferi as afirmações deles contra o
sistema real:

| Afirmação anterior | Medição real |
|---|---|
| "36 páginas mapeadas" | **82** |
| "+80 componentes funcionais" | **461** |
| "57 serviços" | **96** |
| "25 Edge Functions" | **36** |
| "Typescript: Strict Mode ativado" | Verdadeiro na configuração — mas **nunca executado** |
| "Linting configurado com regras enterprise" | Configurado; **nunca executado em CI** |
| "✅ Implementado" em praticamente tudo | 0 features com uso real |

**Evidência fabricada:** dos 397 caminhos de arquivo citados como prova nesses documentos, **81 não
existem em lugar nenhum do repositório** (20,4%) e 3 estão com caminho errado. A lista completa está
em [`docs/estado/anexo-citacoes-inexistentes.md`](./docs/estado/anexo-citacoes-inexistentes.md).

As ausências se concentram exatamente onde o padrão previa — features de negócio: OKR, PDI,
mentoria, demografia, relatórios, KPIs, matriz de competências, Bitrix24. Módulos administrativos,
mais chatos, têm lastro real.

**Recomendação:** marcar `INVENTARIO_FUNCIONALIDADES.md`, `SYSTEM_INVENTORY_AUDIT.md`,
`audit_report.md`, `ENTERPRISE_AUDIT_REPORT.md`, `GAMIFICATION_AUDIT_REPORT.md`,
`SYSTEM_RELIABILITY_AUDIT.md` e `AUDIT_INVENTORY_CHECKLIST.md` como **obsoletos**, apontando para
este documento. Não os editei: divergência encontrada vira linha de relatório, não edição de
artefato alheio.

O `README.md` também aponta para `audit_report.pdf`, que **não existe** no repositório — ele só
seria gerado pelo step de CI que nunca executou. E ainda contém `REPLACE_WITH_PROJECT_ID` em três
lugares.

Some-se à lista de obsoletos `docs/api/openapi.yaml`: 39 linhas, título de outro produto
("Dashboard Elite Edge Functions API"), documenta 2 dos 36 endpoints e um deles
(`/auth-email-hook`) não existe em `supabase/functions/`. *(Achado na validação; a auditoria
original não o abriu.)*

---

## Como esta auditoria foi feita

- **Fase A** — medição de 242.673 linhas em 1.377 arquivos; identificação de stack, acessos e
  toolchain. Descoberta de 8 inventários prévios → tarefa virou reconciliar, não criar.
- **Fase B** — simulação de falhas e invariantes declaradas antes de executar.
- **Fase C** — 16 lotes de ≤13.000 linhas, cada um com arquivo de saída exclusivo pré-alocado,
  executados em paralelo.
- **Fase D** — recontagem de cobertura contra a árvore real (1.110 arquivos) e **reprodução
  independente dos achados mais graves**. Dois achados de subagente foram reproduzidos e estavam
  superdimensionados; foram corrigidos com bloco de errata em
  [`04-dados-e-runtime.md §9`](./docs/estado/04-dados-e-runtime.md), sem apagar o original.
- **Fase E** — runtime: banco de produção lido diretamente (tabelas, políticas, funções, jobs cron,
  histórico de execução, contas, storage). **Zero DDL, zero DML, zero deploy.**

- **Segunda passada de validação** — revisão adversarial encarregada de *refutar* cada conclusão,
  mais uma caça a lacunas, mais recontagem de escopo e aritmética. Resultado: 1 afirmação **errada**,
  1 lacuna **crítica**, 4 achados exagerados/imprecisos, 6 números corrigidos, 2 autocontradições
  do documento, e 1 caso em que eu havia sido conservador demais ao marcar `NAO_VERIFICADO`.
  Registro completo, com o texto original preservado, em
  [`09-validacao-e-errata.md`](./docs/estado/09-validacao-e-errata.md).

Guard-rails cumpridos: produção somente leitura; nenhum artefato de outro agente editado; nenhum
resultado afirmado sem execução; trabalho em branch própria.

**Denominadores usados neste documento:** *1.110* = arquivos `.ts/.tsx` em `src/` (1.062) e
`supabase/functions/` (48), base da recontagem de cobertura. *1.377* = todos os arquivos de código
(`.ts`, `.tsx`, `.sql`, `.js`, `.css`) em `src/`, `supabase/`, `scripts/` e `tests/`, base do
dimensionamento. *828 unidades* = os 934 arquivos dos escopos dos lotes, menos 106 por agrupamento e
leitura em altitude. Os percentuais da tabela de contagem são **% de unidades**, não de arquivos.
