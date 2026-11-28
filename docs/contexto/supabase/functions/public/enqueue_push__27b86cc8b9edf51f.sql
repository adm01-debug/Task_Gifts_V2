CREATE OR REPLACE FUNCTION public.enqueue_push(p_user_id uuid, p_type text, p_title text, p_message text, p_dedupe_key text, p_url text DEFAULT NULL::text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_inserted UUID;
BEGIN
  IF p_user_id IS NULL OR coalesce(trim(p_dedupe_key), '') = '' THEN RETURN false; END IF;
  IF NOT public.user_wants_push_notification(p_user_id, p_type) THEN RETURN false; END IF;
  INSERT INTO public.push_outbox (user_id, type, title, message, url, data, dedupe_key)
  VALUES (p_user_id, p_type, left(p_title, 120), left(p_message, 400), p_url, coalesce(p_data, '{}'::jsonb), p_dedupe_key)
  ON CONFLICT (dedupe_key) DO NOTHING RETURNING id INTO v_inserted;
  RETURN v_inserted IS NOT NULL;
END;
$function$
