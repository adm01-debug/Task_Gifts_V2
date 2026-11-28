CREATE OR REPLACE FUNCTION public.requeue_push_outbox(p_ids uuid[] DEFAULT NULL::uuid[], p_include_stuck boolean DEFAULT true)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  WITH target AS (
    SELECT id FROM public.push_outbox
    WHERE ((p_ids IS NOT NULL AND id = ANY(p_ids) AND status IN ('failed', 'processing'))
      OR (p_ids IS NULL AND (status = 'failed' OR (p_include_stuck AND status = 'processing' AND updated_at < now() - interval '5 minutes')))) LIMIT 500 FOR UPDATE SKIP LOCKED
  ), upd AS (UPDATE public.push_outbox o SET status = 'pending', attempts = 0, last_error = NULL, processed_at = NULL, updated_at = now() FROM target WHERE o.id = target.id RETURNING o.id)
  SELECT COUNT(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$function$
