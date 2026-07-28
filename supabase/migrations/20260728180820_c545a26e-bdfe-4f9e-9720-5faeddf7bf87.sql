-- Estas funções nunca tiveram GRANT explícito: o privilégio vinha do GRANT EXECUTE
-- padrão para PUBLIC, por isso o REVOKE ... FROM anon anterior não teve efeito.
-- São todas trigger functions ou helpers internos; o PostgreSQL valida EXECUTE em
-- CREATE TRIGGER, não a cada disparo, então revogar não afeta os gatilhos existentes.
DO $do$
DECLARE
  r RECORD;
  v_keep_public text[] := ARRAY['verify_certificate', 'get_passkeys_by_email'];
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT (p.proname = ANY (v_keep_public))
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.oid::regprocedure);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.oid::regprocedure);
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Revogado EXECUTE público de % funções internas', v_count;
END;
$do$;