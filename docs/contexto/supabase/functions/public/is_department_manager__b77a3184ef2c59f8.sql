CREATE OR REPLACE FUNCTION public.is_department_manager(_user_id uuid, _department_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND department_id = _department_id
      AND is_manager = true
  )
$function$
