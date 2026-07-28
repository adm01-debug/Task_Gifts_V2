-- Padrão: renomeia a implementação original para *_impl (fechada ao público)
-- e cria uma fachada de mesmo nome/assinatura que valida a autorização antes.

-- 1) get_engagement_overview
ALTER FUNCTION public.get_engagement_overview(uuid, integer) RENAME TO get_engagement_overview_impl;
CREATE FUNCTION public.get_engagement_overview(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
RETURNS TABLE(overall_score numeric, overall_favorability numeric, respondents integer, eligible_users integer, participation_rate numeric, answer_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_overview_impl(p_department_id, p_days);
END; $$;

-- 2) get_engagement_pillar_scores
ALTER FUNCTION public.get_engagement_pillar_scores(uuid, integer) RENAME TO get_engagement_pillar_scores_impl;
CREATE FUNCTION public.get_engagement_pillar_scores(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
RETURNS TABLE(pillar climate_pillar, score numeric, favorability numeric, respondents integer, answer_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_pillar_scores_impl(p_department_id, p_days);
END; $$;

-- 3) get_engagement_factor_scores
ALTER FUNCTION public.get_engagement_factor_scores(uuid, integer) RENAME TO get_engagement_factor_scores_impl;
CREATE FUNCTION public.get_engagement_factor_scores(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
RETURNS TABLE(factor_id uuid, factor_key text, factor_name text, pillar climate_pillar, score numeric, favorability numeric, respondents integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_factor_scores_impl(p_department_id, p_days);
END; $$;

-- 4) get_engagement_nps
ALTER FUNCTION public.get_engagement_nps(uuid, integer) RENAME TO get_engagement_nps_impl;
CREATE FUNCTION public.get_engagement_nps(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
RETURNS TABLE(metric text, score integer, promoters integer, passives integer, detractors integer, respondents integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_nps_impl(p_department_id, p_days);
END; $$;

-- 5) get_engagement_nps_history
ALTER FUNCTION public.get_engagement_nps_history(uuid, integer, text) RENAME TO get_engagement_nps_history_impl;
CREATE FUNCTION public.get_engagement_nps_history(p_department_id uuid DEFAULT NULL::uuid, p_months integer DEFAULT 12, p_bucket text DEFAULT 'month'::text)
RETURNS TABLE(metric text, period_start date, score integer, promoters integer, passives integer, detractors integer, respondents integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_nps_history_impl(p_department_id, p_months, p_bucket);
END; $$;

-- 6) get_engagement_pillar_correlations
ALTER FUNCTION public.get_engagement_pillar_correlations(integer) RENAME TO get_engagement_pillar_correlations_impl;
CREATE FUNCTION public.get_engagement_pillar_correlations(p_days integer DEFAULT 180)
RETURNS TABLE(pillar_a climate_pillar, pillar_b climate_pillar, correlation numeric, sample_size integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_pillar_correlations_impl(p_days);
END; $$;

-- 7) get_engagement_pillar_benchmark
ALTER FUNCTION public.get_engagement_pillar_benchmark(uuid, integer, text, text, text) RENAME TO get_engagement_pillar_benchmark_impl;
CREATE FUNCTION public.get_engagement_pillar_benchmark(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90, p_industry text DEFAULT 'geral'::text, p_company_size text DEFAULT 'all'::text, p_region text DEFAULT 'BR'::text)
RETURNS TABLE(pillar climate_pillar, score numeric, favorability numeric, respondents integer, benchmark_average numeric, benchmark_top_quartile numeric, benchmark_top_10 numeric, benchmark_sample_size integer, benchmark_industry text, benchmark_company_size text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_engagement_pillar_benchmark_impl(p_department_id, p_days, p_industry, p_company_size, p_region);
END; $$;

-- 8) get_nr1_risk_matrix
ALTER FUNCTION public.get_nr1_risk_matrix(uuid, integer) RENAME TO get_nr1_risk_matrix_impl;
CREATE FUNCTION public.get_nr1_risk_matrix(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
RETURNS TABLE(category_id uuid, category_key text, category_name text, description text, legal_reference text, severity_weight numeric, score numeric, probability numeric, risk_grade numeric, risk_level text, respondents integer, factors_evaluated integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_nr1_risk_matrix_impl(p_department_id, p_days);
END; $$;

-- 9) get_nr1_summary
ALTER FUNCTION public.get_nr1_summary(uuid, integer) RENAME TO get_nr1_summary_impl;
CREATE FUNCTION public.get_nr1_summary(p_department_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
RETURNS TABLE(categories_evaluated integer, critical_count integer, high_count integer, moderate_count integer, low_count integer, avg_risk_grade numeric, max_risk_grade numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN QUERY SELECT * FROM public.get_nr1_summary_impl(p_department_id, p_days);
END; $$;

-- 10) recalc_campaign_progress
ALTER FUNCTION public.recalc_campaign_progress(uuid) RENAME TO recalc_campaign_progress_impl;
CREATE FUNCTION public.recalc_campaign_progress(_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  PERFORM public.recalc_campaign_progress_impl(_campaign_id);
END; $$;

-- 11) recalc_campaign_teams
ALTER FUNCTION public.recalc_campaign_teams(uuid) RENAME TO recalc_campaign_teams_impl;
CREATE FUNCTION public.recalc_campaign_teams(_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  PERFORM public.recalc_campaign_teams_impl(_campaign_id);
END; $$;

-- 12) check_boss_win_rate_alerts
ALTER FUNCTION public.check_boss_win_rate_alerts(integer) RENAME TO check_boss_win_rate_alerts_impl;
CREATE FUNCTION public.check_boss_win_rate_alerts(p_days integer DEFAULT NULL::integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN public.check_boss_win_rate_alerts_impl(p_days);
END; $$;

-- 13) calculate_enps_score
ALTER FUNCTION public.calculate_enps_score(uuid) RENAME TO calculate_enps_score_impl;
CREATE FUNCTION public.calculate_enps_score(p_survey_id uuid)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN public.calculate_enps_score_impl(p_survey_id);
END; $$;

-- Fecha as implementações internas: só o service_role e as fachadas (definer) as alcançam.
DO $$
DECLARE
  fn text;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE '%\_impl'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- Fachadas: acessíveis a usuários logados (a autorização fina é feita internamente).
DO $$
DECLARE
  fn text;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_engagement_overview','get_engagement_pillar_scores','get_engagement_factor_scores',
        'get_engagement_nps','get_engagement_nps_history','get_engagement_pillar_correlations',
        'get_engagement_pillar_benchmark','get_nr1_risk_matrix','get_nr1_summary',
        'recalc_campaign_progress','recalc_campaign_teams','check_boss_win_rate_alerts',
        'calculate_enps_score')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;
