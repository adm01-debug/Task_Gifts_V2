CREATE OR REPLACE FUNCTION public.complete_external_task(p_external_system text, p_external_id text, p_status text DEFAULT 'on_time'::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task external_tasks%ROWTYPE;
  v_xp_earned INTEGER := 0;
  v_coins_earned INTEGER := 0;
  v_xp_penalty INTEGER := 0;
  v_is_late BOOLEAN := false;
BEGIN
  -- Get external task
  SELECT * INTO v_task 
  FROM external_tasks 
  WHERE external_system = p_external_system AND external_id = p_external_id;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  IF v_task.user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not linked to user');
  END IF;
  
  -- Check if late
  IF v_task.deadline_at IS NOT NULL AND now() > v_task.deadline_at THEN
    v_is_late := true;
  END IF;
  
  -- Calculate rewards based on status
  CASE p_status
    WHEN 'on_time' THEN
      v_xp_earned := v_task.xp_reward;
      v_coins_earned := v_task.coin_reward;
    WHEN 'late' THEN
      v_xp_earned := GREATEST(0, v_task.xp_reward - v_task.xp_penalty_late);
      v_coins_earned := v_task.coin_reward / 2;
      v_xp_penalty := v_task.xp_penalty_late;
    WHEN 'rework' THEN
      v_xp_penalty := v_task.xp_penalty_rework;
    WHEN 'rejected' THEN
      v_xp_penalty := v_task.xp_reward;
    ELSE
      v_xp_earned := v_task.xp_reward;
      v_coins_earned := v_task.coin_reward;
  END CASE;
  
  -- Update external task
  UPDATE external_tasks
  SET 
    status = p_status,
    completed_at = now(),
    metadata = v_task.metadata || p_metadata
  WHERE id = v_task.id;
  
  -- Update user profile
  UPDATE profiles
  SET 
    xp = GREATEST(0, xp + v_xp_earned - v_xp_penalty),
    coins = coins + v_coins_earned,
    quests_completed = quests_completed + CASE WHEN p_status IN ('on_time', 'late') THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = v_task.user_id;
  
  -- Record penalty if applicable
  IF v_xp_penalty > 0 THEN
    INSERT INTO task_penalties (user_id, penalty_type, xp_deducted, reason)
    VALUES (
      v_task.user_id, 
      p_status, 
      v_xp_penalty,
      'Tarefa externa: ' || v_task.title || ' - ' || 
      CASE 
        WHEN p_status = 'late' THEN 'Entregue com atraso'
        WHEN p_status = 'rework' THEN 'Devolvida para retrabalho'
        WHEN p_status = 'rejected' THEN 'Rejeitada'
        ELSE 'Penalidade aplicada'
      END
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_task.user_id,
    'xp_earned', v_xp_earned,
    'coins_earned', v_coins_earned,
    'xp_penalty', v_xp_penalty,
    'is_late', v_is_late
  );
END;
$function$
