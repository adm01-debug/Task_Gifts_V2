# Validação da auditoria — erros, lacunas e errata

> Segunda passada sobre a própria auditoria: revisão adversarial (tentar refutar cada conclusão) +
> caça a lacunas (o que não foi perguntado) + recontagem. Tudo aqui foi reproduzido por mim
> diretamente contra o repositório e o banco, em modo somente leitura.
>
> **Regra aplicada:** achado errado ou exagerado é corrigido no próprio documento, sem apagar o
> original. Quem lê precisa saber que houve revisão.

---

## 1. Erro material — a afirmação de manchete estava ERRADA

> **Original (`ESTADO_ATUAL.md`):** *"As 36 Edge Functions estão inalcançáveis pelo frontend […]
> Todas as 17 chamadas do frontend passam por `invokeEdgeSafe`; as duas únicas `functions.invoke`
> diretas do repositório são edge→edge. **Não há rota de escape.**"*

**Isto é falso.** Eu procurei por `supabase.functions.invoke` e **nunca procurei por `fetch` cru
para `/functions/v1/`**. Existem duas rotas de escape:

| Rota de escape | Evidência | Autenticação usada |
|---|---|---|
| `ai-coach` | `src/hooks/useAICoach.ts:15` define `CHAT_URL = ${VITE_SUPABASE_URL}/functions/v1/ai-coach`; `fetch` em `:54` e `:133` | `Bearer VITE_SUPABASE_PUBLISHABLE_KEY` (anon, **não** o JWT do usuário) |
| `trail-recommendations` | `src/components/manager/TeamCompetencyDashboard.tsx:68` | idem |

**Correção:** **34 das 36** Edge Functions estão inalcançáveis pelo frontend. Duas são alcançáveis —
e são justamente as que **gastam créditos de IA**. Ambas ficam fora do contrato de retry, tratamento
de erro e telemetria do `invokeEdgeSafe`, e ambas se identificam com a chave anônima, de modo que a
função não consegue saber qual usuário chamou.

**Consequência prática que eu havia errado:** o passo "corrigir a allowlist" (item 3 dos próximos
passos) **não** reativa 36 funções nem fecha o assunto. Ele reativa 34 e deixa duas fora de
controle, que precisam migrar para `invokeEdgeSafe` num segundo movimento.

Consequência secundária: `ai-coach` estava listada como nº 1 das "19 Edge Functions sem chamador"
(`05-edge-functions.md`). Ela **tem** chamador. O número correto é **18**.

---

## 2. Lacuna crítica — o achado que eu deveria ter feito na Fase A

**`.mcp.json` está versionado no git e contém um segredo de acesso total ao banco de produção.**

```
https://supabase-eidsaqymo-mcp.adm01.workers.dev/<32 hex>/mcp
```

O segmento hexadecimal do caminho é o único fator de autenticação desse gateway. Esse é
**exatamente o endpoint que usei para executar SQL arbitrário contra produção durante esta
auditoria** — a própria descrição da ferramenta diz *"Executa uma query SQL arbitrária
(SELECT/INSERT/UPDATE/DELETE/DDL). Acesso total ao banco."*

- Versionado desde `df2d2d5` ("feat: Migração Banco Lovable para Supabase Task Gifts - V2").
- `.gitignore` não cobre o arquivo.
- Quem tiver acesso de leitura ao repositório tem **controle total do banco**, incluindo DDL.

**Isto é mais grave e mais concreto do que o risco nº 2 do documento executivo**
(`external-db-bridge`), que é condicional a a função estar deployada. Este não é condicional.

Fator atenuante: o repositório é privado (`"private": true` na API do GitHub), então a exposição se
limita a quem já tem acesso. Não é atenuante suficiente — um segredo equivalente a bearer, sem
rotação, em texto claro no controle de versão.

Eu li este arquivo na Fase A e não o classifiquei. Falha minha, não do fatiamento.

---

## 3. Lacunas — arquivos que a auditoria nunca abriu

Fatiei por `src/` e `supabase/functions/`. Ficaram de fora arquivos de raiz que continham achados
reais:

