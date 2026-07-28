-- 1. complete_task_score: autoperclusão limitada; aprovação/rejeição só gestor/admin
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

-- 2. auto_unblock_board_players: admin-only quando chamada por usuário
CREATE OR REPLACE FUNCTION public.auto_unblock_board_players(p_max_hours integer DEFAULT 48)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    PERFORM public._require_admin();
  END IF;
  SELECT count(*)::integer INTO v_count
    FROM public.unblock_board_players(p_max_hours, NULL);
  RETURN COALESCE(v_count, 0);
END;
$function$;

-- 3. register_device: usuário autenticado só registra para si
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

-- 4. reset_login_attempts: só o próprio e-mail (ou admin)
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

-- 5. request_password_reset: só para a própria conta (ou admin)
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

-- 6. Guardas leves em rotinas administrativas de campanha / chefão / eNPS
CREATE OR REPLACE FUNCTION public._guard_manager_or_admin_if_user()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    PERFORM public._require_manager_or_admin();
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public._guard_manager_or_admin_if_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._guard_manager_or_admin_if_user() TO authenticated, service_role;
