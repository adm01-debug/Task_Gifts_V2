CREATE OR REPLACE FUNCTION public.log_purchase_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.purchase_approvals (purchase_id, actor_id, action, from_status, to_status, reason)
  VALUES (NEW.id, NEW.user_id, 'requested', NULL, NEW.status,
          'Resgate solicitado pelo colaborador (' || NEW.total_coins || ' moedas).');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_purchase_requested ON public.shop_purchases;
CREATE TRIGGER trg_log_purchase_requested
AFTER INSERT ON public.shop_purchases
FOR EACH ROW EXECUTE FUNCTION public.log_purchase_requested();