CREATE OR REPLACE FUNCTION public._guard_manager_or_admin_if_user()
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN IF auth.uid() IS NOT NULL THEN PERFORM public._require_manager_or_admin(); END IF; END;
$function$
