CREATE OR REPLACE FUNCTION public.sync_department_war_headcount(p_war_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_updated int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RETURN jsonb_build_object('success', false, 'reason', 'forbidden'); END IF;
  WITH counts AS (SELECT pos.department_id, COUNT(DISTINCT up.user_id)::int AS total FROM public.user_positions up JOIN public.positions pos ON pos.id = up.position_id JOIN public.profiles pr ON pr.id = up.user_id AND pr.status = 'confirmed' WHERE up.ended_at IS NULL AND pos.department_id IS NOT NULL GROUP BY pos.department_id), upd AS (UPDATE public.department_war_departments d SET headcount = COALESCE(c.total, 0), updated_at = now() FROM counts c WHERE d.war_id = p_war_id AND d.department_id = c.department_id RETURNING 1) SELECT COUNT(*)::int INTO v_updated FROM upd;
  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END; $function$
