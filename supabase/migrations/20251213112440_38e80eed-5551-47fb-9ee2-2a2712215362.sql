-- Create enum for reward categories
CREATE TYPE public.reward_category AS ENUM ('product', 'benefit', 'experience');

-- Create enum for reward rarity
CREATE TYPE public.reward_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Create enum for purchase status
CREATE TYPE public.purchase_status AS ENUM ('pending', 'approved', 'delivered', 'cancelled');

-- Create shop_rewards table
CREATE TABLE public.shop_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category reward_category NOT NULL DEFAULT 'product',
  price_coins INTEGER NOT NULL DEFAULT 100,
  stock INTEGER, -- NULL means unlimited
  image_url TEXT,
  rarity reward_rarity NOT NULL DEFAULT 'common',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop_purchases table
CREATE TABLE public.shop_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.shop_rewards(id) ON DELETE CASCADE,
  status purchase_status NOT NULL DEFAULT 'pending',
  quantity INTEGER NOT NULL DEFAULT 1,
  total_coins INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.shop_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_rewards
CREATE POLICY "Everyone can view active rewards"
ON public.shop_rewards
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage rewards"
ON public.shop_rewards
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for shop_purchases
CREATE POLICY "Users can view own purchases"
ON public.shop_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
ON public.shop_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
ON public.shop_purchases
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can update purchases"
ON public.shop_purchases
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Trigger for updated_at
CREATE TRIGGER update_shop_rewards_updated_at
BEFORE UPDATE ON public.shop_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();