# Pendencias — .mcp.json versionado com segredo (risco #0)

Estado: **AGUARDANDO HUMANO** (remocao de segredo = mudanca de infra/seguranca = regra 8)

## Causa
`.mcp.json` esta versionado no repo (`git ls-files .mcp.json`) e contem URL com token de 32 hex com acesso total ao Supabase (`supabase-eidsaqymo-mcp.adm01.workers.dev/<hex32>/mcp`). Qualquer pessoa com acesso ao repo tem o token do canal de administracao MCP do projeto.

## Impacto no negocio
Se o repo vazou ou e compartilhado, um atacante pode invocar o MCP Supabase e ler/alterar dados (economia, perfis, campanhas) sem passar pela RLS da API. E o risco de mais alta severidade da auditoria.

## Acao necessaria
1. Rotacionar o token do Worker (URL/MCP) que esta exposto.
2. Remover `.mcp.json` do controle de versao (`git rm --cached`) e adicionar `.mcp.json` ao `.gitignore`, mantendo o arquivo localmente (provisao via CAMPO de config do usuario).
3. Manter um `.mcp.example.json` sem segredo para documentar a configuracao.

## Por que nao feito nesta sessao
Remover `.mcp.json` e rotacionar segredo afeta a infratestrutura de automacao da fazenda (outros repos/agentes usam o mesmo padrao) e exige coordenacao com a equipe que opera o Worker. Nao posso rotacionar externamente o segredo. Regra 8.

## Solucao implementada (2026-11-28)
- .mcp.json saiu do indice (git rm --cached) e entrou no .gitignore; o arquivo continua no disco local do dono, entao o canal MCP segue funcionando para quem ja o tem.
- .mcp.example.json versionado, sem token, documenta o formato exigido.
- Guarda nova scripts/ci/check-mcp-secret.mjs + suite check-mcp-secret.unit.mjs (4 testes): falha se .mcp.json voltar a ser rastreado **ou** se qualquer arquivo rastreado contiver URL *-mcp.adm01.workers.dev/<hex>/mcp. Roda no job quality (.github/workflows/ci.yml) e esta registrada em scripts/automation.config.json.
- Registro em scripts/automation.config.json (id legacy-mcp-secret-guard); utomation.mjs doctor sem o achado script sem registro/gatilho.

## Pendente de acao humana (nao resolvivel por codigo)
- **Rotacionar o token do Worker.** O token saiu da ponta (HEAD) mas continua no historico do Git a partir de df2d2d5d; quem tem clone antigo ainda o possui. Enquanto nao for trocado no Worker, ele segue valido.
- Opcional: reescrever o historico (git filter-repo) se o repositorio ja foi compartilhado externamente.