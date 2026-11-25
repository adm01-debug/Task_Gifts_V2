-- =====================================================================
-- Reaplica em produção 29 funções que ficaram atrás das migrations já
-- registradas como aplicadas em supabase_migrations.schema_migrations.
--
-- Origem do diagnóstico: comparação byte a byte do corpo das funções entre
-- produção (2026-11-25) e o banco reconstruído por
-- `supabase db reset` com as 300 migrations do repositório.
--
-- Resultado medido: 284 funções em produção, 284 no rebuild, 0 só no rebuild.
-- 7 divergiam apenas no texto das mensagens; as 29 abaixo divergem em lógica,
-- sempre com a VERSÃO DO REPOSITÓRIO MAIS NOVA (é ela que o frontend consome):
--   * get_lucky_wheel_status devolve "last_spin", lido por
--     src/services/luckyWheelService.ts:43;
--   * list_external_api_keys devolve "days_since_rotation", lido por
--     src/services/apiKeysService.ts:16;
--   * get_boss_battle_leaderboard devolve "total_damage", lido por
--     src/services/bossBattleService.ts:254;
--   * join_tournament devolve "reason"/"registration_not_open", tratado em
--     src/pages/TournamentsPage.tsx:37.
-- Ou seja: sem esta migration, o banco de produção continua respondendo no
-- formato antigo e esses campos chegam vazios na interface.
--
-- O conteúdo abaixo é exatamente o que `supabase db reset` produz a partir das
-- migrations do repositório (extraído do banco reconstruído, não digitado).
-- CREATE OR REPLACE com o mesmo texto é idempotente: reaplicar não muda nada.
-- Nenhuma assinatura, permissão ou configuração de função é alterada aqui;
-- GRANT/REVOKE continuam definidos nas migrations 20261228140000/150000.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.calculate_enps_score(p_survey_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN public.calculate_enps_score_impl(p_survey_id);
END; $function$;

CREATE OR REPLACE FUNCTION public.check_boss_win_rate_alerts_impl(p_days integer DEFAULT NULL::integer)
 RETURNS integer
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

CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs(p_days_to_keep integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_rate_limit_deleted INTEGER;
    v_login_attempts_deleted INTEGER;
    v_session_logs_deleted INTEGER;
    v_expired_blocks_deleted INTEGER;
    v_webhook_logs_deleted INTEGER;
BEGIN
    -- auth.uid() é NULL quando executada pelo cron/service_role: nesse caso não exige papel.
    IF auth.uid() IS NOT NULL THEN
      PERFORM public._require_admin();
    END IF;

    IF p_days_to_keep IS NULL OR p_days_to_keep < 1 THEN
      RAISE EXCEPTION 'p_days_to_keep deve ser >= 1';
    END IF;

    DELETE FROM public.rate_limit_logs
    WHERE created_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_rate_limit_deleted = ROW_COUNT;

    DELETE FROM public.login_attempts
    WHERE created_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_login_attempts_deleted = ROW_COUNT;

    DELETE FROM public.session_logs
    WHERE is_active = false
      AND logout_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_session_logs_deleted = ROW_COUNT;

    DELETE FROM public.blocked_ips
    WHERE is_permanent = false
      AND expires_at < now() - INTERVAL '7 days';
    GET DIAGNOSTICS v_expired_blocks_deleted = ROW_COUNT;

    DELETE FROM public.bitrix24_webhook_logs
    WHERE processed = true
      AND created_at < now() - INTERVAL '30 days';
    GET DIAGNOSTICS v_webhook_logs_deleted = ROW_COUNT;

    RETURN jsonb_build_object(
        'days_kept', p_days_to_keep,
        'rate_limit_logs_deleted', v_rate_limit_deleted,
        'login_attempts_deleted', v_login_attempts_deleted,
        'session_logs_deleted', v_session_logs_deleted,
        'expired_blocks_deleted', v_expired_blocks_deleted,
        'bitrix24_webhook_logs_deleted', v_webhook_logs_deleted,
        'cleaned_at', now()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_task_score(p_task_score_id uuid, p_status task_completion_status DEFAULT 'on_time'::task_completion_status)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task task_scores%ROWTYPE;
  v_template position_task_templates%ROWTYPE;
  v_xp_earned INTEGER := 0;
  v_coins_earned INTEGER := 0;
  v_xp_penalty INTEGER := 0;
  v_is_late BOOLEAN := false;
  v_late_hours INTEGER := 0;
  v_uid UUID := auth.uid();
  v_privileged BOOLEAN;
BEGIN
  SELECT * INTO v_task FROM task_scores WHERE id = p_task_score_id;

  IF v_task IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- Autorização: chamadas internas (cron/service_role, auth.uid() nulo) seguem livres.
  IF v_uid IS NOT NULL THEN
    v_privileged := public.has_role(v_uid, 'admin') OR public.has_role(v_uid, 'manager');
    IF NOT v_privileged THEN
      IF v_task.user_id IS DISTINCT FROM v_uid THEN
        RAISE EXCEPTION 'Acesso negado: apenas gestores podem concluir tarefas de outros usuários'
          USING ERRCODE = '42501';
      END IF;
      IF p_status NOT IN ('on_time'::task_completion_status, 'late'::task_completion_status) THEN
        RAISE EXCEPTION 'Acesso negado: apenas gestores podem rejeitar ou devolver tarefas'
          USING ERRCODE = '42501';
      END IF;
      IF v_task.status <> 'pending'::task_completion_status THEN
        RAISE EXCEPTION 'Tarefa já finalizada' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF v_task.task_template_id IS NOT NULL THEN
    SELECT * INTO v_template FROM position_task_templates WHERE id = v_task.task_template_id;
  END IF;

  IF v_task.deadline_at IS NOT NULL AND now() > v_task.deadline_at THEN
    v_is_late := true;
    v_late_hours := EXTRACT(EPOCH FROM (now() - v_task.deadline_at)) / 3600;
  END IF;

  -- Antifraude: colaborador não pode declarar "no prazo" após o prazo estourar.
  IF v_uid IS NOT NULL AND NOT COALESCE(v_privileged, true)
     AND v_is_late AND p_status = 'on_time'::task_completion_status THEN
    p_status := 'late'::task_completion_status;
  END IF;

  IF v_template IS NOT NULL THEN
    CASE p_status
      WHEN 'on_time' THEN
        v_xp_earned := v_template.xp_reward;
        v_coins_earned := v_template.coin_reward;
      WHEN 'late' THEN
        v_xp_earned := GREATEST(0, v_template.xp_reward - v_template.xp_penalty_late);
        v_coins_earned := v_template.coin_reward / 2;
        v_xp_penalty := v_template.xp_penalty_late;
      WHEN 'rework' THEN
        v_xp_penalty := v_template.xp_penalty_rework;
        v_xp_earned := 0;
        v_coins_earned := 0;
      WHEN 'rejected' THEN
        v_xp_penalty := v_template.xp_reward;
        v_xp_earned := 0;
        v_coins_earned := 0;
      ELSE
        v_xp_earned := v_template.xp_reward;
        v_coins_earned := v_template.coin_reward;
    END CASE;
  ELSE
    IF p_status = 'on_time' THEN
      v_xp_earned := 50;
      v_coins_earned := 25;
    ELSIF p_status = 'late' THEN
      v_xp_earned := 25;
      v_coins_earned := 10;
      v_xp_penalty := 25;
    ELSIF p_status IN ('rework', 'rejected') THEN
      v_xp_penalty := 50;
    END IF;
  END IF;

  UPDATE task_scores
  SET
    status = p_status,
    completed_at = now(),
    xp_earned = v_xp_earned,
    coins_earned = v_coins_earned,
    xp_penalty = v_xp_penalty,
    is_late = v_is_late,
    late_hours = v_late_hours,
    rework_count = CASE WHEN p_status = 'rework' THEN rework_count + 1 ELSE rework_count END
  WHERE id = p_task_score_id;

  UPDATE profiles
  SET
    xp = GREATEST(0, xp + v_xp_earned - v_xp_penalty),
    coins = coins + v_coins_earned,
    quests_completed = quests_completed + CASE WHEN p_status IN ('on_time', 'late') THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = v_task.user_id;

  IF v_xp_penalty > 0 THEN
    INSERT INTO task_penalties (user_id, task_score_id, penalty_type, xp_deducted, reason)
    VALUES (v_task.user_id, p_task_score_id, p_status::TEXT, v_xp_penalty,
            CASE
              WHEN p_status = 'late' THEN 'Tarefa entregue com atraso de ' || v_late_hours || ' horas'
              WHEN p_status = 'rework' THEN 'Tarefa devolvida para retrabalho'
              WHEN p_status = 'rejected' THEN 'Tarefa rejeitada por qualidade insuficiente'
              ELSE 'Penalidade aplicada'
            END);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'xp_earned', v_xp_earned,
    'coins_earned', v_coins_earned,
    'xp_penalty', v_xp_penalty,
    'is_late', v_is_late,
    'late_hours', v_late_hours
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_certificate_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  alphabet CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate TEXT;
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..12 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    candidate := substr(candidate, 1, 4) || '-' || substr(candidate, 5, 4) || '-' || substr(candidate, 9, 4);

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.user_certifications WHERE certificate_code = candidate
    );

    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar um código de certificado único';
    END IF;
  END LOOP;

  RETURN candidate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_boss_battle_leaderboard(_battle_id uuid, _limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_damage bigint, hits bigint, share numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_total  bigint;
  v_limit  integer := LEAST(GREATEST(COALESCE(_limit, 20), 1), 100);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT b.status INTO v_status FROM public.boss_battles b WHERE b.id = _battle_id;
  IF v_status IS NULL THEN
    RETURN;
  END IF;

  -- Rascunhos permanecem restritos a gestores/admins.
  IF v_status = 'draft'
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(d.damage), 0) INTO v_total
  FROM public.boss_battle_damage d
  WHERE d.battle_id = _battle_id;

  RETURN QUERY
  SELECT
    d.user_id,
    COALESCE(p.display_name, 'Participante') AS display_name,
    p.avatar_url,
    SUM(d.damage)::bigint AS total_damage,
    COUNT(*)::bigint AS hits,
    CASE WHEN v_total > 0
      THEN ROUND(SUM(d.damage)::numeric / v_total, 6)
      ELSE 0::numeric
    END AS share
  FROM public.boss_battle_damage d
  LEFT JOIN public.profiles_public p ON p.id = d.user_id
  WHERE d.battle_id = _battle_id
  GROUP BY d.user_id, p.display_name, p.avatar_url
  HAVING SUM(d.damage) > 0
  ORDER BY total_damage DESC, d.user_id ASC
  LIMIT v_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_lucky_wheel_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_last RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_last FROM public.lucky_wheel_spins
   WHERE user_id = v_user ORDER BY created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'can_spin', NOT EXISTS (
      SELECT 1 FROM public.lucky_wheel_spins
       WHERE user_id = v_user AND spin_date = v_today
    ),
    'today', v_today,
    'last_spin', CASE WHEN v_last IS NULL THEN NULL ELSE jsonb_build_object(
      'prize_label', v_last.prize_label,
      'prize_type', v_last.prize_type,
      'amount', v_last.amount,
      'spin_date', v_last.spin_date,
      'created_at', v_last.created_at
    ) END,
    'total_spins', (SELECT count(*) FROM public.lucky_wheel_spins WHERE user_id = v_user)
  );
END;
$function$;

-- `get_passkeys_by_email` e o unico caso em que a definicao VIVA de producao
-- devolve outra assinatura: `TABLE(credential_id text, user_id uuid)`. Ela e a
-- versao anterior a 20260728184541 — compara e-mail exato (sem lower/trim) e e
-- VOLATILE —, e CREATE OR REPLACE recusa trocar o tipo de retorno (42P13).
-- Por isso o DROP antes. O consumidor (supabase/functions/passkey-auth/index.ts)
-- le so `credential_id`, e o repositorio manda o e-mail digitado pelo usuario,
-- entao a versao com lower/trim e a correta. DROP zera a ACL da funcao, que
-- 20261226140000 havia fechado: o REVOKE/GRANT abaixo devolve o mesmo estado.
DROP FUNCTION IF EXISTS public.get_passkeys_by_email(text);

CREATE OR REPLACE FUNCTION public.get_passkeys_by_email(p_email text)
 RETURNS TABLE(credential_id text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT wc.credential_id
  FROM public.webauthn_credentials wc
  JOIN public.profiles p ON p.id = wc.user_id
  WHERE lower(trim(p.email)) = lower(trim(p_email))
    AND wc.is_active = true
  LIMIT 20;
END;
$function$;

  REVOKE ALL ON FUNCTION public.get_passkeys_by_email(text) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.get_passkeys_by_email(text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_push_outbox_health(p_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz;
  v_stuck_cutoff timestamptz;
  v_result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  p_hours := LEAST(GREATEST(COALESCE(p_hours, 24), 1), 720);
  v_since := now() - make_interval(hours => p_hours);
  v_stuck_cutoff := now() - interval '5 minutes';

  SELECT jsonb_build_object(
    'window_hours', p_hours,
    'pending', COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
    'processing', COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0),
    'stuck', COALESCE(SUM(CASE WHEN status = 'processing' AND updated_at < v_stuck_cutoff THEN 1 ELSE 0 END), 0),
    'sent', COALESCE(SUM(CASE WHEN status = 'sent' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    'failed', COALESCE(SUM(CASE WHEN status = 'failed' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    'skipped', COALESCE(SUM(CASE WHEN status = 'skipped' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    'oldest_pending_minutes', COALESCE(
      FLOOR(EXTRACT(EPOCH FROM (now() - MIN(CASE WHEN status = 'pending' THEN created_at END))) / 60), 0),
    'minutes_since_last_dispatch',
      CASE WHEN MAX(processed_at) IS NULL THEN NULL
           ELSE FLOOR(EXTRACT(EPOCH FROM (now() - MAX(processed_at))) / 60) END
  )
  INTO v_result
  FROM public.push_outbox;

  v_result := v_result || jsonb_build_object(
    'top_errors', COALESCE((
      SELECT jsonb_agg(e) FROM (
        SELECT jsonb_build_object('error', COALESCE(last_error, 'desconhecido'), 'count', COUNT(*)) AS e
        FROM public.push_outbox
        WHERE status = 'failed' AND processed_at >= v_since
        GROUP BY COALESCE(last_error, 'desconhecido')
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) t
    ), '[]'::jsonb),
    'recent_failures', COALESCE((
      SELECT jsonb_agg(f) FROM (
        SELECT jsonb_build_object(
          'id', id, 'type', type, 'title', title,
          'attempts', attempts, 'last_error', last_error, 'created_at', created_at
        ) AS f
        FROM public.push_outbox
        WHERE status = 'failed'
        ORDER BY updated_at DESC
        LIMIT 20
      ) t
    ), '[]'::jsonb)
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_push_outbox_health_trend(p_hours integer DEFAULT 48)
 RETURNS TABLE(bucket timestamp with time zone, avg_score numeric, min_score integer, max_pending integer, max_failed integer, critical_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  p_hours := LEAST(GREATEST(COALESCE(p_hours, 48), 1), 720);

  RETURN QUERY
  SELECT
    date_trunc('hour', s.created_at) AS bucket,
    round(AVG(s.score), 1) AS avg_score,
    MIN(s.score)::integer AS min_score,
    MAX(s.pending)::integer AS max_pending,
    MAX(s.failed)::integer AS max_failed,
    COUNT(*) FILTER (WHERE s.severity = 'critical')::integer AS critical_count
  FROM public.push_outbox_health_snapshots s
  WHERE s.created_at >= now() - make_interval(hours => p_hours)
  GROUP BY 1
  ORDER BY 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_sequence_procedure_stats(p_procedure_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days integer := GREATEST(1, LEAST(365, COALESCE(p_days, 30)));
  v_since date := ((now() AT TIME ZONE 'utc')::date - (v_days - 1));
  v_summary jsonb;
  v_leaderboard jsonb;
  v_steps jsonb;
  v_daily jsonb;
  v_recent jsonb;
BEGIN
  PERFORM public._require_admin();

  IF p_procedure_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.sequence_procedures WHERE id = p_procedure_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  SELECT jsonb_build_object(
    'attempts', COUNT(*),
    'players', COUNT(DISTINCT user_id),
    'perfect_attempts', COUNT(*) FILTER (WHERE is_perfect),
    'avg_accuracy', CASE WHEN COUNT(*) = 0 THEN 0 ELSE
      ROUND(AVG(CASE WHEN steps_total > 0
                     THEN correct_positions::numeric / steps_total ELSE 0 END) * 100, 1) END,
    'avg_duration_ms', COALESCE(ROUND(AVG(duration_ms))::int, 0),
    'best_duration_ms', COALESCE(MIN(duration_ms) FILTER (WHERE is_perfect), 0),
    'coins_awarded', COALESCE(SUM(coins_awarded), 0),
    'xp_awarded', COALESCE(SUM(xp_awarded), 0)
  )
  INTO v_summary
  FROM public.sequence_attempts
  WHERE procedure_id = p_procedure_id
    AND attempt_date >= v_since;

  WITH per_user AS (
    SELECT
      a.user_id,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE a.is_perfect)::int AS perfect_attempts,
      ROUND(MAX(CASE WHEN a.steps_total > 0
                     THEN a.correct_positions::numeric / a.steps_total ELSE 0 END) * 100, 1) AS best_accuracy,
      COALESCE(MIN(a.duration_ms) FILTER (WHERE a.is_perfect), MIN(a.duration_ms))::int AS best_duration_ms,
      COALESCE(SUM(a.coins_awarded), 0)::int AS coins_awarded
    FROM public.sequence_attempts a
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
    GROUP BY a.user_id
  ), ranked AS (
    SELECT
      pu.user_id,
      COALESCE(p.display_name, 'Participante') AS display_name,
      p.avatar_url,
      pu.attempts,
      pu.perfect_attempts,
      pu.best_accuracy,
      pu.best_duration_ms,
      pu.coins_awarded
    FROM per_user pu
    LEFT JOIN public.profiles p ON p.id = pu.user_id
    ORDER BY pu.perfect_attempts DESC, pu.best_accuracy DESC, pu.best_duration_ms ASC
    LIMIT 20
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(ranked)), '[]'::jsonb) INTO v_leaderboard FROM ranked;

  WITH ordered AS (
    SELECT u.ord::int AS position, u.step_id
    FROM public.sequence_attempts a
    CROSS JOIN LATERAL unnest(a.submitted_order) WITH ORDINALITY AS u(step_id, ord)
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
  ), by_step AS (
    SELECT
      s.id AS step_id,
      s.label,
      s.position,
      COUNT(o.position)::int AS evaluated,
      COUNT(*) FILTER (WHERE o.step_id = s.id)::int AS correct
    FROM public.sequence_steps s
    LEFT JOIN ordered o ON o.position = s.position
    WHERE s.procedure_id = p_procedure_id
    GROUP BY s.id, s.label, s.position
    ORDER BY s.position
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(by_step)), '[]'::jsonb) INTO v_steps FROM by_step;

  WITH daily AS (
    SELECT
      a.attempt_date AS day,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE a.is_perfect)::int AS perfect_attempts
    FROM public.sequence_attempts a
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
    GROUP BY a.attempt_date
    ORDER BY a.attempt_date
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(daily)), '[]'::jsonb) INTO v_daily FROM daily;

  WITH recent AS (
    SELECT
      a.id,
      a.user_id,
      COALESCE(p.display_name, 'Participante') AS display_name,
      a.steps_total,
      a.correct_positions,
      a.is_perfect,
      a.duration_ms,
      a.coins_awarded,
      a.xp_awarded,
      a.created_at
    FROM public.sequence_attempts a
    LEFT JOIN public.profiles p ON p.id = a.user_id
    WHERE a.procedure_id = p_procedure_id
      AND a.attempt_date >= v_since
    ORDER BY a.created_at DESC
    LIMIT 25
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(recent)), '[]'::jsonb) INTO v_recent FROM recent;

  RETURN jsonb_build_object(
    'success', true,
    'procedure_id', p_procedure_id,
    'days', v_days,
    'since', v_since,
    'summary', v_summary,
    'leaderboard', v_leaderboard,
    'steps', v_steps,
    'daily', v_daily,
    'recent', v_recent
  );
END;
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.get_wager_leaderboard(p_days integer DEFAULT 7, p_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, entries integer, correct_count integer, accuracy numeric, staked_coins integer, net_coins integer, xp_awarded integer, current_streak integer, best_streak integer, last_played date, rank integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH bounds AS (
    SELECT (now() AT TIME ZONE 'utc')::date
           - (LEAST(GREATEST(COALESCE(p_days, 7), 1), 90) - 1) AS since
  ),
  ent AS (
    SELECT e.user_id,
           e.is_correct,
           e.coins_delta,
           e.stake_coins,
           e.xp_awarded,
           q.scheduled_date,
           e.created_at
    FROM public.wager_entries e
    JOIN public.wager_questions q ON q.id = e.question_id
    CROSS JOIN bounds b
    WHERE q.scheduled_date >= b.since
  ),
  ord AS (
    SELECT ent.*,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY scheduled_date, created_at) AS rn,
           ROW_NUMBER() OVER (PARTITION BY user_id, is_correct ORDER BY scheduled_date, created_at) AS rn2
    FROM ent
  ),
  runs AS (
    SELECT user_id,
           COUNT(*)::int AS len,
           MAX(scheduled_date) AS last_date,
           MAX(created_at) AS last_at
    FROM ord
    WHERE is_correct
    GROUP BY user_id, (rn - rn2)
  ),
  best AS (
    SELECT user_id, MAX(len)::int AS best_streak FROM runs GROUP BY user_id
  ),
  last_run AS (
    SELECT DISTINCT ON (user_id) user_id, len
    FROM runs
    ORDER BY user_id, last_date DESC, last_at DESC
  ),
  last_entry AS (
    SELECT DISTINCT ON (user_id) user_id, is_correct, scheduled_date
    FROM ent
    ORDER BY user_id, scheduled_date DESC, created_at DESC
  ),
  agg AS (
    SELECT user_id,
           COUNT(*)::int AS entries,
           COUNT(*) FILTER (WHERE is_correct)::int AS correct_count,
           COALESCE(SUM(stake_coins), 0)::int AS staked_coins,
           COALESCE(SUM(coins_delta), 0)::int AS net_coins,
           COALESCE(SUM(xp_awarded), 0)::int AS xp_awarded
    FROM ent
    GROUP BY user_id
  )
  SELECT
    a.user_id,
    COALESCE(p.display_name, 'Jogador') AS display_name,
    p.avatar_url,
    a.entries,
    a.correct_count,
    ROUND((a.correct_count::numeric / NULLIF(a.entries, 0)) * 100, 1) AS accuracy,
    a.staked_coins,
    a.net_coins,
    a.xp_awarded,
    CASE WHEN le.is_correct THEN COALESCE(lr.len, 0) ELSE 0 END AS current_streak,
    COALESCE(b.best_streak, 0) AS best_streak,
    le.scheduled_date AS last_played,
    (ROW_NUMBER() OVER (
      ORDER BY a.net_coins DESC,
               a.correct_count DESC,
               (a.correct_count::numeric / NULLIF(a.entries, 0)) DESC NULLS LAST,
               a.entries DESC,
               a.user_id
    ))::int AS rank
  FROM agg a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  LEFT JOIN best b ON b.user_id = a.user_id
  LEFT JOIN last_run lr ON lr.user_id = a.user_id
  LEFT JOIN last_entry le ON le.user_id = a.user_id
  ORDER BY rank
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_t public.tournaments%ROWTYPE;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_join:' || p_tournament_id::text, 0));

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_t.status <> 'registration' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_closed');
  END IF;
  IF v_t.registration_closes_at IS NOT NULL AND now() > v_t.registration_closes_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_closed');
  END IF;
  IF now() < v_t.registration_opens_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_not_open');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tournament_participants
             WHERE tournament_id = p_tournament_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('success', true, 'already_joined', true);
  END IF;

  SELECT count(*) INTO v_count FROM public.tournament_participants
   WHERE tournament_id = p_tournament_id;
  IF v_count >= v_t.max_participants THEN
    RETURN jsonb_build_object('success', false, 'reason', 'full');
  END IF;

  INSERT INTO public.tournament_participants (tournament_id, user_id)
  VALUES (p_tournament_id, v_user);

  RETURN jsonb_build_object('success', true, 'already_joined', false,
                            'participants', v_count + 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_external_api_keys()
 RETURNS TABLE(id uuid, name text, description text, api_key text, system_type text, permissions jsonb, is_active boolean, rate_limit_per_minute integer, last_used_at timestamp with time zone, secret_last_rotated_at timestamp with time zone, days_since_rotation integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    eak.id,
    eak.name,
    eak.description,
    -- Exibe apenas prefixo + sufixo do identificador público
    left(eak.api_key, 6) || '…' || right(eak.api_key, 4) AS api_key,
    eak.system_type,
    eak.permissions,
    eak.is_active,
    eak.rate_limit_per_minute,
    eak.last_used_at,
    eak.secret_last_rotated_at,
    GREATEST(0, EXTRACT(DAY FROM now() - COALESCE(eak.secret_last_rotated_at, eak.created_at))::int) AS days_since_rotation,
    eak.created_at
  FROM public.external_api_keys eak
  ORDER BY eak.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_wager_questions(p_from date DEFAULT (CURRENT_DATE - 30), p_to date DEFAULT (CURRENT_DATE + 60))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_rows jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;
  IF NOT (has_role(v_uid, 'admin'::app_role) OR has_role(v_uid, 'manager'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.scheduled_date DESC), '[]'::jsonb)
    INTO v_rows
  FROM (
    SELECT q.id,
           q.question,
           q.options,
           q.correct_option,
           q.explanation,
           q.difficulty,
           q.base_multiplier,
           q.max_stake,
           q.scheduled_date,
           q.is_active,
           coalesce(s.total_entries, 0) AS total_entries,
           coalesce(s.correct_entries, 0) AS correct_entries,
           coalesce(s.total_staked, 0) AS total_staked,
           coalesce(s.coins_delta, 0) AS coins_delta
      FROM wager_questions q
      LEFT JOIN (
        SELECT question_id,
               count(*) AS total_entries,
               count(*) FILTER (WHERE is_correct) AS correct_entries,
               sum(stake_coins) AS total_staked,
               sum(coins_delta) AS coins_delta
          FROM wager_entries
         GROUP BY question_id
      ) s ON s.question_id = q.id
     WHERE q.scheduled_date BETWEEN p_from AND p_to
  ) t;

  RETURN jsonb_build_object('success', true, 'questions', v_rows);
END;
$function$;

CREATE OR REPLACE FUNCTION public.raise_lucky_wheel_window_alerts(p_window_days integer DEFAULT 7, p_coins_per_spin_budget numeric DEFAULT NULL::numeric, p_min_cost_increase numeric DEFAULT 0.15, p_max_volume_drop numeric DEFAULT 0.30, p_min_spins integer DEFAULT 30, p_min_days integer DEFAULT 3, p_end_date date DEFAULT NULL::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_end date := COALESCE(p_end_date, (now() AT TIME ZONE 'utc')::date);
  v_days integer := GREATEST(COALESCE(p_window_days, 7), 1);
  v_budget numeric := COALESCE(
    p_coins_per_spin_budget,
    (SELECT s.coins_per_spin_budget FROM public.lucky_wheel_settings s WHERE s.id LIMIT 1),
    30
  );
  v_cur_start date;
  v_prev_start date;
  v_prev_end date;
  v_window_key text;
  cur record;
  prev record;
  v_cost_ratio numeric;
  v_volume_ratio numeric;
  v_overrun numeric;
  v_created integer := 0;
BEGIN
  v_cur_start := v_end - (v_days - 1);
  v_prev_end := v_cur_start - 1;
  v_prev_start := v_prev_end - (v_days - 1);
  v_window_key := v_cur_start::text || '_' || v_end::text;

  SELECT COUNT(*)::int AS days_with_data,
         COALESCE(SUM(spins), 0)::int AS spins,
         CASE WHEN COALESCE(SUM(spins), 0) > 0
              THEN SUM(coins_paid)::numeric / SUM(spins) ELSE 0 END AS coins_per_spin,
         CASE WHEN COUNT(*) > 0
              THEN SUM(spins)::numeric / COUNT(*) ELSE 0 END AS spins_per_day
    INTO cur
    FROM public.lucky_wheel_payout_snapshots
   WHERE snapshot_date BETWEEN v_cur_start AND v_end;

  SELECT COUNT(*)::int AS days_with_data,
         COALESCE(SUM(spins), 0)::int AS spins,
         CASE WHEN COALESCE(SUM(spins), 0) > 0
              THEN SUM(coins_paid)::numeric / SUM(spins) ELSE 0 END AS coins_per_spin,
         CASE WHEN COUNT(*) > 0
              THEN SUM(spins)::numeric / COUNT(*) ELSE 0 END AS spins_per_day
    INTO prev
    FROM public.lucky_wheel_payout_snapshots
   WHERE snapshot_date BETWEEN v_prev_start AND v_prev_end;

  IF v_budget > 0
     AND cur.spins >= p_min_spins
     AND cur.coins_per_spin > v_budget THEN
    v_overrun := (cur.coins_per_spin - v_budget) / v_budget;
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'lucky_wheel_window_budget_overrun',
      CASE WHEN v_overrun > 0.5 THEN 'critical' ELSE 'high' END,
      'Roleta: orçamento de moedas por giro estourado',
      format('A janela %s pagou %s moeda(s) por giro contra o teto de %s (%s%% acima).',
             v_window_key, round(cur.coins_per_spin, 2), round(v_budget, 2),
             round(v_overrun * 100, 1)),
      jsonb_build_object(
        'ref_date', 'window_budget:' || v_window_key,
        'window', v_window_key,
        'coins_per_spin', round(cur.coins_per_spin, 4),
        'budget', round(v_budget, 4),
        'overrun', round(v_overrun, 4),
        'spins', cur.spins)
    )
    ON CONFLICT DO NOTHING;
    v_created := v_created + 1;
  END IF;

  IF cur.spins >= p_min_spins AND prev.spins >= p_min_spins
     AND cur.days_with_data >= p_min_days AND prev.days_with_data >= p_min_days THEN

    IF prev.coins_per_spin > 0 THEN
      v_cost_ratio := (cur.coins_per_spin - prev.coins_per_spin) / prev.coins_per_spin;
      IF v_cost_ratio >= p_min_cost_increase THEN
        INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
        VALUES (
          'lucky_wheel_window_cost_regression',
          CASE WHEN v_cost_ratio >= p_min_cost_increase * 3 THEN 'high' ELSE 'medium' END,
          'Roleta: custo por giro subiu de forma relevante',
          format('Custo por giro passou de %s para %s moeda(s) (%s%%) na janela %s.',
                 round(prev.coins_per_spin, 2), round(cur.coins_per_spin, 2),
                 round(v_cost_ratio * 100, 1), v_window_key),
          jsonb_build_object(
            'ref_date', 'window_cost:' || v_window_key,
            'window', v_window_key,
            'current', round(cur.coins_per_spin, 4),
            'previous', round(prev.coins_per_spin, 4),
            'delta_ratio', round(v_cost_ratio, 4),
            'spins', cur.spins)
        )
        ON CONFLICT DO NOTHING;
        v_created := v_created + 1;
      END IF;
    END IF;

    IF prev.spins_per_day > 0 THEN
      v_volume_ratio := (prev.spins_per_day - cur.spins_per_day) / prev.spins_per_day;
      IF v_volume_ratio >= p_max_volume_drop THEN
        INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
        VALUES (
          'lucky_wheel_window_volume_drop',
          CASE WHEN v_volume_ratio >= p_max_volume_drop * 2 THEN 'high' ELSE 'medium' END,
          'Roleta: queda relevante de participação',
          format('Giros por dia caíram de %s para %s (-%s%%) na janela %s.',
                 round(prev.spins_per_day, 2), round(cur.spins_per_day, 2),
                 round(v_volume_ratio * 100, 1), v_window_key),
          jsonb_build_object(
            'ref_date', 'window_volume:' || v_window_key,
            'window', v_window_key,
            'current', round(cur.spins_per_day, 4),
            'previous', round(prev.spins_per_day, 4),
            'drop', round(v_volume_ratio, 4),
            'spins', cur.spins)
        )
        ON CONFLICT DO NOTHING;
        v_created := v_created + 1;
      END IF;
    END IF;
  END IF;

  RETURN v_created;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalc_campaign_progress(_campaign_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  PERFORM public.recalc_campaign_progress_impl(_campaign_id);
END; $function$;

CREATE OR REPLACE FUNCTION public.register_device(p_user_id uuid, p_fingerprint text, p_ip_address inet, p_user_agent text, p_browser text DEFAULT NULL::text, p_os text DEFAULT NULL::text, p_device_type text DEFAULT 'desktop'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_device user_devices%ROWTYPE;
  v_is_new BOOLEAN := false;
  v_device_id UUID;
  v_alert_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: dispositivo só pode ser registrado para a própria conta'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_device
  FROM user_devices
  WHERE user_id = p_user_id AND device_fingerprint = p_fingerprint;

  IF v_device IS NULL THEN
    v_is_new := true;

    INSERT INTO user_devices (
      user_id, device_fingerprint, ip_address, user_agent,
      browser, os, device_type
    ) VALUES (
      p_user_id, p_fingerprint, p_ip_address, p_user_agent,
      p_browser, p_os, p_device_type
    )
    RETURNING id INTO v_device_id;

    INSERT INTO new_device_alerts (user_id, device_id, ip_address, user_agent)
    VALUES (p_user_id, v_device_id, p_ip_address, p_user_agent)
    RETURNING id INTO v_alert_id;

    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'security',
      'Novo dispositivo detectado',
      'Um login foi realizado de um novo dispositivo: ' || COALESCE(p_browser, 'Navegador desconhecido') || ' em ' || COALESCE(p_os, 'Sistema desconhecido'),
      jsonb_build_object(
        'alert_id', v_alert_id,
        'device_id', v_device_id,
        'ip_address', p_ip_address::TEXT,
        'browser', p_browser,
        'os', p_os
      )
    );
  ELSE
    UPDATE user_devices
    SET
      last_seen_at = now(),
      ip_address = COALESCE(p_ip_address, ip_address)
    WHERE id = v_device.id;

    v_device_id := v_device.id;
  END IF;

  RETURN jsonb_build_object(
    'is_new_device', v_is_new,
    'device_id', v_device_id,
    'is_trusted', COALESCE(v_device.is_trusted, false)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_password_reset(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id UUID;
  v_existing_pending UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NOT NULL
     AND p_user_id IS DISTINCT FROM v_uid
     AND NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: solicitação permitida apenas para a própria conta'
      USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_existing_pending
  FROM password_reset_requests
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF v_existing_pending IS NOT NULL THEN
    RAISE EXCEPTION 'Já existe uma solicitação de reset pendente';
  END IF;

  INSERT INTO password_reset_requests (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NOT NULL THEN
    IF NOT public.has_role(v_uid, 'admin')
       AND lower(COALESCE(p_email, '')) IS DISTINCT FROM lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
      RAISE EXCEPTION 'Acesso negado: só é possível limpar tentativas da própria conta'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE login_attempts
  SET error_message = NULL
  WHERE email = p_email
    AND error_message IS NOT NULL
    AND created_at > now() - INTERVAL '30 minutes';
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_device_by_fingerprint(p_fingerprint text, p_reason text DEFAULT 'revoked_by_user'::text)
 RETURNS TABLE(revoked boolean, subscriptions_revoked integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_fp text := NULLIF(btrim(p_fingerprint), '');
  v_reason text := COALESCE(NULLIF(btrim(p_reason), ''), 'revoked_by_user');
  v_count integer := 0;
  v_device_exists boolean;
  v_changed boolean := false;
  v_sub public.push_subscriptions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF v_fp IS NULL THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_devices
    WHERE user_id = v_user AND device_fingerprint = v_fp
  ) INTO v_device_exists;

  IF NOT v_device_exists AND NOT EXISTS (
    SELECT 1 FROM public.push_subscriptions
    WHERE user_id = v_user AND device_fingerprint = v_fp
  ) THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  FOR v_sub IN
    SELECT * FROM public.push_subscriptions
    WHERE user_id = v_user AND device_fingerprint = v_fp AND disabled_at IS NULL
    FOR UPDATE
  LOOP
    UPDATE public.push_subscriptions
       SET disabled_at = now(), disabled_reason = v_reason, updated_at = now()
     WHERE id = v_sub.id;

    INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
    VALUES (v_user, v_sub.id, v_sub.endpoint, v_sub.device_label, 'revoked',
            'Aparelho removido pelo usuário.');

    v_count := v_count + 1;
  END LOOP;

  UPDATE public.user_devices
     SET revoked_at = now(), revoked_reason = v_reason, is_trusted = false
   WHERE user_id = v_user AND device_fingerprint = v_fp AND revoked_at IS NULL;

  GET DIAGNOSTICS v_changed = ROW_COUNT;

  RETURN QUERY SELECT (v_count > 0 OR v_changed), v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_push_device(p_subscription_id uuid, p_reason text DEFAULT 'revoked_by_user'::text)
 RETURNS TABLE(revoked boolean, device_label text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_row public.push_subscriptions%ROWTYPE;
  v_reason text := COALESCE(NULLIF(btrim(p_reason), ''), 'revoked_by_user');
  v_sibling public.push_subscriptions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_row
  FROM public.push_subscriptions
  WHERE id = p_subscription_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.disabled_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_row.device_label;
    RETURN;
  END IF;

  UPDATE public.push_subscriptions
     SET disabled_at = now(),
         disabled_reason = v_reason,
         updated_at = now()
   WHERE id = v_row.id;

  INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
  VALUES (v_user, v_row.id, v_row.endpoint, v_row.device_label, 'revoked',
          'Acesso removido remotamente pelo usuário.');

  -- Mesmo aparelho pode ter mais de uma inscrição (renovação do endpoint pelo
  -- navegador). Sem a cascata, o aparelho continuaria recebendo push.
  IF v_row.device_fingerprint IS NOT NULL THEN
    FOR v_sibling IN
      SELECT * FROM public.push_subscriptions
      WHERE user_id = v_user
        AND device_fingerprint = v_row.device_fingerprint
        AND id <> v_row.id
        AND disabled_at IS NULL
      FOR UPDATE
    LOOP
      UPDATE public.push_subscriptions
         SET disabled_at = now(), disabled_reason = v_reason, updated_at = now()
       WHERE id = v_sibling.id;

      INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
      VALUES (v_user, v_sibling.id, v_sibling.endpoint, v_sibling.device_label, 'revoked',
              'Inscrição do mesmo aparelho removida em cascata.');
    END LOOP;

    UPDATE public.user_devices
       SET revoked_at = now(),
           revoked_reason = v_reason,
           is_trusted = false
     WHERE user_id = v_user
       AND device_fingerprint = v_row.device_fingerprint
       AND revoked_at IS NULL;
  END IF;

  RETURN QUERY SELECT true, v_row.device_label;
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_auction(p_auction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auction public.auctions%ROWTYPE;
  v_winner public.auction_bids%ROWTYPE;
  v_refunded INTEGER := 0;
  v_stock INTEGER;
  v_delivered BOOLEAN := false;
  v_notified INTEGER := 0;
  v_queued INTEGER := 0;
  r RECORD;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auction_id::text, 42));

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_auction.status IN ('closed','cancelled') THEN
    RETURN jsonb_build_object('success', true, 'replayed', true, 'winner_id', v_auction.winner_id);
  END IF;

  SELECT * INTO v_winner
  FROM public.auction_bids
  WHERE auction_id = p_auction_id AND status = 'active'
  ORDER BY amount DESC, created_at ASC
  LIMIT 1;

  FOR r IN
    SELECT * FROM public.auction_bids
    WHERE auction_id = p_auction_id
      AND status = 'active'
      AND (v_winner.id IS NULL OR id <> v_winner.id)
  LOOP
    UPDATE public.profiles SET coins = coins + r.escrow_coins WHERE id = r.user_id;
    UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = r.id;
    v_refunded := v_refunded + 1;

    IF public.user_wants_in_app_notification(r.user_id, 'auction') THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (r.user_id, 'auction',
              'Leilão encerrado',
              'Você não venceu "' || v_auction.title || '". Suas ' || r.escrow_coins || ' moedas foram devolvidas.',
              jsonb_build_object('auction_id', p_auction_id, 'outcome', 'refunded', 'refunded_amount', r.escrow_coins));
      v_notified := v_notified + 1;
    END IF;

    IF public.enqueue_push(
      r.user_id, 'auction', 'Leilão encerrado',
      'Você não venceu "' || v_auction.title || '". Suas ' || r.escrow_coins || ' moedas foram devolvidas.',
      'auction:' || p_auction_id::text || ':' || r.user_id::text || ':refunded',
      '/leilao',
      jsonb_build_object('auction_id', p_auction_id, 'outcome', 'refunded')
    ) THEN
      v_queued := v_queued + 1;
    END IF;
  END LOOP;

  IF v_winner.id IS NOT NULL THEN
    UPDATE public.auction_bids SET status = 'won' WHERE id = v_winner.id;

    IF v_auction.reward_id IS NOT NULL THEN
      SELECT stock INTO v_stock FROM public.shop_rewards WHERE id = v_auction.reward_id FOR UPDATE;

      IF v_stock IS NULL OR v_stock > 0 THEN
        IF v_stock IS NOT NULL THEN
          UPDATE public.shop_rewards SET stock = stock - 1 WHERE id = v_auction.reward_id;
        END IF;

        INSERT INTO public.shop_purchases (user_id, reward_id, status, quantity, total_coins, notes)
        VALUES (v_winner.user_id, v_auction.reward_id, 'pending', 1, v_winner.amount,
                'Resgate automático — leilão: ' || v_auction.title);
        v_delivered := true;

        PERFORM public.log_auction_admin_event(p_auction_id, 'stock_reserved', jsonb_build_object(
          'reward_id', v_auction.reward_id, 'winner_id', v_winner.user_id, 'amount', v_winner.amount
        ));
      ELSE
        UPDATE public.profiles SET coins = coins + v_winner.escrow_coins WHERE id = v_winner.user_id;
        UPDATE public.auction_bids SET status = 'refunded', escrow_coins = 0 WHERE id = v_winner.id;
        v_refunded := v_refunded + 1;

        IF public.user_wants_in_app_notification(v_winner.user_id, 'auction') THEN
          INSERT INTO public.notifications (user_id, type, title, message, data)
          VALUES (v_winner.user_id, 'auction',
                  'Item esgotado no leilão',
                  'O item de "' || v_auction.title || '" ficou indisponível. Suas ' || v_winner.escrow_coins || ' moedas foram devolvidas.',
                  jsonb_build_object('auction_id', p_auction_id, 'outcome', 'stock_unavailable', 'refunded_amount', v_winner.escrow_coins));
          v_notified := v_notified + 1;
        END IF;

        IF public.enqueue_push(
          v_winner.user_id, 'auction', 'Item esgotado no leilão',
          'O item de "' || v_auction.title || '" ficou indisponível. Suas moedas foram devolvidas.',
          'auction:' || p_auction_id::text || ':' || v_winner.user_id::text || ':stock_unavailable',
          '/leilao',
          jsonb_build_object('auction_id', p_auction_id, 'outcome', 'stock_unavailable')
        ) THEN
          v_queued := v_queued + 1;
        END IF;

        PERFORM public.log_auction_admin_event(p_auction_id, 'stock_unavailable', jsonb_build_object(
          'reward_id', v_auction.reward_id, 'winner_id', v_winner.user_id, 'refunded_amount', v_winner.escrow_coins
        ));
      END IF;
    ELSE
      v_delivered := true;
    END IF;

    IF v_delivered THEN
      IF public.user_wants_in_app_notification(v_winner.user_id, 'auction') THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (v_winner.user_id, 'auction',
                'Você venceu o leilão!',
                'Arremate confirmado em "' || v_auction.title || '" por ' || v_winner.amount || ' moedas.' ||
                CASE WHEN v_auction.reward_id IS NOT NULL THEN ' O item já foi reservado para você.' ELSE '' END,
                jsonb_build_object('auction_id', p_auction_id, 'outcome', 'won', 'winning_bid', v_winner.amount,
                                   'reward_id', v_auction.reward_id));
        v_notified := v_notified + 1;
      END IF;

      IF public.enqueue_push(
        v_winner.user_id, 'auction', 'Você venceu o leilão!',
        'Arremate confirmado em "' || v_auction.title || '" por ' || v_winner.amount || ' moedas.',
        'auction:' || p_auction_id::text || ':' || v_winner.user_id::text || ':won',
        '/leilao',
        jsonb_build_object('auction_id', p_auction_id, 'outcome', 'won')
      ) THEN
        v_queued := v_queued + 1;
      END IF;
    END IF;
  END IF;

  UPDATE public.auctions
  SET status = 'closed',
      closed_at = now(),
      winner_id = CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
      winning_bid = CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END
  WHERE id = p_auction_id;

  PERFORM public.log_auction_admin_event(p_auction_id, 'settled', jsonb_build_object(
    'winner_id', CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
    'winning_bid', CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END,
    'refunded', v_refunded,
    'notified', v_notified,
    'push_queued', v_queued
  ));

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'winner_id', CASE WHEN v_delivered THEN v_winner.user_id ELSE NULL END,
    'winning_bid', CASE WHEN v_delivered THEN v_winner.amount ELSE NULL END,
    'refunded', v_refunded,
    'notified', v_notified,
    'push_queued', v_queued
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_prediction_market(p_market_id uuid, p_winning_option_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_market public.prediction_markets%ROWTYPE;
  v_total integer;
  v_winner_pool integer := 0;
  v_rake integer := 0;
  v_distributable integer := 0;
  v_refund boolean := false;
  v_assigned integer := 0;
  v_remainder integer := 0;
  v_row record;
  v_rank integer := 0;
  v_paid integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_market_id::text, 1));

  SELECT * INTO v_market FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'market_not_found');
  END IF;
  IF v_market.status IN ('settled','voided') THEN
    RETURN jsonb_build_object('ok', true, 'already_settled', true);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.prediction_stakes WHERE market_id = p_market_id;

  IF p_winning_option_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_winner_pool
      FROM public.prediction_stakes
      WHERE market_id = p_market_id AND option_id = p_winning_option_id;
  END IF;

  -- Reembolso: anulado, opção inválida, sem vencedores ou pool 100% vencedor.
  v_refund := p_winning_option_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.prediction_options
                   WHERE id = p_winning_option_id AND market_id = p_market_id)
    OR v_winner_pool = 0
    OR v_winner_pool >= v_total;

  IF v_refund THEN
    FOR v_row IN
      SELECT user_id, SUM(amount)::integer AS amount
        FROM public.prediction_stakes WHERE market_id = p_market_id
        GROUP BY user_id
    LOOP
      UPDATE public.profiles SET coins = coins + v_row.amount WHERE id = v_row.user_id;
      v_paid := v_paid + v_row.amount;
      PERFORM public.enqueue_push(
        v_row.user_id,
        'Mercado de previsões anulado',
        'Seu aporte de ' || v_row.amount || ' moedas foi devolvido integralmente.',
        '/previsoes',
        'prediction_refund:' || p_market_id::text || ':' || v_row.user_id::text
      );
    END LOOP;

    UPDATE public.prediction_stakes s
      SET payout = agg.amount
      FROM (SELECT user_id, SUM(amount)::integer AS amount
              FROM public.prediction_stakes WHERE market_id = p_market_id
              GROUP BY user_id) agg
      WHERE s.market_id = p_market_id AND s.user_id = agg.user_id
        AND s.id = (SELECT id FROM public.prediction_stakes x
                     WHERE x.market_id = p_market_id AND x.user_id = agg.user_id
                     ORDER BY x.created_at LIMIT 1);
    UPDATE public.prediction_stakes SET payout = COALESCE(payout, 0)
      WHERE market_id = p_market_id AND payout IS NULL;

    UPDATE public.prediction_markets
      SET status = CASE WHEN p_winning_option_id IS NULL THEN 'voided' ELSE 'settled' END,
          winning_option_id = p_winning_option_id,
          rake_collected = 0,
          settled_at = now(),
          settled_by = auth.uid()
      WHERE id = p_market_id;

    RETURN jsonb_build_object('ok', true, 'refunded', true, 'total', v_total, 'paid', v_paid, 'rake', 0);
  END IF;

  v_rake := floor(v_total * v_market.rake_bps / 10000.0)::integer;
  v_distributable := v_total - v_rake;

  CREATE TEMP TABLE tmp_prediction_payout ON COMMIT DROP AS
    SELECT user_id,
           SUM(amount)::integer AS stake,
           floor(v_distributable::numeric * SUM(amount) / v_winner_pool)::integer AS amount
      FROM public.prediction_stakes
      WHERE market_id = p_market_id AND option_id = p_winning_option_id
      GROUP BY user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_assigned FROM tmp_prediction_payout;
  v_remainder := v_distributable - v_assigned;

  -- Resto determinístico: maiores aportes primeiro, desempate por user_id.
  FOR v_row IN
    SELECT user_id FROM tmp_prediction_payout ORDER BY stake DESC, user_id ASC
  LOOP
    EXIT WHEN v_rank >= v_remainder;
    UPDATE tmp_prediction_payout SET amount = amount + 1 WHERE user_id = v_row.user_id;
    v_rank := v_rank + 1;
  END LOOP;

  FOR v_row IN SELECT user_id, stake, amount FROM tmp_prediction_payout LOOP
    UPDATE public.profiles SET coins = coins + v_row.amount WHERE id = v_row.user_id;
    v_paid := v_paid + v_row.amount;
    UPDATE public.prediction_stakes
      SET payout = CASE WHEN id = (SELECT x.id FROM public.prediction_stakes x
                                    WHERE x.market_id = p_market_id AND x.user_id = v_row.user_id
                                    ORDER BY x.created_at LIMIT 1)
                        THEN v_row.amount ELSE 0 END
      WHERE market_id = p_market_id AND user_id = v_row.user_id;
    PERFORM public.enqueue_push(
      v_row.user_id,
      'Você acertou a previsão!',
      'Recebeu ' || v_row.amount || ' moedas (aporte de ' || v_row.stake || ').',
      '/previsoes',
      'prediction_win:' || p_market_id::text || ':' || v_row.user_id::text
    );
  END LOOP;

  UPDATE public.prediction_stakes SET payout = 0
    WHERE market_id = p_market_id AND payout IS NULL;

  UPDATE public.prediction_markets
    SET status = 'settled',
        winning_option_id = p_winning_option_id,
        rake_collected = v_rake,
        settled_at = now(),
        settled_by = auth.uid()
    WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'ok', true, 'refunded', false, 'total', v_total,
    'paid', v_paid, 'rake', v_rake,
    'conserved', (v_paid + v_rake) = v_total
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.snapshot_lucky_wheel_payout(p_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date date := COALESCE(p_date, ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 1));
  v_spins integer := 0;
  v_users integer := 0;
  v_coins integer := 0;
  v_xp integer := 0;
  v_total_weight numeric := 0;
  v_projected_coins numeric := 0;
  v_projected_xp numeric := 0;
  v_chi numeric := 0;
  v_df integer := 0;
  v_duplicates integer := 0;
  v_unconfigured integer := 0;
  v_deviation numeric := 0;
  v_warn double precision;
  v_crit double precision;
  v_alerts integer := 0;
BEGIN
  SELECT count(*), count(DISTINCT user_id),
         COALESCE(sum(amount) FILTER (WHERE prize_type = 'coins'), 0),
         COALESCE(sum(amount) FILTER (WHERE prize_type = 'xp'), 0),
         count(*) FILTER (WHERE prize_id IS NULL)
    INTO v_spins, v_users, v_coins, v_xp, v_unconfigured
    FROM public.lucky_wheel_spins
   WHERE spin_date = v_date;

  -- Giros além do limite de um por usuário por dia.
  SELECT COALESCE(sum(c - 1), 0) INTO v_duplicates
    FROM (
      SELECT count(*) AS c
        FROM public.lucky_wheel_spins
       WHERE spin_date = v_date
       GROUP BY user_id
      HAVING count(*) > 1
    ) d;

  SELECT COALESCE(sum(weight), 0) INTO v_total_weight
    FROM public.lucky_wheel_prizes WHERE is_active;

  IF v_total_weight > 0 AND v_spins > 0 THEN
    SELECT COALESCE(sum(CASE WHEN prize_type = 'coins' THEN amount::numeric * weight / v_total_weight ELSE 0 END), 0) * v_spins,
           COALESCE(sum(CASE WHEN prize_type = 'xp' THEN amount::numeric * weight / v_total_weight ELSE 0 END), 0) * v_spins
      INTO v_projected_coins, v_projected_xp
      FROM public.lucky_wheel_prizes WHERE is_active;

    SELECT COALESCE(sum(power(obs - exp_n, 2) / NULLIF(exp_n, 0)), 0), count(*)
      INTO v_chi, v_df
      FROM (
        SELECT p.id,
               (p.weight::numeric / v_total_weight) * v_spins AS exp_n,
               (SELECT count(*) FROM public.lucky_wheel_spins s
                 WHERE s.spin_date = v_date AND s.prize_id = p.id)::numeric AS obs
          FROM public.lucky_wheel_prizes p
         WHERE p.is_active AND p.weight > 0
      ) t;
    v_df := greatest(v_df - 1, 0);
  END IF;

  INSERT INTO public.lucky_wheel_payout_snapshots (
    snapshot_date, spins, unique_users, coins_paid, xp_paid,
    projected_coins, projected_xp, chi_square, degrees_of_freedom,
    duplicate_spins, unconfigured_spins
  ) VALUES (
    v_date, v_spins, v_users, v_coins, v_xp,
    v_projected_coins, v_projected_xp, v_chi, v_df,
    v_duplicates, v_unconfigured
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    spins = EXCLUDED.spins, unique_users = EXCLUDED.unique_users,
    coins_paid = EXCLUDED.coins_paid, xp_paid = EXCLUDED.xp_paid,
    projected_coins = EXCLUDED.projected_coins, projected_xp = EXCLUDED.projected_xp,
    chi_square = EXCLUDED.chi_square, degrees_of_freedom = EXCLUDED.degrees_of_freedom,
    duplicate_spins = EXCLUDED.duplicate_spins, unconfigured_spins = EXCLUDED.unconfigured_spins,
    updated_at = now();

  -- Alerta 1: distribuição fora da calibração.
  IF v_spins >= 50 AND v_df >= 1 THEN
    v_warn := public.chi_square_critical(v_df, 0.01);
    v_crit := public.chi_square_critical(v_df, 0.0001);
    IF v_chi::double precision > v_warn THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'lucky_wheel_chi_square',
        CASE WHEN v_chi::double precision > v_crit THEN 'critical' ELSE 'high' END,
        'Roleta: distribuição de prêmios fora do esperado',
        format('χ² = %s com %s grau(s) de liberdade em %s giro(s), acima do limite de %s.',
               round(v_chi, 2), v_df, v_spins, round(v_warn::numeric, 2)),
        jsonb_build_object('ref_date', v_date::text, 'chi_square', round(v_chi, 4),
                           'degrees_of_freedom', v_df, 'warn_limit', round(v_warn::numeric, 4),
                           'critical_limit', round(v_crit::numeric, 4), 'spins', v_spins)
      )
      ON CONFLICT DO NOTHING;
      v_alerts := v_alerts + 1;
    END IF;
  END IF;

  -- Alerta 2: custo divergente da projeção.
  IF v_projected_coins > 0 AND v_spins >= 50 THEN
    v_deviation := abs(v_coins - v_projected_coins) / v_projected_coins;
    IF v_deviation > 0.25 THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'lucky_wheel_cost_deviation',
        CASE WHEN v_deviation > 0.5 THEN 'high' ELSE 'medium' END,
        'Roleta: custo em moedas divergente da projeção',
        format('Pagou %s moeda(s) contra %s projetada(s) (desvio de %s%%).',
               v_coins, round(v_projected_coins), round(v_deviation * 100, 1)),
        jsonb_build_object('ref_date', v_date::text, 'coins_paid', v_coins,
                           'projected_coins', round(v_projected_coins, 2),
                           'deviation', round(v_deviation, 4), 'spins', v_spins)
      )
      ON CONFLICT DO NOTHING;
      v_alerts := v_alerts + 1;
    END IF;
  END IF;

  -- Alerta 3: giros duplicados.
  IF v_duplicates > 0 THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'lucky_wheel_duplicate_spins', 'critical',
      'Roleta: giros duplicados detectados',
      format('%s giro(s) além do limite de um por usuário por dia.', v_duplicates),
      jsonb_build_object('ref_date', v_date::text, 'duplicate_spins', v_duplicates, 'spins', v_spins)
    )
    ON CONFLICT DO NOTHING;
    v_alerts := v_alerts + 1;
  END IF;

  -- Alerta 4: prêmios fora da calibração vigente.
  IF v_unconfigured > 0 THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'lucky_wheel_unconfigured_prizes', 'medium',
      'Roleta: prêmios pagos fora da calibração vigente',
      format('%s giro(s) referenciam prêmios ausentes da configuração atual.', v_unconfigured),
      jsonb_build_object('ref_date', v_date::text, 'unconfigured_spins', v_unconfigured, 'spins', v_spins)
    )
    ON CONFLICT DO NOTHING;
    v_alerts := v_alerts + 1;
  END IF;

  RETURN jsonb_build_object(
    'date', v_date, 'spins', v_spins, 'chi_square', round(v_chi, 4),
    'degrees_of_freedom', v_df, 'alerts_raised', v_alerts
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.tournament_place_winner(p_tournament_id uuid, p_round integer, p_slot integer, p_winner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rounds INTEGER;
  v_next_slot INTEGER := p_slot / 2;
  v_next public.tournament_matches%ROWTYPE;
BEGIN
  SELECT rounds INTO v_rounds FROM public.tournaments WHERE id = p_tournament_id;
  IF p_round >= v_rounds THEN RETURN; END IF;

  IF p_slot % 2 = 0 THEN
    UPDATE public.tournament_matches
       SET home_participant_id = p_winner
     WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;
  ELSE
    UPDATE public.tournament_matches
       SET away_participant_id = p_winner
     WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;
  END IF;

  SELECT * INTO v_next FROM public.tournament_matches
   WHERE tournament_id = p_tournament_id AND round = p_round + 1 AND slot = v_next_slot;

  IF v_next.id IS NOT NULL AND v_next.status = 'pending' THEN
    IF v_next.home_participant_id IS NOT NULL AND v_next.away_participant_id IS NOT NULL THEN
      UPDATE public.tournament_matches SET status = 'ready' WHERE id = v_next.id;
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key text, p_api_secret text)
 RETURNS TABLE(id uuid, name text, system_type text, permissions jsonb, rate_limit_per_minute integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_row public.external_api_keys%ROWTYPE;
BEGIN
  IF p_api_key IS NULL OR p_api_secret IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row
  FROM public.external_api_keys eak
  WHERE eak.api_key = p_api_key AND eak.is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF encode(extensions.digest(v_row.secret_salt || p_api_secret, 'sha256'), 'hex') <> v_row.secret_hash THEN
    RETURN;
  END IF;

  UPDATE public.external_api_keys
  SET last_used_at = now()
  WHERE external_api_keys.id = v_row.id;

  RETURN QUERY
  SELECT v_row.id, v_row.name, v_row.system_type, v_row.permissions, v_row.rate_limit_per_minute;
END;
$function$;
