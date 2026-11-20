# Pendencias — CSP bloqueia verificacao de senha vazada (HIBP)

Estado: **CONCLUIDO** via PR #71

## Causa
CSP em `vercel.json` (header) nao listava `api.pwnedpasswords.com` no `connect-src`. O front chama HIBP em `src/lib/authValidations.ts:94` para verificar senha vazada no cadastro/reset. O header bloqueava a chamada no navegador, silenciosamente quebrando a checagem de senha comprometida.

## Correcao
Adicionado `https://api.pwnedpasswords.com` ao `connect-src` (add-only, sem remocao de dominio). Valido: JSON ok + preview Vercel ok.

## Evidence
PR https://github.com/adm01-debug/Task_Gifts_V2/pull/71 (CI quality SUCCESS). Aguardando merge (infra/vercel.json = regra 8).
