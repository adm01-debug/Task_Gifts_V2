CREATE INDEX IF NOT EXISTS idx_war_contrib_feed
  ON public.department_war_contributions (war_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_department_war_feed(
  p_war_id uuid,
  p_limit integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_war public.department_wars%ROWTYPE;
  v_limit integer;
  v_items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated', 'items', '[]'::jsonb);
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);

  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found', 'items', '[]'::jsonb);
  END IF;
  IF v_war.status = 'draft' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found', 'items', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(item ORDER BY item->>'created_at' DESC), '[]'::jsonb)
    INTO v_items
  FROM (
    SELECT jsonb_build_object(
             'id', c.id,
             'created_at', c.created_at,
             'metric_key', c.metric_key,
             'metric_label', COALESCE(m.label, c.metric_key),
             'amount', ROUND(c.amount, 2),
             'points', ROUND(c.amount * COALESCE(m.weight, 0), 2),
             'department_id', c.department_id,
             'department_name', COALESCE(dep.name, 'Departamento'),
             'actor', CASE
               WHEN p.full_name IS NULL OR btrim(p.full_name) = '' THEN 'Colaborador'
               WHEN position(' ' IN btrim(p.full_name)) = 0 THEN btrim(p.full_name)
               ELSE split_part(btrim(p.full_name), ' ', 1) || ' ' ||
                    upper(left(split_part(btrim(p.full_name), ' ',
                      array_length(string_to_array(btrim(p.full_name), ' '), 1)), 1)) || '.'
             END,
             'is_me', c.user_id = auth.uid()
           ) AS item
      FROM public.department_war_contributions c
      LEFT JOIN public.department_war_metrics m
        ON m.war_id = c.war_id AND m.metric_key = c.metric_key
      LEFT JOIN public.departments dep ON dep.id = c.department_id
      LEFT JOIN public.profiles p ON p.id = c.user_id
     WHERE c.war_id = p_war_id
     ORDER BY c.created_at DESC
     LIMIT v_limit
  ) s;

  RETURN jsonb_build_object('success', true, 'items', v_items);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_department_war_feed(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_department_war_feed(uuid, integer) TO authenticated;