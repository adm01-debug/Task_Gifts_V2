CREATE OR REPLACE FUNCTION public.acknowledge_security_digest(p_week_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.has_role(_uid, 'admin'::app_role)
     AND NOT public.has_role(_uid, 'manager'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.notifications
     SET data = jsonb_set(
           data,
           '{acknowledgments}',
           COALESCE(data->'acknowledgments', '[]'::jsonb)
             || jsonb_build_object('user_id', _uid, 'at', now())
         )
   WHERE type = 'security_weekly_digest'
     AND data->>'week_key' = p_week_key
     AND NOT (
       COALESCE(data->'acknowledgments', '[]'::jsonb) @> jsonb_build_array(jsonb_build_object('user_id', _uid))
     );
END;
$function$
