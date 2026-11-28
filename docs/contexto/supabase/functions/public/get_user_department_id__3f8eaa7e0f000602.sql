CREATE OR REPLACE FUNCTION public.get_user_department_id(p_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.department_id
    FROM public.user_positions up
    JOIN public.positions p ON p.id = up.position_id
   WHERE up.user_id = p_user_id
     AND up.ended_at IS NULL
     AND p.department_id IS NOT NULL
   ORDER BY up.is_primary DESC, up.started_at DESC
   LIMIT 1
$function$
