# Pendencias — lockfiles multiplos + ausencia de packageManager

Estado: **CONCLUIDO** 

## Observacao
O repo tinha `bun.lock` e `package-lock.json` (npm, orfao e defasado desde a PR #26) e nenhum `packageManager` em `package.json`. O `package-lock.json` gerava 57 alertas falsos no Dependabot (1 critico em storybook 10.6.0 < 10.6.2) porque o Dependabot era configurado para o ecossistema `npm` enquanto o CI/Verce usa bun.

## Correcao (merges na main)
- **PR #79** (`34453e22`): trocou `package-ecosystem` de `npm` para `bun` no `.github/dependabot.yml`, eliminando os CVEs falsos do lock npm orfao.
- **PR #81** (`f34642c9`): removeu `package-lock.json` (18101 linhas) e declarou `"packageManager": "bun@1.4.4"` no `package.json`, para o Vercel/detector de framework usar bun.

## Evidencia
- `bun install --frozen-lockfile` exit 0 (lockfile consistente apos remocao do lock npm).
- CI quality SUCCESS e Dependency Review PASS nas PRs #79/#81.
- Deploy de producao Ready (HTTP 200) apos cada merge.
- Dependabot: **zero alertas abertos** apos a troca para ecossistema bun.
- `packageManager` preservado nos rebases subsequentes do Dependabot (#82/#83).
