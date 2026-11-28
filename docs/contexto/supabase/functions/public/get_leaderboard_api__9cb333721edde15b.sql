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
$function$
