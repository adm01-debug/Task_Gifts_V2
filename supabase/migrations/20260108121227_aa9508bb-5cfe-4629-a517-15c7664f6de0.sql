
-- Add foreign key for shop_purchases.user_id to profiles.id
ALTER TABLE public.shop_purchases DROP CONSTRAINT IF EXISTS shop_purchases_user_id_fkey;
ALTER TABLE public.shop_purchases 
ADD CONSTRAINT shop_purchases_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key for league_history.user_id to profiles.id
ALTER TABLE public.league_history DROP CONSTRAINT IF EXISTS league_history_user_id_fkey;
ALTER TABLE public.league_history 
ADD CONSTRAINT league_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
