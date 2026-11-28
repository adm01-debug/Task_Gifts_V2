CREATE OR REPLACE FUNCTION public.get_department_war_standings(p_war_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_war public.department_wars%ROWTYPE; v_standings jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated'); END IF;
  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_war.status = 'draft' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  WITH per_user AS (SELECT c.department_id, c.user_id, SUM(c.amount * COALESCE(m.weight, 0)) AS points FROM public.department_war_contributions c LEFT JOIN public.department_war_metrics m ON m.war_id = c.war_id AND m.metric_key = c.metric_key WHERE c.war_id = p_war_id GROUP BY c.department_id, c.user_id HAVING SUM(c.amount * COALESCE(m.weight, 0)) > 0),
  capped AS (SELECT department_id, CASE WHEN v_war.per_user_cap > 0 THEN LEAST(points, v_war.per_user_cap) ELSE points END AS points, CASE WHEN v_war.per_user_cap > 0 THEN GREATEST(points - v_war.per_user_cap, 0) ELSE 0 END AS capped_out FROM per_user),
  agg AS (SELECT department_id, SUM(points) AS raw_score, SUM(capped_out) AS capped_out, COUNT(*)::int AS contributors FROM capped GROUP BY department_id),
  scored AS (SELECT d.department_id, dep.name, d.headcount, ROUND(COALESCE(a.raw_score, 0), 4) AS raw_score, ROUND(COALESCE(a.capped_out, 0), 4) AS capped_out, COALESCE(a.contributors, 0) AS contributors, ROUND(CASE WHEN d.headcount > 0 THEN LEAST(COALESCE(a.contributors, 0)::numeric / d.headcount, 1) ELSE 0 END, 4) AS participation_rate, ROUND((COALESCE(a.raw_score, 0) / POWER(GREATEST(d.headcount, 1)::numeric, v_war.fairness_alpha)) * (1 + v_war.participation_bonus * CASE WHEN d.headcount > 0 THEN LEAST(COALESCE(a.contributors, 0)::numeric / d.headcount, 1) ELSE 0 END), 4) AS score FROM public.department_war_departments d JOIN public.departments dep ON dep.id = d.department_id LEFT JOIN agg a ON a.department_id = d.department_id WHERE d.war_id = p_war_id),
  ranked AS (SELECT s.*, DENSE_RANK() OVER (ORDER BY s.score DESC) AS position FROM scored s)
  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.position, r.participation_rate DESC, r.raw_score DESC, r.name), '[]'::jsonb) INTO v_standings FROM ranked r;
  RETURN jsonb_build_object('success', true, 'war', to_jsonb(v_war), 'standings', v_standings);
END; $function$
