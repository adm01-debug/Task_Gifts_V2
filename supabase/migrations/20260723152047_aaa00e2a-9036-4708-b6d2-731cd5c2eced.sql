
CREATE OR REPLACE FUNCTION public.user_wants_push_notification(_user_id uuid, _type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COALESCE(np.push_enabled, true)
          AND COALESCE((np.type_preferences -> _type ->> 'push')::boolean, true)
     FROM public.notification_preferences np
     WHERE np.user_id = _user_id LIMIT 1),
    true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_wants_email_notification(_user_id uuid, _type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COALESCE(np.email_enabled, true)
          AND COALESCE((np.type_preferences -> _type ->> 'email')::boolean, true)
     FROM public.notification_preferences np
     WHERE np.user_id = _user_id LIMIT 1),
    true
  );
$$;

REVOKE ALL ON FUNCTION public.user_wants_push_notification(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_wants_email_notification(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_wants_push_notification(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_wants_email_notification(uuid, text) TO authenticated, service_role;
