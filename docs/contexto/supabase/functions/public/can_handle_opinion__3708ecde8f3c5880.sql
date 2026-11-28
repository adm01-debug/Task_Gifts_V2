CREATE OR REPLACE FUNCTION public.can_handle_opinion(_opinion_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.opinions o WHERE o.id = _opinion_id AND (o.recipient_id = _user_id OR (o.recipient_type = 'hr' AND public.has_role(_user_id, 'admin'::app_role)) OR (o.recipient_type = 'manager' AND public.has_role(_user_id, 'manager'::app_role)) OR public.has_role(_user_id, 'admin'::app_role)))
$function$
