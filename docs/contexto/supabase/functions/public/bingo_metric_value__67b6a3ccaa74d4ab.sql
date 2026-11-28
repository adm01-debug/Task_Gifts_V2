CREATE OR REPLACE FUNCTION public.bingo_metric_value(p_user uuid, p_key text, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v INTEGER := 0;
BEGIN
  IF p_user IS NULL OR p_key IS NULL THEN RETURN 0; END IF;

  CASE p_key
    WHEN 'tasks_completed' THEN
      SELECT count(*) INTO v FROM task_scores
       WHERE user_id = p_user AND status = 'completed'
         AND completed_at BETWEEN p_from AND p_to;
    WHEN 'tasks_on_time' THEN
      SELECT count(*) INTO v FROM task_scores
       WHERE user_id = p_user AND status = 'completed' AND COALESCE(is_late,false) = false
         AND completed_at BETWEEN p_from AND p_to;
    WHEN 'tasks_no_rework' THEN
      SELECT count(*) INTO v FROM task_scores
       WHERE user_id = p_user AND status = 'completed' AND COALESCE(rework_count,0) = 0
         AND completed_at BETWEEN p_from AND p_to;
    WHEN 'attendance_days' THEN
      SELECT count(DISTINCT date(check_in)) INTO v FROM attendance_records
       WHERE user_id = p_user AND check_in BETWEEN p_from AND p_to;
    WHEN 'attendance_punctual' THEN
      SELECT count(DISTINCT date(check_in)) INTO v FROM attendance_records
       WHERE user_id = p_user AND COALESCE(is_punctual,false) = true
         AND check_in BETWEEN p_from AND p_to;
    WHEN 'kudos_sent' THEN
      SELECT count(*) INTO v FROM kudos
       WHERE from_user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'kudos_received' THEN
      SELECT count(*) INTO v FROM kudos
       WHERE to_user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'quiz_played' THEN
      SELECT count(*) INTO v FROM quiz_scores
       WHERE user_id = p_user AND COALESCE(played_at, created_at) BETWEEN p_from AND p_to;
    WHEN 'wheel_spins' THEN
      SELECT count(*) INTO v FROM lucky_wheel_spins
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'scratch_revealed' THEN
      SELECT count(*) INTO v FROM scratch_cards
       WHERE user_id = p_user AND status = 'revealed'
         AND revealed_at BETWEEN p_from AND p_to;
    WHEN 'lightning_rounds' THEN
      SELECT count(*) INTO v FROM lightning_quiz_sessions
       WHERE user_id = p_user AND status = 'finished'
         AND started_at BETWEEN p_from AND p_to;
    WHEN 'lightning_correct' THEN
      SELECT COALESCE(sum(correct_count),0) INTO v FROM lightning_quiz_sessions
       WHERE user_id = p_user AND status = 'finished'
         AND started_at BETWEEN p_from AND p_to;
    WHEN 'mood_entries' THEN
      SELECT count(DISTINCT entry_date) INTO v FROM mood_entries
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'reactions_given' THEN
      SELECT count(*) INTO v FROM activity_reactions
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'comments_posted' THEN
      SELECT count(*) INTO v FROM activity_comments
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'modules_completed' THEN
      SELECT count(*) INTO v FROM module_progress
       WHERE user_id = p_user AND completed_at BETWEEN p_from AND p_to;
    WHEN 'goal_updates' THEN
      SELECT count(*) INTO v FROM goal_updates
       WHERE user_id = p_user AND created_at BETWEEN p_from AND p_to;
    WHEN 'announcements_read' THEN
      SELECT count(*) INTO v FROM announcement_reads
       WHERE user_id = p_user AND read_at BETWEEN p_from AND p_to;
    WHEN 'checkins_done' THEN
      SELECT count(*) INTO v FROM checkins
       WHERE employee_id = p_user AND status = 'completed'
         AND COALESCE(completed_at, updated_at) BETWEEN p_from AND p_to;
    WHEN 'opinions_sent' THEN
      SELECT count(*) INTO v FROM opinions
       WHERE sender_id = p_user AND created_at BETWEEN p_from AND p_to;
    ELSE
      v := 0;
  END CASE;

  RETURN COALESCE(v, 0);
END;
$function$
