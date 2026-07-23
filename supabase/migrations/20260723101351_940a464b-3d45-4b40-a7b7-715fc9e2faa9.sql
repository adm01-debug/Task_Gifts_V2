
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated, service_role;
