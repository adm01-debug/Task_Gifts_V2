# Pendencias — CSP bloqueia verificacao de senha vazada (HIBP)

Estado: **CONCLUIDO** via PR #71

## Causa
CSP em `vercel.json` (header) nao listava `api.pwnedpasswords.com` no `connect-src`. O front chama HIBP em `src/lib/authValidations.ts:94` para verificar senha vazada no cadastro/reset. O header bloqueava a chamada no navegador, silenciosamente quebrando a checagem de senha comprometida.

## Correcao
Adicionado `https://api.pwnedpasswords.com` ao `connect-src` (add-only, sem remocao de dominio). Valido: JSON ok + preview Vercel ok.

## Evidence
PR https://github.com/adm01-debug/Task_Gifts_V2/pull/71 (CI quality SUCCESS). Mergeada na main. Deploy de producao confirmado Ready (HTTP 200). CSP em producao inclui `https://api.pwnedpasswords.com` no `connect-src` (`vercel.json`).

Revalidado em 2026-11-21 (validacao real do range API, nao so codigo):
- `GET https://api.pwnedpasswords.com/range/<prefixo5>` responde HTTP 200 com 1925 linhas de hashes no formato `<sufixo>:<ocorrencias>` (k-anonymity correta).
- Com header `Add-Padding: true` responde 2070 linhas (contra jogos de cache/time-attack) — implementado em `src/lib/authValidations.ts:78` (`checkPasswordLeaked`).
- Consumidores em producao: cadastro `AuthFormContent.tsx:183` via `PasswordStrengthIndicator.tsx:51` e reset de senha `ResetPassword.tsx:277`.
- API externa no ar, servico de checks internos em producao (resultado nao persistido, so feedback de forca da senha).
- **Limite da evidencia**: o HTTP 200 do range API confirma que o servico responde a requisicao direta; nao simula o clique de um usuario em producao. A confirmacao "no navegador" vem do header CSP servido em producao: `curl -sI https://task-gifts-v2.vercel.app` hoje devolve `Content-Security-Policy: ... connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://fonts.googleapis.com https://fonts.gstatic.com https://api.pwnedpasswords.com ...` (HTTP 200) — ou seja, a chamada de `fetch` do `checkPasswordLeaked` e permitida pelo policy em producao.
