CREATE OR REPLACE FUNCTION public.get_lucky_wheel_prizes_display()
 RETURNS TABLE(id uuid, label text, prize_type text, amount integer, color text, icon text, rarity text, is_active boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT p.id, p.label, p.prize_type, p.amount, p.color, p.icon, p.rarity, p.is_active FROM public.lucky_wheel_prizes p WHERE p.is_active = true ORDER BY p.created_at ASC, p.id ASC; $function$
