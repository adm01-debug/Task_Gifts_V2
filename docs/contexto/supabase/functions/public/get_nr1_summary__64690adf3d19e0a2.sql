CREATE OR REPLACE FUNCTION public.get_nr1_summary(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(categories_evaluated integer, critical_count integer, high_count integer, moderate_count integer, low_count integer, avg_risk_grade numeric, max_risk_grade numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_nr1_summary_impl(p_department_id, p_days);
END;
$function$
