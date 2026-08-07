-- ============================================================
-- CANAL DE OPINIOES: corrige referencias a colunas inexistentes em profiles
-- profiles.full_name -> profiles.display_name
-- profiles.department_id nao existe -> remove JOIN com departments
-- Cole este arquivo no SQL Editor do Supabase.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_opinion_feed(TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION public.get_opinion_feed(
  p_scope TEXT DEFAULT 'mine',
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  sender_name TEXT,
  is_anonymous BOOLEAN,
  subject TEXT,
  content TEXT,
  category TEXT,
  urgency TEXT,
  status TEXT,
  recipient_type TEXT,
  department_name TEXT,
  support_count INT,
  response_count INT,
  viewer_supported BOOLEAN,
  can_handle BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_opinion_feed(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_opinion_feed(TEXT, TEXT, INT) TO authenticated;