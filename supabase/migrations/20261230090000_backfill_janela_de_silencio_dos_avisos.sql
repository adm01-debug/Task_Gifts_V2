-- Backfill da janela de silencio: cria a linha de preferencias de quem nunca
-- abriu a tela.
--
-- Por que existe: `push_quiet_hours_until` devolve NULL quando NAO existe linha
-- em `notification_preferences` - e NULL significa "nao silencia nada". Medido
-- em producao em 2026-11-26: 0 linhas para 8 usuarios e 41 itens no
-- `push_outbox`, ou seja, a janela mergeada na #177 estava inerte. Sem a linha,
-- o card de preferencias abre vazio e o usuario nao tem o que ligar.
--
-- Escolha do padrao: 22:00 -> 08:00, ligada, cobrindo fim de semana - o mesmo
-- default das colunas criadas em 20251220144518. O silencio apenas ADIA o push
-- (status `deferred`, entrega as 08:00); nao descarta aviso.
--
-- Idempotente: `ON CONFLICT DO NOTHING` nunca sobrescreve escolha do usuario.

INSERT INTO public.notification_preferences (
  user_id,
  do_not_disturb_enabled,
  do_not_disturb_start,
  do_not_disturb_end,
  do_not_disturb_weekends
)
SELECT u.id, true, time '22:00', time '08:00', true
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;