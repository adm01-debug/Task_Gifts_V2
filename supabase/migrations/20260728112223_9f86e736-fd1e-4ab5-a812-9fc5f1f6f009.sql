CREATE OR REPLACE FUNCTION public.claim_push_outbox(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  url TEXT,
  data JSONB,
  attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reciclagem: linhas presas em 'processing' voltam para a fila.
  UPDATE public.push_outbox
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < now() - interval '10 minutes';

  RETURN QUERY
  WITH claimed AS (
    SELECT o.id
    FROM public.push_outbox o
    WHERE o.status = 'pending'
    ORDER BY o.created_at
    LIMIT greatest(1, least(coalesce(p_limit, 100), 500))
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.push_outbox o
  SET status = 'processing'
  FROM claimed c
  WHERE o.id = c.id
  RETURNING o.id, o.user_id, o.type, o.title, o.message, o.url, o.data, o.attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_push_outbox(integer) TO service_role;