### 3.1 `index.html:6` — a CSP quebra três funcionalidades

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io;
```

| O que quebra | Evidência | Efeito |
|---|---|---|
| Verificação de senha vazada | `src/lib/authValidations.ts:94` chama `https://api.pwnedpasswords.com` — domínio **ausente** de `connect-src` | A checagem falha **em 100% das execuções**, não "quando a API cair". E o código falha aberto (`:100,:116` → `{isLeaked:false}`) |
| Vídeo do YouTube no LMS | `src/components/lms/ModuleViewer.tsx:79,89` | Sem `frame-src` declarado, cai no `default-src 'self'` → iframe bloqueado |
| Vídeo hospedado | `ModuleViewer.tsx:128` | Sem `media-src` → bloqueado |

Isto **fortalece** o achado original sobre fail-open do HIBP: não é degradação eventual, é falha
permanente por configuração.

### 3.2 Três lockfiles versionados, sem `packageManager`

`bun.lock` (349 KB), `bun.lockb` (199 KB) e `package-lock.json` (615 KB) coexistem; `package.json`
não declara `packageManager`. O CI (quando rodar) usa `bun install`, então o `package-lock.json` é
decorativo e divergente — o pior caso relatado é `@sentry/core` 10.53.1 (bun) contra 7.120.4 (npm).
Quem instalar com `npm` monta uma árvore diferente da que o CI monta.

### 3.3 `docs/api/openapi.yaml`

39 linhas, título de outro produto ("Dashboard Elite Edge Functions API"), documenta 2 dos 36
endpoints, e um deles (`/auth-email-hook`) **não existe** em `supabase/functions/`. É o mesmo padrão
de evidência fabricada que o executivo denuncia — e ficou fora da lista de documentos obsoletos.

### 3.4 Bundle e assets (nunca medidos)

- `vite.config.ts:157-164` usa `manualChunks: { ui: ["lucide-react"] }`, nomeando o barril inteiro
  como entrada de chunk — o que anula o tree-shaking de ~1.500 ícones. `App.tsx:17` importa eager.
- `public/pwa-192x192.png` pesa **916 KB** (46× o ícone de 512×512) e o `globPatterns` do Workbox o
  pré-cacheia para todo usuário.
- `xlsx@0.18.5` está pinado sem caret (`package.json:99`), então o dependabot semanal nunca poderá
  atualizá-lo. Marcado como **indício**: não consultei base de CVE.

---

## 4. Correções de números

| Publicado | Correto | Como foi apurado |
|---|---|---|
| "372 execuções do CI, 100% falha" | **347 execuções do `ci.yml`**, 0 sucessos, 347 falhas | 372 somava o workflow Dependabot. E o "100%" era extrapolação de amostra de 30 — refeito por **censo**: `status=success` → `total_count: 0`; `status=failure` → `total_count: 347` |
| "17 chamadas do frontend" | **18 call sites em 15 arquivos**, cobrindo **13 das 36** funções | `grep -rn 'await invokeEdgeSafe'` |
| "19 Edge Functions sem chamador" | **18** | `ai-coach` tem chamador (via `fetch` cru) |
| "~9.500 linhas mortas" | **≥7.852 medidas item a item** (2.592 em 17 arquivos + 5.260 nas 18 functions) | O ~9.500 somava relatos de lote nunca recontados |
| "69 unidades sem nenhum caminho de execução" | **68**, e "sem caminho de execução **em produção**" | Ver §5 |

### Denominadores (dois números que parecem contradição e não são)

- **1.110** = arquivos `.ts`/`.tsx` em `src/` (1.062) + `supabase/functions/` (48). É a base da
  recontagem de cobertura.
- **1.377** = todos os arquivos de código (`.ts`, `.tsx`, `.sql`, `.js`, `.css`) em `src/`,
  `supabase/`, `scripts/` e `tests/`. É a base do dimensionamento da Fase A.

Ambos reproduzem exatamente. São conjuntos diferentes, e o documento não deixava isso explícito.

### O rollup de 828 unidades fecha

Os escopos dos 16 lotes somam **934 arquivos**. As 828 unidades classificadas resultam de
agrupamento e leitura em altitude, e a diferença reconcilia exatamente:

```
934 arquivos
 −  86  (agrupamento: gamificação 81→74, RH 82→52, ui-sec 118→69)
 −  11  (hooks: 140 arquivos → 129 unidades)
 −   9  (edge: 45 arquivos → 36 unidades)
= 828 unidades
```

Os percentuais do documento executivo são **% de unidades**, não % de arquivos.

---

