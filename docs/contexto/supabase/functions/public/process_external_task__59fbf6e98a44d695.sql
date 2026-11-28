CREATE OR REPLACE FUNCTION public.process_external_task(p_external_task_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task external_tasks%ROWTYPE;
  v_user_id UUID;
  v_task_score_id UUID;
BEGIN
  -- Get external task
  SELECT * INTO v_task FROM external_tasks WHERE id = p_external_task_id;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  -- Find user by email
  SELECT id INTO v_user_id FROM profiles WHERE email = v_task.user_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found with email: ' || v_task.user_email);
  END IF;
  
  -- Update external task with user_id
  UPDATE external_tasks SET user_id = v_user_id WHERE id = p_external_task_id;
  
  -- Create task_score
  INSERT INTO task_scores (
    user_id,
    title,
    description,
    source,
    deadline_at,
    status
  ) VALUES (
    v_user_id,
    v_task.title,
    v_task.description,
    v_task.external_system,
    v_task.deadline_at,
    'pending'
  )
  RETURNING id INTO v_task_score_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'task_score_id', v_task_score_id,
    'user_id', v_user_id
  );
END;
$function$
