-- 1) Novo tipo de evento no histórico: revogação remota
ALTER TABLE public.push_sync_events
  DROP CONSTRAINT IF EXISTS push_sync_events_event_check;

ALTER TABLE public.push_sync_events
  ADD CONSTRAINT push_sync_events_event_check
  CHECK (event = ANY (ARRAY['subscribed','refreshed','renamed','disabled','revoked','failed']::text[]));

-- 2) Índice para a lista de dispositivos (ordenada por último uso)
CREATE INDEX IF NOT EXISTS push_subscriptions_user_last_used_idx
  ON public.push_subscriptions (user_id, last_used_at DESC NULLS LAST);

-- 3) Revogação atômica: desliga a inscrição e grava o evento na mesma transação.
--    SECURITY DEFINER apenas para garantir atomicidade + escrita do log;
--    o escopo continua restrito ao usuário autenticado via auth.uid().
CREATE OR REPLACE FUNCTION public.revoke_push_device(
  p_subscription_id uuid,
  p_reason text DEFAULT 'revoked_by_user'
)
RETURNS TABLE (revoked boolean, device_label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.push_subscriptions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  -- Bloqueia a linha para evitar corrida entre duas abas revogando ao mesmo tempo.
  SELECT * INTO v_row
  FROM public.push_subscriptions
  WHERE id = p_subscription_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotente: já revogado devolve sucesso sem duplicar evento.
  IF v_row.disabled_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_row.device_label;
    RETURN;
  END IF;

  UPDATE public.push_subscriptions
     SET disabled_at = now(),
         disabled_reason = COALESCE(NULLIF(btrim(p_reason), ''), 'revoked_by_user'),
         updated_at = now()
   WHERE id = v_row.id;

  INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
  VALUES (v_user, v_row.id, v_row.endpoint, v_row.device_label, 'revoked',
          'Acesso removido remotamente pelo usuário.');

  RETURN QUERY SELECT true, v_row.device_label;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_push_device(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_push_device(uuid, text) TO authenticated;