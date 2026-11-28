CREATE OR REPLACE FUNCTION public.get_my_profile_private()
 RETURNS TABLE(id uuid, email text, personal_email text, cpf text, phone text, employee_id text, contract_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.email, p.personal_email, p.cpf, p.phone, p.employee_id, p.contract_type
  FROM public.profiles p
  WHERE p.id = auth.uid();
$function$
