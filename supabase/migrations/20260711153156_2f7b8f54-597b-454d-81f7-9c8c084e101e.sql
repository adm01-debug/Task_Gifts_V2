
GRANT EXECUTE ON FUNCTION public.get_passkeys_by_email(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_passkeys(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_engagement_snapshot(uuid, text) TO authenticated;