## 5. Achados exagerados ou imprecisos — corrigidos

### 5.1 Código morto "sem nenhum caminho de execução" — IMPRECISO

8 dos 9 módulos órfãos de `src/lib` **são exercitados por testes**:

| Módulo | Importadores em teste | Em produção |
|---|---|---|
| `warAutoHooks`, `bossAutoHooks`, `campaignTeamSplitRevert`, `bossAlerts`, `auctionEngine`, `cardPackNotifications` | 1 cada | 0 |
| `cardPackTriggers`, `pushOutbox` | 2 cada | `pushOutbox`: 1 |
| `exportReports` | **0** | **0** |

**Correção:** a formulação certa é *"sem caminho de execução **em produção**"*. Consequência
prática para o item 7 dos próximos passos: **apagar esses módulos quebra 8 arquivos de teste**. Só
`exportReports.ts` (537 linhas) é removível sem efeito colateral.

### 5.2 Diagnóstico de clima "inalcançável por design" — EXAGERADO

O guard existe e é server-side (`engagement_min_respondents()` retorna 5, `IMMUTABLE`, sem bypass),
mas o corte **padrão é global** (`p_department_id DEFAULT NULL`, migration `20260726160221:10,35,41`):
5 dos 6 perfis satisfazem o mínimo. E o `MIN_RESPONDENTS` do cliente
(`engagementDiagnosticsService.ts:12`) não é gate — só alimenta o texto de `AnonymityGuardNotice.tsx:14`.

**Correção:** inatingível no **corte por departamento** (4 departamentos, ~1,5 pessoa cada);
marginalmente atingível no corte global. A tela está vazia por **falta de respostas**
(`engagement_answers` = 0), não por design impossível.

### 5.3 "Nenhuma feature tem uso real" — IMPRECISO como paráfrase

O texto do documento é preciso ("com evidência de uso real por **usuário final**: 0") e continua
válido. A paráfrase mais curta, não.

Há uso humano real, de administrador, em smoke-test, com rastro identificável:
`user_achievements`, `user_cards` e `scratch_cards` pertencem **somente** às 2 contas que de fato
autenticaram — e raspadinha e cartas só geram linha por clique. Já `auction_bids`,
`pulse_responses` e `department_war_contributions` pertencem às 4 contas com
`last_sign_in_at = NULL`, ou seja, são seed programático.

**Correção:** "nenhum usuário final usou; houve smoke-test manual de administrador em algumas
mecânicas".

### 5.4 Bitrix24 "zero chamadores em qualquer camada" — IMPRECISO

As 3 Edge Functions (1.017 linhas) têm zero invocações a partir de `src/` — isso se confirma. Mas
há superfície viva não mencionada: `src/services/positionsService.ts:451-489` tem 39 linhas de
métodos Bitrix (`createBitrixTaskScore`, `getBitrixTaskScore`, ambos com 0 chamadores), e existe
uma **entrada de menu ativa** em `src/components/MobileDrawer.tsx:53` mais breadcrumb em
`src/components/navigation/GlobalBreadcrumbs.tsx:95` apontando para `/bitrix24` — rota que não
existe entre as 83. O usuário clica e cai no `NotFound`.

### 5.5 Autocontradição interna sobre `Math.random()`

O documento afirma em "O que está bom" que *"os poucos `Math.random()` restantes são legítimos"* e,
duas seções antes, cita `Math.random()` gerando **códigos de backup de 2FA**
(`twoFactorService.ts:29`) e alimentando o **heatmap de atividade** (`ActivityHeatmap.tsx:290,293`).

**Correção:** a frase valia para os lotes de `src/lib` e `src/hooks`, não para o sistema inteiro.
Corrigida no documento.

### 5.6 PWA em "O que está bom" — sem ressalva, indevido

VitePWA é incondicional (`vite.config.ts:14-152`), mas `public/` contém **três** service workers:

| Arquivo | Registrado por | Situação |
|---|---|---|
| `push-sw.js` (1,2 KB) | `src/services/pushSubscriptionService.ts:44,82` | único efetivamente registrado |
| `sw.js` (8,5 KB) | ninguém | colide com o `dist/sw.js` gerado pelo VitePWA — um sobrescreve o outro em silêncio |
| `sw-push.js` (2,6 KB) | ninguém | morto |

