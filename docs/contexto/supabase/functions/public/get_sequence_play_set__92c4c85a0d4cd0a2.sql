CREATE OR REPLACE FUNCTION public.get_sequence_play_set(p_procedure_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user uuid := auth.uid(); v_proc record; v_steps jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated'); END IF;
  SELECT id, title, description, department_id, is_active INTO v_proc FROM public.sequence_procedures WHERE id = p_procedure_id AND is_active;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'label', s.label, 'hint', s.hint) ORDER BY md5(s.id::text || v_user::text)), '[]'::jsonb) INTO v_steps FROM public.sequence_steps s WHERE s.procedure_id = p_procedure_id;
  RETURN jsonb_build_object('success', true, 'id', v_proc.id, 'title', v_proc.title, 'description', v_proc.description, 'department_id', v_proc.department_id, 'is_active', v_proc.is_active, 'steps', v_steps);
END; $function$
