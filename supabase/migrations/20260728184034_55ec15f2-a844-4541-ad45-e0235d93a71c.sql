-- 1) Função para o próprio usuário ler seus dados sensíveis
CREATE OR REPLACE FUNCTION public.get_my_profile_private()
RETURNS TABLE (id uuid, email text, personal_email text, cpf text, phone text, employee_id text, contract_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.personal_email, p.cpf, p.phone, p.employee_id, p.contract_type
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile_private() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_private() TO authenticated;

-- 2) Diretório completo apenas para gestor/admin (importação e reconciliação de campanhas)
CREATE OR REPLACE FUNCTION public.admin_profile_directory()
RETURNS TABLE (id uuid, email text, personal_email text, cpf text, employee_id text, display_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_manager_or_admin();
  RETURN QUERY
    SELECT p.id, p.email, p.personal_email, p.cpf, p.employee_id, p.display_name
    FROM public.profiles p;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_profile_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_profile_directory() TO authenticated;

-- 3) Column-level security: authenticated perde SELECT nas colunas sensíveis
REVOKE SELECT, DELETE, TRUNCATE ON public.profiles FROM authenticated;

GRANT SELECT (
  id, display_name, avatar_url, level, xp, coins, streak, best_streak,
  quests_completed, created_at, updated_at, birth_date, hire_date,
  status, last_access_at, email
) ON public.profiles TO authenticated;

-- 4) profiles_public deixa de depender do RLS/grants do chamador
ALTER VIEW public.profiles_public SET (security_invoker = false);
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;