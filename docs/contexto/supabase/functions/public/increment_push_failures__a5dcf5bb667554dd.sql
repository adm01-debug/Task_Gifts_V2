CREATE OR REPLACE FUNCTION public.increment_push_failures(_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.push_subscriptions
     SET failure_count = COALESCE(failure_count, 0) + 1,
         updated_at    = now(),
         disabled_at   = CASE
                           WHEN COALESCE(failure_count, 0) + 1 >= 5 THEN now()
                           ELSE disabled_at
                         END,
         disabled_reason = CASE
                             WHEN COALESCE(failure_count, 0) + 1 >= 5
                                  AND disabled_reason IS NULL
                               THEN 'auto_disabled_after_5_failures'
                             ELSE disabled_reason
                           END
   WHERE id = ANY(_ids);
END;
$function$
