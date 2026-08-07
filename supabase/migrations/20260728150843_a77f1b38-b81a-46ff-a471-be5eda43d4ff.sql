CREATE OR REPLACE FUNCTION public.check_boss_win_rate_alerts(p_days INTEGER DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_days INTEGER;
  v_now TIMESTAMPTZ := now();
  v_mid TIMESTAMPTZ;
  v_start TIMESTAMPTZ;
  v_prior NUMERIC := 3;
  v_sent INTEGER := 0;
  r RECORD;
  v_user UUID;
  v_dept_name TEXT;
  v_key TEXT;
BEGIN
  -- Janela: parâmetro explícito > padrão global persistido > 90 dias.
  v_days := COALESCE(
    p_days,
    (SELECT window_days FROM public.boss_win_rate_goals WHERE department_id IS NULL LIMIT 1),
    90
  );
  v_days := GREATEST(1, LEAST(3650, v_days));
  v_mid := v_now - (v_days || ' days')::INTERVAL;
  v_start := v_now - (2 * v_days || ' days')::INTERVAL;

  FOR r IN
    WITH concluded AS (
      SELECT
        COALESCE(department_id::TEXT, '__none__') AS dept,
        department_id,
        COALESCE(settled_at, defeated_at, ends_at) AS occurred_at,
        CASE WHEN status = 'expired' THEN 0 ELSE 1 END AS victory
      FROM public.boss_battles
      WHERE status IN ('defeated', 'expired', 'settled')
        AND COALESCE(settled_at, defeated_at, ends_at) IS NOT NULL
    ),
    cur AS (
      SELECT * FROM concluded WHERE occurred_at >= v_mid AND occurred_at <= v_now
    ),
    prev AS (
      SELECT * FROM concluded
      WHERE occurred_at >= v_start AND occurred_at < v_mid
    ),
    cur_global AS (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(victory)::NUMERIC / COUNT(*) END AS mean
      FROM cur
    ),
    prev_global AS (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE SUM(victory)::NUMERIC / COUNT(*) END AS mean
      FROM prev
    ),
    cur_dept AS (
      SELECT dept, MAX(department_id::TEXT) AS department_id, COUNT(*) AS battles,
             SUM(victory) AS victories
      FROM cur GROUP BY dept
    ),
    prev_dept AS (
      SELECT dept, COUNT(*) AS battles, SUM(victory) AS victories
      FROM prev GROUP BY dept
    )
    SELECT
      c.dept,
      c.department_id,
      c.battles,
      ROUND((c.victories::NUMERIC / c.battles) * 100) AS win_pct,
      ROUND((
        ((c.victories + (SELECT mean FROM cur_global) * v_prior) / (c.battles + v_prior))
        - ((p.victories + (SELECT mean FROM prev_global) * v_prior) / (p.battles + v_prior))
      ) * 10000) / 100 AS delta_pp
    FROM cur_dept c
    JOIN prev_dept p ON p.dept = c.dept
  LOOP
    -- Severidade "critical" no motor equivale a queda >= 20 p.p.
    CONTINUE WHEN r.delta_pp > -20;

    v_dept_name := COALESCE(
      (SELECT name FROM public.departments WHERE id::TEXT = r.department_id),
      'Sem departamento'
    );

    FOR v_user IN
      SELECT DISTINCT ur.user_id
      FROM public.user_roles ur
      LEFT JOIN public.team_members tm ON tm.user_id = ur.user_id
      WHERE ur.role = 'admin'
         OR (ur.role = 'manager'
             AND r.department_id IS NOT NULL
             AND tm.department_id::TEXT = r.department_id)
    LOOP
      v_key := 'boss_winrate_critical:' || r.dept || ':'
        || to_char(date_trunc('day', v_now), 'YYYYMMDD') || ':' || v_user::TEXT;

      PERFORM public.enqueue_push(
        v_user,
        'boss_battle',
        'Queda crítica de aproveitamento',
        v_dept_name || ' caiu ' || ABS(r.delta_pp) || ' p.p. de aproveitamento nos últimos '
          || v_days || ' dias (agora em ' || r.win_pct || '%). Revise as metas do Chefão.',
        v_key,
        '/chefao',
        jsonb_build_object(
          'department_id', r.department_id,
          'delta_pp', r.delta_pp,
          'win_pct', r.win_pct,
          'window_days', v_days,
          'severity', 'critical'
        )
      );
      v_sent := v_sent + 1;
    END LOOP;
  END LOOP;

  RETURN v_sent;
END;
$function$;

REVOKE ALL ON FUNCTION public.check_boss_win_rate_alerts(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_boss_win_rate_alerts(INTEGER) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.run_boss_win_rate_alerts(p_days INTEGER DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();
  RETURN public.check_boss_win_rate_alerts(p_days);
END;
$function$;

REVOKE ALL ON FUNCTION public.run_boss_win_rate_alerts(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.run_boss_win_rate_alerts(INTEGER) TO authenticated, service_role;