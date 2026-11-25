-- Revoga de `authenticated` os privilegios que a producao so possui porque recebeu
-- um `GRANT ALL ON TABLE` em algum momento no SQL Editor: TRUNCATE, REFERENCES,
-- TRIGGER e MAINTAIN nas tres relacoes onde eles aparecem.
--
-- Por que revogar no vivo em vez de copiar a permissao para o repositorio:
--   * PostgREST nao expoe nenhum dos quatro, entao nenhuma tela/edge function os usa;
--   * TRUNCATE NAO passa por RLS: quem tiver o privilegio esvazia `profiles` inteira
--     sem policy nenhuma no caminho (as 548 policies nao protegem TRUNCATE);
--   * REFERENCES/TRIGGER/MAINTAIN em `profiles_public` e `webhook_delivery_stats_24h`
--     sao inertes - as duas sao views -, resto de um GRANT ALL que nunca foi revisto;
--   * MAINTAIN em `profiles` (tabela) tambem e inerte pela API: serve para VACUUM,
--     ANALYZE, CLUSTER, REINDEX e REFRESH, que nenhum usuario autenticado executa.
--
-- Efeito: producao cai de 1940 para 1928 privilegios de anon+authenticated (12 linhas
-- a menos: 4 por relacao) e o banco reconstruido tambem perde as mesmas 12, porque a
-- migration e a mesma nos dois lados. As 8 linhas restantes de diferenca
-- (`authenticated` com todos os privilegios na matview `leaderboard_cache`)
-- desaparecem quando a 20261228120000 - que esta no mesmo PR - aplica o seu
-- `REVOKE ALL ON public.leaderboard_cache FROM authenticated, anon` (linha 78):
-- 1940 menos 12 menos 8 = 1920, exatamente o que o rebuild tem. Nenhum privilegio
-- existe no rebuild e falta no vivo (`soReplay = 0`), entao vivo e rebuild
-- convergem nas duas pontas.
--
-- Reexecucao: REVOKE de privilegio ausente e no-op, entao a migration e idempotente.
-- `MAINTAIN` exige PostgreSQL 17 (mesma versao do banco vivo).

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE
  public.profiles,
  public.profiles_public,
  public.webhook_delivery_stats_24h
FROM authenticated;