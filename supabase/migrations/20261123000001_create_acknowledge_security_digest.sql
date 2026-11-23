-- Migration: cria acknowledge_security_digest RPC
CREATE OR REPLACE FUNCTION public.acknowledge_security_digest(p_week_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_notif_id uuid;
  v_user_id  uuid := auth.uid();
  v_acks     jsonb;
  v_new_ack  jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id, COALESCE(data->'acknowledgments', '[]'::jsonb)
    INTO v_notif_id, v_acks
  FROM public.notifications
  WHERE type = 'security_weekly_digest'
    AND data->>'week_key' = p_week_key
  ORDER BY created_at DESC LIMIT 1;
  IF v_notif_id IS NULL THEN RAISE EXCEPTION 'digest not found: %', p_week_key; END IF;
  IF NOT (v_acks @> jsonb_build_array(jsonb_build_object('user_id', v_user_id))) THEN
    v_new_ack := jsonb_build_object('user_id', v_user_id, 'acknowledged_at', now());
    UPDATE public.notifications
    SET data = jsonb_set(data, '{acknowledgments}', v_acks || jsonb_build_array(v_new_ack))
    WHERE id = v_notif_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.acknowledge_security_digest(text) TO authenticated;