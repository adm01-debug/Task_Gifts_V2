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
$function$
