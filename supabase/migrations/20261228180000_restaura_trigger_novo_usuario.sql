-- ============================================
-- Restaura o trigger de criacao de profile em auth.users e recupera os orfaos
-- ============================================
--
-- Causa (medida em producao, nao suposta):
--   * a migration 20260806191000_recreate_handle_new_user_trigger.sql esta no ledger de
--     producao como aplicada, mas o trigger nao existe no banco:
--       select count(*) from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal; -> 0
--   * efeito real: 8 linhas em auth.users x 6 linhas em public.profiles; as 2 contas sem
--     profile sao contas de teste E2E criadas depois do sumico do trigger (uma delas com
--     login em 2026-11-25), o que prova que qualquer cadastro novo cai no mesmo caminho.
--   * sem profile, public.user_leagues.user_id viola user_leagues_user_id_fkey e a pagina
--     /leagues quebra - exatamente o sintoma descrito na migration de 2026-08-06.
--
-- Esta migration e idempotente: CREATE OR REPLACE FUNCTION, DROP TRIGGER IF EXISTS antes
-- do CREATE TRIGGER, ON CONFLICT (id) DO NOTHING no INSERT da funcao e no backfill.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Repara as contas criadas enquanto o trigger estava ausente.
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id,
       u.email,
       COALESCE(u.raw_user_meta_data ->> 'display_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;