Além disso, `globPatterns: ["**/*.{js,…}"]` pré-cacheia os SWs manuais. **Correção:** a PWA está
configurada, mas sai da lista de "o que está bom" e entra como 🟨 com colisão de build a resolver.

---

## 6. O que sobreviveu ao ataque

Reproduzido e **confirmado**:

- **Partição de escopo exata:** 55 diretórios de `src/components` para 55 escopos declarados;
  **461 arquivos para 461** — zero lacuna, zero sobreposição.
- **Aritmética agregada:** 445 + 307 + 7 + 69 = 828 ✓, e a soma por lote fecha em 828 ✓.
- **Rotas:** 83 `<Route>`, 82 páginas, zero duplicadas, zero órfãs nos dois sentidos.
  `CertificateVerify` serve 2 rotas, o que explica 82→83.
- **Economia gravável (risco nº 1):** `authenticated` tem grant **explícito** de `UPDATE` em `xp`,
  `coins` e `level`; o único trigger da tabela é `update_updated_at_column()`, que só carimba
  `updated_at`. Exploitável, sem atenuante.
- **`typecheck` é no-op:** o revisor adversarial instalou `typescript@5.8.3` fora do repositório e
  executou: `tsc -p tsconfig.json --noEmit` → saída vazia, **exit 0**; o mesmo binário contra
  `tsconfig.app.json` → **exit 2** já em `src/App.tsx(2,82)`. *Nota de rigor: eu havia marcado isto
  como `NAO_VERIFICADO` por ausência de `node_modules`. Era verificável em 30 segundos. A marcação
  foi conservadora demais.*
- **`GoalsManager` 100% memória:** zero ocorrências de `supabase`, `localStorage`, `Service`,
  `useMutation` ou `fetch(`; aba realmente montada via `AdminTabsList.tsx:18`.
- **`ci.yml` nunca foi válido:** versão única no histórico (`4531cfaa`), inválida.
- **`.env`:** apenas `PROJECT_ID`, `URL` e um JWT com `"role":"anon"` — zero referência a
  service_role. A calibração original ("público por design; o risco é o próximo segredo") estava
  correta.
- **164/233 tabelas nunca escritas** (o 70º em `pg_stat_user_tables` é a matview `leaderboard_cache`).
- **1.618 casos de teste** para vitest+playwright (1.636 incluindo 18 `Deno.test` que runner nenhum
  executa).
- **Acusação de evidência fabricada:** justa e subestimada. As tabelas têm cabeçalho
  `| Funcionalidade | Arquivo |`, afirmando existência. A seção "Mentoria" lista 3 arquivos e
  **nenhum** existe.

### Corroboração nova encontrada na validação

`audit_logs` = **0** e `session_logs` = **0**: a trilha de auditoria nunca registrou um único evento
em produção. Confirma pela via de runtime o achado estático de `auditService.ts:66-73`
(`catch {}` comentado como `// Silently fail`) — duas evidências independentes convergindo.

### Pontos positivos que a auditoria original não registrou

- **Zero chaves hardcoded em `src/`**, zero `eval`, 3 `console.log` sem dado sensível.
- Os 2 `dangerouslySetInnerHTML` estão **sanitizados** com DOMPurify + allowlist
  (`ModuleViewer.tsx:143-154`).

---

## 7. Onde a auditoria original errou como processo

1. **Grep incompleto virou tese.** Procurei `functions.invoke` e concluí "não há rota de escape",
   sem procurar `fetch` para `/functions/v1/`. Uma busca a menos derrubou a afirmação de manchete.
2. **Não auditei a raiz do repositório.** Fatiei por `src/` e `supabase/functions/` e deixei
   `index.html`, `.mcp.json`, lockfiles e `docs/api/` fora — e havia achado crítico em dois deles.
3. **Extrapolei amostra como censo** no CI (30 de 372) quando o censo custava uma query.
4. **Perdi nuance na consolidação.** Os documentos de detalhe eram mais rigorosos que o sumário:
   as imprecisões de §5.1 e §5.3 já estavam corretas em `03-hooks-services-lib.md` e no próprio
   `ESTADO_ATUAL.md`, e se perderam na paráfrase curta.
5. **Fui conservador demais em uma marcação `NAO_VERIFICADO`** que era verificável.
6. **Herdei números de subagente sem recontar** (17 chamadas, ~9.500 linhas, 19 functions).
