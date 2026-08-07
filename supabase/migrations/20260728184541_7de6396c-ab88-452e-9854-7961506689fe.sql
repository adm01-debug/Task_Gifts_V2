DROP FUNCTION IF EXISTS public.get_passkeys_by_email(text);

CREATE FUNCTION public.get_passkeys_by_email(p_email text)
RETURNS TABLE(credential_id text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT wc.credential_id
  FROM public.webauthn_credentials wc
  JOIN public.profiles p ON p.id = wc.user_id
  WHERE lower(trim(p.email)) = lower(trim(p_email))
    AND wc.is_active = true
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.get_passkeys_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_passkeys_by_email(text) TO anon, authenticated;