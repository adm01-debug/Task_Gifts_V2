CREATE OR REPLACE FUNCTION public.increment_quests_completed(p_user_id uuid)
 RETURNS TABLE(id uuid, quests_completed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles AS pr
     SET quests_completed = pr.quests_completed + 1
   WHERE pr.id = p_user_id AND auth.uid() = p_user_id
   RETURNING pr.quests_completed INTO v_count;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN QUERY SELECT p_user_id, v_count;
END;
$function$
