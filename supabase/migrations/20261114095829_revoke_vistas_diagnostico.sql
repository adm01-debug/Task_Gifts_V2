-- Revoga acesso das views de diagnostico interno ao anonimo/authenticated.
-- Views criadas diretamente no banco (nao via migration) - guarda de existencia p/ idempotencia.
do $$
declare
  v text;
begin
  foreach v in array array['connection_monitor', 'index_health_report', 'query_performance_summary'] loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = v and c.relkind in ('v','m')) then
      execute format('revoke all on public.%I from anon, authenticated', v);
    end if;
  end loop;
end $$;
