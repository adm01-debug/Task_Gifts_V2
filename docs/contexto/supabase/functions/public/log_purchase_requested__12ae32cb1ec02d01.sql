CREATE OR REPLACE FUNCTION public.log_purchase_requested()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.purchase_approvals (purchase_id, actor_id, action, from_status, to_status, reason)
  VALUES (NEW.id, NEW.user_id, 'requested', NULL, NEW.status, 'Resgate solicitado pelo colaborador (' || NEW.total_coins || ' moedas).');
  RETURN NEW;
END;
$function$
