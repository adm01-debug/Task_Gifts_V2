
GRANT EXECUTE ON FUNCTION public.get_department_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_executive_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trends() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nine_box_distribution(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_engagement_snapshot(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_category_stats() TO authenticated;
