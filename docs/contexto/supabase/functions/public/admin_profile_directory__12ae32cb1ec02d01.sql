CREATE OR REPLACE FUNCTION public.admin_profile_directory()
 RETURNS TABLE(id uuid, email text, personal_email text, cpf text, employee_id text, display_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_manager_or_admin();
  RETURN QUERY
    SELECT p.id, p.email, p.personal_email, p.cpf, p.employee_id, p.display_name
    FROM public.profiles p;
END;
$function$
