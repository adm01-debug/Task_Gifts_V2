-- Consulta pública (para jogadores autenticados) sem expor o peso do sorteio
CREATE OR REPLACE FUNCTION public.get_lucky_wheel_prizes_display()
RETURNS TABLE(
  id uuid,
  label text,
  prize_type text,
  amount integer,
  color text,
  icon text,
  rarity text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.label, p.prize_type, p.amount, p.color, p.icon, p.rarity, p.is_active
  FROM public.lucky_wheel_prizes p
  WHERE p.is_active = true
  ORDER BY p.created_at ASC, p.id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_lucky_wheel_prizes_display() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lucky_wheel_prizes_display() TO authenticated, service_role;

-- Somente admins podem ler a tabela crua (que contém os pesos)
DROP POLICY IF EXISTS "Authenticated can view active prizes" ON public.lucky_wheel_prizes;

CREATE POLICY "Admins can view lucky wheel prizes"
ON public.lucky_wheel_prizes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));