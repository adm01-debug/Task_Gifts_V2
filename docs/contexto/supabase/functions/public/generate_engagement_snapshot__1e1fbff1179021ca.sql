CREATE OR REPLACE FUNCTION public.generate_engagement_snapshot(p_department_id uuid DEFAULT NULL::uuid, p_period_type text DEFAULT 'weekly'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot_id UUID;
  v_enps NUMERIC;
  v_mood NUMERIC;
  v_participation NUMERIC;
  v_active INTEGER;
  v_total INTEGER;
  v_quests INTEGER;
  v_training NUMERIC;
  v_punctuality NUMERIC;
  v_kudos INTEGER;
BEGIN
  PERFORM public._require_admin();
  SELECT calculate_enps_score(es.id) INTO v_enps
  FROM enps_surveys es
  WHERE es.status = 'closed'
  AND (p_department_id IS NULL OR es.department_id = p_department_id)
  ORDER BY es.ends_at DESC
  LIMIT 1;
  SELECT AVG(mood_score) INTO v_mood
  FROM mood_entries me
  LEFT JOIN team_members tm ON tm.user_id = me.user_id
  WHERE me.entry_date >= CURRENT_DATE - INTERVAL '7 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  SELECT COUNT(DISTINCT ar.user_id), COUNT(DISTINCT p.id)
  INTO v_active, v_total
  FROM profiles p
  LEFT JOIN team_members tm ON tm.user_id = p.id
  LEFT JOIN attendance_records ar ON ar.user_id = p.id AND ar.check_in >= CURRENT_DATE - INTERVAL '7 days'
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  v_participation := CASE WHEN v_total > 0 THEN ROUND((v_active::NUMERIC / v_total) * 100, 2) ELSE 0 END;
  SELECT COALESCE(SUM(p.quests_completed), 0) INTO v_quests
  FROM profiles p
  LEFT JOIN team_members tm ON tm.user_id = p.id
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE te.completed_at IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) INTO v_training
  FROM trail_enrollments te
  LEFT JOIN team_members tm ON tm.user_id = te.user_id
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE ar.is_punctual = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) INTO v_punctuality
  FROM attendance_records ar
  LEFT JOIN team_members tm ON tm.user_id = ar.user_id
  WHERE ar.check_in >= CURRENT_DATE - INTERVAL '30 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  SELECT COUNT(*) INTO v_kudos
  FROM kudos k
  LEFT JOIN team_members tm ON tm.user_id = k.to_user_id
  WHERE k.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  INSERT INTO engagement_snapshots (
    department_id, period_type, enps_score, mood_avg, participation_rate,
    active_users, total_users, quests_completed, training_completion_rate,
    punctuality_rate, kudos_given
  ) VALUES (
    p_department_id, p_period_type, v_enps, v_mood, v_participation,
    v_active, v_total, v_quests, v_training, v_punctuality, v_kudos
  )
  RETURNING id INTO v_snapshot_id;
  RETURN v_snapshot_id;
END;
$function$
