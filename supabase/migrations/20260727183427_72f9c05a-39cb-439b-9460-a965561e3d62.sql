ALTER TABLE public.shop_purchases
  ADD COLUMN IF NOT EXISTS risk_score integer,
  ADD COLUMN IF NOT EXISTS risk_level text CHECK (risk_level IN ('low','medium','high','critical')),
  ADD COLUMN IF NOT EXISTS risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS risk_analyzed_at timestamptz,
  ADD COLUMN IF NOT EXISTS requires_dual_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_approver_id uuid;

CREATE TABLE IF NOT EXISTS public.purchase_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.shop_purchases(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL CHECK (action IN ('requested','ai_review','approve','first_approval','reject','deliver','cancel','reopen')),
  from_status public.purchase_status,
  to_status public.purchase_status,
  reason text,
  risk_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_approvals_purchase ON public.purchase_approvals(purchase_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_status_risk ON public.shop_purchases(status, risk_score DESC);

GRANT SELECT ON public.purchase_approvals TO authenticated;
GRANT ALL ON public.purchase_approvals TO service_role;

ALTER TABLE public.purchase_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all approval trail" ON public.purchase_approvals;
CREATE POLICY "Staff can view all approval trail"
ON public.purchase_approvals FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Users can view own approval trail" ON public.purchase_approvals;
CREATE POLICY "Users can view own approval trail"
ON public.purchase_approvals FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.shop_purchases sp
  WHERE sp.id = purchase_approvals.purchase_id AND sp.user_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.review_purchase(
  p_purchase_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_purchase public.shop_purchases%ROWTYPE;
  v_new_status public.purchase_status;
  v_logged_action text := p_action;
  v_stock integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  IF NOT (public.has_role(v_actor, 'admin'::app_role) OR public.has_role(v_actor, 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  IF p_action NOT IN ('approve','reject','deliver','cancel') THEN
    RAISE EXCEPTION 'Ação inválida: %', p_action;
  END IF;

  SELECT * INTO v_purchase FROM public.shop_purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  IF v_purchase.status IN ('delivered','cancelled') THEN
    RAISE EXCEPTION 'Pedido já finalizado (%)', v_purchase.status;
  END IF;

  IF p_action = 'approve' THEN
    IF v_purchase.status <> 'pending' THEN
      RAISE EXCEPTION 'Somente pedidos pendentes podem ser aprovados';
    END IF;

    IF v_purchase.requires_dual_approval AND v_purchase.first_approver_id IS NULL THEN
      UPDATE public.shop_purchases
        SET first_approver_id = v_actor
        WHERE id = p_purchase_id;

      INSERT INTO public.purchase_approvals (purchase_id, actor_id, action, from_status, to_status, reason, risk_snapshot)
      VALUES (p_purchase_id, v_actor, 'first_approval', 'pending', 'pending', p_reason,
              jsonb_build_object('risk_score', v_purchase.risk_score, 'risk_level', v_purchase.risk_level));

      RETURN jsonb_build_object('status', 'pending', 'awaiting_second_approval', true);
    END IF;

    IF v_purchase.requires_dual_approval AND v_purchase.first_approver_id = v_actor THEN
      RAISE EXCEPTION 'Pedido de risco elevado exige um segundo aprovador distinto';
    END IF;

    v_new_status := 'approved';

  ELSIF p_action = 'deliver' THEN
    IF v_purchase.status <> 'approved' THEN
      RAISE EXCEPTION 'Somente pedidos aprovados podem ser entregues';
    END IF;
    v_new_status := 'delivered';

  ELSE
    v_new_status := 'cancelled';

    UPDATE public.profiles
      SET coins = coins + v_purchase.total_coins
      WHERE id = v_purchase.user_id;

    SELECT stock INTO v_stock FROM public.shop_rewards WHERE id = v_purchase.reward_id;
    IF v_stock IS NOT NULL THEN
      UPDATE public.shop_rewards
        SET stock = stock + v_purchase.quantity
        WHERE id = v_purchase.reward_id;
    END IF;
  END IF;

  UPDATE public.shop_purchases
    SET status = v_new_status,
        processed_by = v_actor,
        processed_at = now(),
        notes = COALESCE(p_reason, notes)
    WHERE id = p_purchase_id;

  INSERT INTO public.purchase_approvals (purchase_id, actor_id, action, from_status, to_status, reason, risk_snapshot)
  VALUES (p_purchase_id, v_actor, v_logged_action, v_purchase.status, v_new_status, p_reason,
          jsonb_build_object('risk_score', v_purchase.risk_score, 'risk_level', v_purchase.risk_level));

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_purchase.user_id,
    'achievement',
    CASE v_new_status
      WHEN 'approved' THEN '✅ Resgate aprovado'
      WHEN 'delivered' THEN '📦 Resgate entregue'
      ELSE '❌ Resgate cancelado'
    END,
    CASE v_new_status
      WHEN 'cancelled' THEN 'Seu resgate foi cancelado e as moedas foram devolvidas.'
      ELSE 'O status do seu resgate foi atualizado.'
    END,
    jsonb_build_object('purchase_id', p_purchase_id, 'status', v_new_status)
  );

  RETURN jsonb_build_object('status', v_new_status, 'awaiting_second_approval', false);
END;
$$;

REVOKE ALL ON FUNCTION public.review_purchase(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_purchase(uuid, text, text) TO authenticated;