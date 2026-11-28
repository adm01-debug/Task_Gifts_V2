CREATE OR REPLACE FUNCTION public.log_auction_admin_event(p_auction_id uuid, p_action text, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN INSERT INTO public.auction_admin_events (auction_id, actor_id, action, details) VALUES (p_auction_id, auth.uid(), p_action, COALESCE(p_details, '{}'::jsonb)); END; $function$
