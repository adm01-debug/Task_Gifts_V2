-- 1) Apoios ("também penso assim")
CREATE TABLE IF NOT EXISTS public.opinion_supports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.opinions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (opinion_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.opinion_supports TO authenticated;
GRANT ALL ON public.opinion_supports TO service_role;

ALTER TABLE public.opinion_supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own opinion supports"
ON public.opinion_supports FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_opinion_supports_opinion ON public.opinion_supports(opinion_id);

-- 2) Helper SECURITY DEFINER: quem pode tratar uma manifestação
CREATE OR REPLACE FUNCTION public.can_handle_opinion(_opinion_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.opinions o
    WHERE o.id = _opinion_id
      AND (
        o.recipient_id = _user_id
        OR (o.recipient_type = 'hr' AND public.has_role(_user_id, 'admin'::app_role))
        OR (o.recipient_type = 'manager' AND public.has_role(_user_id, 'manager'::app_role))
        OR public.has_role(_user_id, 'admin'::app_role)
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_handle_opinion(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_handle_opinion(UUID, UUID) TO authenticated, service_role;

-- 3) Anonimato: leitura direta da tabela fica restrita ao próprio autor.
--    RH/gestores passam a ler pelo RPC, que suprime sender_id de anônimos.
DROP POLICY IF EXISTS "View opinions" ON public.opinions;

CREATE POLICY "Authors read their own opinions"
ON public.opinions FOR SELECT TO authenticated
USING (sender_id = auth.uid());

-- Respostas: usa helper definer para não depender do RLS de opinions
DROP POLICY IF EXISTS "View opinion responses" ON public.opinion_responses;
CREATE POLICY "View opinion responses"
ON public.opinion_responses FOR SELECT TO authenticated
USING (
  NOT is_internal AND EXISTS (
    SELECT 1 FROM public.opinions o WHERE o.id = opinion_id AND o.sender_id = auth.uid()
  )
  OR public.can_handle_opinion(opinion_id, auth.uid())
);

DROP POLICY IF EXISTS "Responders can create responses" ON public.opinion_responses;
CREATE POLICY "Responders can create responses"
ON public.opinion_responses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = responder_id AND public.can_handle_opinion(opinion_id, auth.uid()));

DROP POLICY IF EXISTS "Manage opinion tags" ON public.opinion_tags;
CREATE POLICY "Manage opinion tags"
ON public.opinion_tags FOR ALL TO authenticated
USING (public.can_handle_opinion(opinion_id, auth.uid()))
WITH CHECK (public.can_handle_opinion(opinion_id, auth.uid()));

-- 4) updated_at automático
DROP TRIGGER IF EXISTS update_opinions_updated_at ON public.opinions;
CREATE TRIGGER update_opinions_updated_at
BEFORE UPDATE ON public.opinions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_opinions_status_created ON public.opinions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opinions_sender ON public.opinions(sender_id, created_at DESC);

-- 5) Feed anonimizado
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
    -- Guarda de anonimato no servidor: identidade nunca sai para anônimos.
    CASE WHEN o.is_anonymous THEN NULL ELSE o.sender_id END,
    CASE WHEN o.is_anonymous THEN NULL ELSE p.full_name END,
    o.is_anonymous,
    o.subject,
    o.content,
    o.category::TEXT,
    o.urgency::TEXT,
    o.status::TEXT,
    o.recipient_type,
    CASE WHEN o.is_anonymous THEN NULL ELSE d.name END,
    COALESCE(s.cnt, 0)::INT,
    COALESCE(r.cnt, 0)::INT,
    EXISTS (SELECT 1 FROM public.opinion_supports x WHERE x.opinion_id = o.id AND x.user_id = v_uid),
    public.can_handle_opinion(o.id, v_uid),
    o.created_at,
    o.updated_at
  FROM public.opinions o
  LEFT JOIN public.profiles p ON p.id = o.sender_id AND NOT o.is_anonymous
  LEFT JOIN public.departments d ON d.id = p.department_id AND NOT o.is_anonymous
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

-- 6) Apoio (idempotente / alternável)
CREATE OR REPLACE FUNCTION public.toggle_opinion_support(p_opinion_id UUID)
RETURNS TABLE (supported BOOLEAN, support_count INT)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.opinions o WHERE o.id = p_opinion_id) THEN
    RAISE EXCEPTION 'Manifestacao inexistente';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.opinion_supports x WHERE x.opinion_id = p_opinion_id AND x.user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.opinion_supports x WHERE x.opinion_id = p_opinion_id AND x.user_id = v_uid;
  ELSE
    INSERT INTO public.opinion_supports (opinion_id, user_id)
    VALUES (p_opinion_id, v_uid)
    ON CONFLICT (opinion_id, user_id) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT NOT v_exists, (SELECT COUNT(*)::INT FROM public.opinion_supports x WHERE x.opinion_id = p_opinion_id);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_opinion_support(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_opinion_support(UUID) TO authenticated;

-- 7) Resposta oficial + mudança de situação em uma operação atômica
CREATE OR REPLACE FUNCTION public.respond_to_opinion(
  p_opinion_id UUID,
  p_content TEXT,
  p_is_internal BOOLEAN DEFAULT FALSE,
  p_status TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_content TEXT := btrim(COALESCE(p_content, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado';
  END IF;
  IF NOT public.can_handle_opinion(p_opinion_id, v_uid) THEN
    RAISE EXCEPTION 'Sem permissao para tratar esta manifestacao';
  END IF;
  IF length(v_content) < 5 THEN
    RAISE EXCEPTION 'Resposta muito curta';
  END IF;
  IF length(v_content) > 4000 THEN
    v_content := left(v_content, 4000);
  END IF;

  INSERT INTO public.opinion_responses (opinion_id, responder_id, content, is_internal)
  VALUES (p_opinion_id, v_uid, v_content, COALESCE(p_is_internal, FALSE))
  RETURNING id INTO v_id;

  UPDATE public.opinions o
  SET status = COALESCE(NULLIF(p_status, '')::opinion_status, 'in_progress'::opinion_status),
      read_at = COALESCE(o.read_at, now()),
      read_by = COALESCE(o.read_by, v_uid)
  WHERE o.id = p_opinion_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_opinion(UUID, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_opinion(UUID, TEXT, BOOLEAN, TEXT) TO authenticated;

-- 8) Mudança de situação isolada
CREATE OR REPLACE FUNCTION public.set_opinion_status(p_opinion_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.can_handle_opinion(p_opinion_id, v_uid) THEN
    RAISE EXCEPTION 'Sem permissao para tratar esta manifestacao';
  END IF;
  UPDATE public.opinions o
  SET status = p_status::opinion_status,
      read_at = COALESCE(o.read_at, now()),
      read_by = COALESCE(o.read_by, v_uid)
  WHERE o.id = p_opinion_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_opinion_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_opinion_status(UUID, TEXT) TO authenticated;