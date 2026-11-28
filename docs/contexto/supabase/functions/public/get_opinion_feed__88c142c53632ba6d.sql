CREATE OR REPLACE FUNCTION public.get_opinion_feed(p_scope text DEFAULT 'mine'::text, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, sender_id uuid, sender_name text, is_anonymous boolean, subject text, content text, category text, urgency text, status text, recipient_type text, department_name text, support_count integer, response_count integer, viewer_supported boolean, can_handle boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_is_handler BOOLEAN;
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  v_is_handler := public.has_role(v_uid, 'admin'::app_role) OR public.has_role(v_uid, 'manager'::app_role);

  RETURN QUERY
  SELECT
    o.id,
    CASE WHEN o.is_anonymous THEN NULL ELSE o.sender_id END,
    CASE WHEN o.is_anonymous THEN NULL ELSE p.display_name END,
    o.is_anonymous,
    o.subject,
    o.content,
    o.category::TEXT,
    o.urgency::TEXT,
    o.status::TEXT,
    o.recipient_type,
    -- profiles nao tem department_id; retorna NULL ate existir a coluna
    CASE WHEN o.is_anonymous THEN NULL ELSE NULL END,
    COALESCE(s.cnt, 0)::INT,
    COALESCE(r.cnt, 0)::INT,
    EXISTS (SELECT 1 FROM public.opinion_supports x WHERE x.opinion_id = o.id AND x.user_id = v_uid),
    public.can_handle_opinion(o.id, v_uid),
    o.created_at,
    o.updated_at
  FROM public.opinions o
  LEFT JOIN public.profiles p ON p.id = o.sender_id AND NOT o.is_anonymous
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS cnt FROM public.opinion_supports x WHERE x.opinion_id = o.id
  ) s ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS cnt FROM public.opinion_responses y
    WHERE y.opinion_id = o.id AND NOT y.is_internal
  ) r ON TRUE
  WHERE
    CASE
      WHEN p_scope = 'mine' THEN o.sender_id = v_uid
      WHEN p_scope = 'queue' THEN v_is_handler AND public.can_handle_opinion(o.id, v_uid)
      ELSE FALSE
    END
    AND (p_status IS NULL OR o.status::TEXT = p_status)
  ORDER BY o.created_at DESC
  LIMIT v_limit;
END;
$function$
