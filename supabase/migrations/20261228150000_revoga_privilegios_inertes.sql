-- Revoga de `authenticated` os privilegios que a producao so possui porque recebeu
-- um `GRANT ALL ON TABLE` em algum momento no SQL Editor: TRUNCATE, REFERENCES e
-- TRIGGER nas tres relacoes onde eles aparecem.
--
-- Por que revogar no vivo em vez de copiar a permissao para o repositorio:
--   * PostgREST nao expoe nenhum dos tres, entao nenhuma tela/edge function os usa;
--   * TRUNCATE NAO passa por RLS: quem tiver o privilegio esvazia `profiles` inteira
--     sem policy nenhuma no caminho (as 548 policies nao protegem TRUNCATE);
--   * REFERENCES/TRIGGER em `profiles_public` e `webhook_delivery_stats_24h` sao
--     inertes - as duas sao views -, resto de um GRANT ALL que nunca foi revisto.
--
-- Efeito: producao passa a ter exatamente o mesmo conjunto de grants de
-- anon+authenticated que o banco reconstruido do zero (1685 privilegios), fechando
-- as 9 linhas que hoje aparecem so no vivo (3 tipos x 3 relacoes). `MAINTAIN` fica
-- de fora de proposito: nao e usado pela API e o banco reconstruido ja o tem,
-- revogar criaria diferenca.
--
-- Reexecucao: REVOKE de privilegio ausente e no-op, entao a migration e idempotente.

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.profiles,
  public.profiles_public,
  public.webhook_delivery_stats_24h
FROM authenticated;