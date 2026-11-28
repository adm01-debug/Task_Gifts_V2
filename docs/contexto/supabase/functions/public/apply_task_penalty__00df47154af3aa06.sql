CREATE OR REPLACE FUNCTION public.apply_task_penalty(p_user_id uuid, p_task_score_id uuid, p_penalty_type text, p_xp_deducted integer, p_coins_deducted integer DEFAULT 0, p_reason text DEFAULT NULL::text, p_applied_by uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_penalty_id UUID;
BEGIN
  -- Inserir registro de penalidade
  INSERT INTO task_penalties (user_id, task_score_id, penalty_type, xp_deducted, coins_deducted, reason, applied_by)
  VALUES (p_user_id, p_task_score_id, p_penalty_type, p_xp_deducted, p_coins_deducted, p_reason, p_applied_by)
  RETURNING id INTO v_penalty_id;
  
  -- Deduzir do perfil (não deixar ficar negativo)
  UPDATE profiles
  SET 
    xp = GREATEST(0, xp - p_xp_deducted),
    coins = GREATEST(0, coins - p_coins_deducted),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Atualizar task_score
  UPDATE task_scores
  SET xp_penalty = xp_penalty + p_xp_deducted
  WHERE id = p_task_score_id;
  
  RETURN v_penalty_id;
END;
$function$
