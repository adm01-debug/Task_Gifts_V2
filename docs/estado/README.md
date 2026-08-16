# Auditoria de Estado — documentos de detalhe

Documento executivo: [`../../ESTADO_ATUAL.md`](../../ESTADO_ATUAL.md)

| # | Dimensão | Escopo medido |
|---|---|---|
| 01 | [Páginas e rotas](./01-paginas-e-rotas.md) | 82 páginas, 83 rotas |
| 02 | [Componentes](./02-componentes.md) | 461 arquivos em `src/components` |
| 03 | [Hooks, services e lib](./03-hooks-services-lib.md) | 129 hooks, 96 services, 106 módulos |
| 04 | [Dados e runtime](./04-dados-e-runtime.md) | banco de produção, `VERIFICADO` |
| 05 | [Edge Functions](./05-edge-functions.md) | 36 funções Deno |
| 06 | [Integrações](./06-integracoes.md) | terceiros, webhooks, filas |
| 07 | [Infra, CI e testes](./07-infra-ci-testes.md) | pipeline, build, 1.618 casos |
| 08 | [Migrations](./08-migrations.md) | 262 arquivos SQL |
| — | [Anexo: citações inexistentes](./anexo-citacoes-inexistentes.md) | 81 caminhos citados que não existem |

**Legenda:** ✅ IMPLEMENTADO_TOTAL · 🟨 IMPLEMENTADO_PARCIAL · 🟦 SUGERIDO_OU_INICIADO · ⬛ MORTO_OU_ABANDONADO

Toda linha de evidência cita `arquivo:linha`, objeto de banco ou jobid de cron. Nada foi executado
(`node_modules` ausente): afirmações sobre build/teste estão marcadas `NAO_VERIFICADO`.
Produção foi acessada somente para leitura.
