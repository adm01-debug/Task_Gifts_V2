CREATE OR REPLACE FUNCTION public.user_wants_email_notification(_user_id uuid, _type text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT COALESCE(np.email_enabled, true)
          AND COALESCE((np.type_preferences -> _type ->> 'email')::boolean, true)
     FROM public.notification_preferences np
     WHERE np.user_id = _user_id LIMIT 1),
    true
  );
$function$
