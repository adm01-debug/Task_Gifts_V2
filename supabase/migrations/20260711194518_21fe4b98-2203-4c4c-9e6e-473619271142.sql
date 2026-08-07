
REVOKE EXECUTE ON FUNCTION public.approve_password_reset(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_password_reset(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_department_metrics() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_executive_metrics() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_monthly_trends() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_nine_box_distribution(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_security_stats(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_engagement_snapshot(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_task_penalty(uuid, uuid, text, integer, integer, text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_quiz_category_stats() FROM authenticated;
