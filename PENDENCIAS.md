# PENDÊNCIAS

## P-001 — CI do PR #16 falha por quota esgotada do GitHub Actions

**Data:** 2026-10-29  
**Workflow:** CI (`.github/workflows/ci.yml`)  
**PR:** [#16 — fix(ci): corrige 3 causas de falha do CI](https://github.com/adm01-debug/Task_Gifts_V2/pull/16)  
**Run:** [#373 — tentativas 1 e 2](https://github.com/adm01-debug/Task_Gifts_V2/actions/runs/40878599026)

### Erro exato

```
status: completed
conclusion: failure
runner_id: 0
runner_name: ""
steps: []
duração: ~3 segundos (sem steps executados)
```

O runner **nunca foi alocado** (runner_id=0). Nenhum step do job foi iniciado.  
Isso ocorre exclusivamente quando a conta não tem minutos disponíveis no GitHub Actions  
ou quando há restrição de billing no plano Free/Pro da conta `adm01-debug`.

### O que o owner precisa fazer

1. Acessar [https://github.com/settings/billing](https://github.com/settings/billing)
2. Verificar o consumo de minutos do GitHub Actions no mês corrente
3. Se esgotado: aguardar a virada do mês OU adicionar um método de pagamento para minutos extras
4. Após ter minutos disponíveis: fazer rerun do [PR #16](https://github.com/adm01-debug/Task_Gifts_V2/pull/16) via botão "Re-run all jobs"
5. Após CI verde: fazer merge do PR (squash merge)

### Status da correção de código

✅ **O código está correto e validado localmente:**

| Verificação | Resultado |
|-------------|-----------|
| `bun install --frozen-lockfile` | ✅ passa |
| `bun run lint` | ✅ 0 erros |
| `bun run typecheck` | ✅ passa |
| `bun run test` | ✅ 137 passed \| 2 skipped (139 files) — igual ao baseline |

A única pendência é a **execução do CI no GitHub**, que depende de minutos disponíveis na conta.
