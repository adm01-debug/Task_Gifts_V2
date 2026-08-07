-- Remove stale duplicate policies
DROP POLICY IF EXISTS "Managers can view API keys" ON public.external_api_keys;
DROP POLICY IF EXISTS "Managers can view webhooks" ON public.webhook_subscriptions;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
