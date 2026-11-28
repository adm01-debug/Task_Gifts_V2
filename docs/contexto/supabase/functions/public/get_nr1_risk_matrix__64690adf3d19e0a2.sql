CREATE OR REPLACE FUNCTION public.get_nr1_risk_matrix(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS TABLE(category_id uuid, category_key text, category_name text, description text, legal_reference text, severity_weight numeric, score numeric, probability numeric, risk_grade numeric, risk_level text, respondents integer, factors_evaluated integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_nr1_risk_matrix_impl(p_department_id, p_days);
END;
$function$
