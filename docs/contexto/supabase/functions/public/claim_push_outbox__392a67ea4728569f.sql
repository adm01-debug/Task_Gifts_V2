CREATE OR REPLACE FUNCTION public.claim_push_outbox(p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, user_id uuid, type text, title text, message text, url text, data jsonb, attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reciclagem: linhas presas em 'processing' voltam para a fila.
  UPDATE public.push_outbox
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < now() - interval '10 minutes';

  -- Janela de silencio: o prazo da linha ja adiada segue a preferencia ATUAL do
  -- usuario, entao desligar a janela (ou antecipar o fim) solta o aviso na hora,
  -- em vez de deixar o aviso preso ao prazo antigo.
  UPDATE public.push_outbox o
  SET deferred_until = atual.novo
  FROM (
    SELECT x.id,
           x.deferred_until,
           public.push_quiet_hours_until(x.user_id) AS novo
    FROM public.push_outbox x
    WHERE x.status = 'deferred'
  ) atual
  WHERE o.id = atual.id
    AND o.status = 'deferred'
    AND atual.novo IS NOT NULL
    AND atual.novo IS DISTINCT FROM atual.deferred_until;

  -- Quem venceu volta para a fila (nao consome tentativa). `deferred_until` nulo
  -- tambem volta: linha adiada sem prazo ficaria presa.
  UPDATE public.push_outbox o
  SET status = 'pending',
      deferred_until = NULL
  FROM (
    SELECT x.id, public.push_quiet_hours_until(x.user_id) AS novo
    FROM public.push_outbox x
    WHERE x.status = 'deferred'
  ) atual
  WHERE o.id = atual.id
    AND o.status = 'deferred'
    AND (o.deferred_until IS NULL OR o.deferred_until <= now() OR atual.novo IS NULL);

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
$function$
