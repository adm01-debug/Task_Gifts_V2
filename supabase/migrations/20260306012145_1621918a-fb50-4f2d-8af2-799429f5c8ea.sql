-- Vinculo de papel de um usuario que existe em producao. O bloco condicional
-- evita que a reconstrucao local (auth.users vazio) aborte na FK; em producao
-- o usuario existe e os dois inserts rodam como antes.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '2ad6e986-5a6c-4173-8d39-40de4287bba7') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES ('2ad6e986-5a6c-4173-8d39-40de4287bba7', 'admin') ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES ('2ad6e986-5a6c-4173-8d39-40de4287bba7', 'manager') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END
$do$;