REVOKE ALL ON public.profiles_public FROM authenticated;
GRANT SELECT ON public.profiles_public TO authenticated;
REVOKE ALL ON public.webhook_delivery_stats_24h FROM authenticated, anon;
ALTER VIEW public.profiles_public SET (security_barrier = true);