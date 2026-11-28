CREATE OR REPLACE FUNCTION public.get_user_stats_api(p_user_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user profiles%ROWTYPE;
  v_user_id uuid;
  v_rank INTEGER;
  v_department TEXT;
  v_position TEXT;
  v_bypass BOOLEAN;
BEGIN
  PERFORM public._require_manager_or_admin();
  v_bypass := public.has_role(auth.uid(), 'admin')
              OR coalesce(current_setting('request.jwt.claim.role', true) = 'service_role', false);

  SELECT id INTO v_user_id FROM profiles WHERE email = p_user_email;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- fora do escopo do gestor responde igual a "nao existe": nao vira oraculo
  -- de quais e-mails tem conta nem revela departamento de outra equipe
  IF NOT v_bypass
     AND v_user_id <> auth.uid()
     AND NOT EXISTS (
       SELECT 1
       FROM team_members tm_gestor
       JOIN team_members tm_alvo ON tm_alvo.department_id = tm_gestor.department_id
       WHERE tm_gestor.user_id = auth.uid()
         AND tm_gestor.is_manager
         AND tm_alvo.user_id = v_user_id
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT * INTO v_user FROM profiles WHERE id = v_user_id;
  SELECT COUNT(*) + 1 INTO v_rank FROM profiles WHERE xp > v_user.xp;
  SELECT d.name INTO v_department
  FROM team_members tm
  JOIN departments d ON d.id = tm.department_id
  WHERE tm.user_id = v_user.id
  LIMIT 1;
  SELECT p.name INTO v_position
  FROM user_positions up
  JOIN positions p ON p.id = up.position_id
  WHERE up.user_id = v_user.id AND up.is_primary = true
  LIMIT 1;
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'level', v_user.level,
      'xp', v_user.xp,
      'coins', v_user.coins,
      'streak', v_user.streak,
      'best_streak', v_user.best_streak,
      'quests_completed', v_user.quests_completed,
      'rank', v_rank,
      'department', v_department,
      'position', v_position
    )
  );
END;
$function$
