-- Devin SEC 0001 (PR #158). As duas RPCs de relatorio sao SECURITY DEFINER e
-- consultam public.team_members direto, sem passar pela policy de leitura de
-- equipes ("Managers can view team members" so libera o proprio departamento).
-- Como o guard _require_manager_or_admin aceita qualquer conta com papel
-- 'manager', um gestor conseguia:
--   * get_leaderboard_api(p_department_id => <departamento alheio>) e ver quem
--     esta vinculado a departamentos que nao gerencia;
--   * get_user_stats_api(<email de qualquer pessoa>) e descobrir departamento e
--     cargo de quem nao gerencia.
-- Nenhum consumidor no app (src/ nao chama as duas). O comportamento passa a
-- respeitar o escopo do gestor; admin e service_role ficam como estavam.

CREATE OR REPLACE FUNCTION public.get_leaderboard_api(p_limit integer DEFAULT 10, p_department_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_bypass BOOLEAN;
BEGIN
  PERFORM public._require_manager_or_admin();
  v_bypass := public.has_role(auth.uid(), 'admin')
              OR coalesce(current_setting('request.jwt.claim.role', true) = 'service_role', false);

  -- filtro por departamento: so admin pode escolher qualquer um
  IF p_department_id IS NOT NULL AND NOT v_bypass THEN
    IF NOT EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.is_manager
        AND tm.department_id = p_department_id
    ) THEN
      RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'leaderboard', COALESCE(jsonb_agg(row_data ORDER BY rn), '[]'::jsonb)
  ) INTO v_result
  FROM (
    SELECT 
      jsonb_build_object(
        'rank', ROW_NUMBER() OVER (ORDER BY p.xp DESC),
        'user_id', p.id,
        'display_name', p.display_name,
        'email', p.email,
        'level', p.level,
        'xp', p.xp,
        'coins', p.coins,
        'streak', p.streak,
        'quests_completed', p.quests_completed
      ) as row_data,
      ROW_NUMBER() OVER (ORDER BY p.xp DESC) as rn
    FROM profiles p
    LEFT JOIN team_members tm ON tm.user_id = p.id
    WHERE p_department_id IS NULL OR tm.department_id = p_department_id
    ORDER BY p.xp DESC
    LIMIT p_limit
  ) ranked;
  RETURN v_result;
END;
$function$;

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
$function$;