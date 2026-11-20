# Pendencias — lockfiles multiplos + ausencia de packageManager

Estado: **DESCARTADO (parcial)** para acao imediata

## Observacao
Repo tem `bun.lock` (356916 B) e `package-lock.json` (666861 B) e nenhum `packageManager` em `package.json`. A auditoria citava tambem `bun.lockb`.

## Avaliacao
O CI usa `bun` (bun.lock e o lockfile efetivo; CI green). O `package-lock.json` parece ser residuo de um packagema ge Bom scope. Como nao ha regressao (CI usa bun, green), nao e urgente. Manter ambos e toleravel nos que alem remove-lo por risco de quebra em ferramenta que ainda use npm.

## Proxima acao (se desejada)
Documentar `packageManager: bun@<ver>` e avaliar remocao do `package-lock.json` num change controlado (PR dedicada, CI green). Nao bloqueia producao.
