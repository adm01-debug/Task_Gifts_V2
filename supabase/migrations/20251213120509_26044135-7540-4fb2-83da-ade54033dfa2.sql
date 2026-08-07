-- Create shop_promotions table for limited-time offers
CREATE TABLE public.shop_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.shop_rewards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_coins INTEGER,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_claims INTEGER, -- null = unlimited
  current_claims INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_promotions ENABLE ROW LEVEL SECURITY;

-- Everyone can view active promotions
CREATE POLICY "Everyone can view active promotions"
ON public.shop_promotions
FOR SELECT
USING (is_active = true AND starts_at <= now() AND ends_at > now());

-- Admins can view all promotions
CREATE POLICY "Admins can view all promotions"
ON public.shop_promotions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage promotions
CREATE POLICY "Admins can manage promotions"
ON public.shop_promotions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_shop_promotions_updated_at
  BEFORE UPDATE ON public.shop_promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for active promotions query
CREATE INDEX idx_shop_promotions_active ON public.shop_promotions (is_active, starts_at, ends_at);
CREATE INDEX idx_shop_promotions_reward ON public.shop_promotions (reward_id);