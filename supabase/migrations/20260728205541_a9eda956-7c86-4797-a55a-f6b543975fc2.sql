-- 1) Colunas de hash com sal
ALTER TABLE public.external_api_keys
  ADD COLUMN IF NOT EXISTS secret_salt text,
  ADD COLUMN IF NOT EXISTS secret_hash text,
  ADD COLUMN IF NOT EXISTS secret_last_rotated_at timestamptz;

-- Migra eventuais registros existentes (tabela hoje vazia, mas idempotente)
UPDATE public.external_api_keys
SET secret_salt = COALESCE(secret_salt, encode(extensions.gen_random_bytes(16), 'hex')),
    secret_last_rotated_at = COALESCE(secret_last_rotated_at, now())
WHERE secret_salt IS NULL;

UPDATE public.external_api_keys
SET secret_hash = encode(extensions.digest(secret_salt || api_secret, 'sha256'), 'hex')
WHERE secret_hash IS NULL;

ALTER TABLE public.external_api_keys DROP COLUMN IF EXISTS api_secret;
ALTER TABLE public.external_api_keys ALTER COLUMN secret_salt SET NOT NULL;
ALTER TABLE public.external_api_keys ALTER COLUMN secret_hash SET NOT NULL;

-- 2) Validação por hash (usada pelas edge functions com service_role)
CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key text, p_api_secret text)
RETURNS TABLE(id uuid, name text, system_type text, permissions jsonb, rate_limit_per_minute integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_row public.external_api_keys%ROWTYPE;
BEGIN
  IF p_api_key IS NULL OR p_api_secret IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row
  FROM public.external_api_keys eak
  WHERE eak.api_key = p_api_key AND eak.is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF encode(extensions.digest(v_row.secret_salt || p_api_secret, 'sha256'), 'hex') <> v_row.secret_hash THEN
    RETURN;
  END IF;

  UPDATE public.external_api_keys
  SET last_used_at = now()
  WHERE external_api_keys.id = v_row.id;

  RETURN QUERY
  SELECT v_row.id, v_row.name, v_row.system_type, v_row.permissions, v_row.rate_limit_per_minute;
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_api_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text) TO service_role;

-- 3) Criação de chave: segredo gerado no servidor e devolvido UMA única vez
CREATE OR REPLACE FUNCTION public.create_external_api_key(
  p_name text,
  p_description text DEFAULT NULL,
  p_system_type text DEFAULT 'generic',
  p_permissions jsonb DEFAULT '["read"]'::jsonb,
  p_rate_limit_per_minute integer DEFAULT 60
)
RETURNS TABLE(id uuid, api_key text, api_secret text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_key text;
  v_secret text;
  v_salt text;
  v_id uuid;
BEGIN
  PERFORM public._require_admin();

  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Nome da chave é obrigatório';
  END IF;
  IF COALESCE(p_rate_limit_per_minute, 0) < 1 OR p_rate_limit_per_minute > 10000 THEN
    RAISE EXCEPTION 'rate_limit_per_minute deve estar entre 1 e 10000';
  END IF;

  v_key := 'tg_' || encode(extensions.gen_random_bytes(18), 'hex');
  v_secret := encode(extensions.gen_random_bytes(32), 'hex');
  v_salt := encode(extensions.gen_random_bytes(16), 'hex');

  INSERT INTO public.external_api_keys (
    name, description, api_key, secret_salt, secret_hash,
    system_type, permissions, rate_limit_per_minute, created_by, secret_last_rotated_at
  ) VALUES (
    btrim(p_name), p_description, v_key, v_salt,
    encode(extensions.digest(v_salt || v_secret, 'sha256'), 'hex'),
    COALESCE(p_system_type, 'generic'),
    COALESCE(p_permissions, '["read"]'::jsonb),
    p_rate_limit_per_minute, auth.uid(), now()
  )
  RETURNING external_api_keys.id INTO v_id;

  RETURN QUERY SELECT v_id, v_key, v_secret;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_external_api_key(text, text, text, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_external_api_key(text, text, text, jsonb, integer) TO authenticated, service_role;

-- 4) Rotação do segredo
CREATE OR REPLACE FUNCTION public.rotate_external_api_secret(p_id uuid)
RETURNS TABLE(id uuid, api_key text, api_secret text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_secret text;
  v_salt text;
  v_key text;
BEGIN
  PERFORM public._require_admin();

  SELECT eak.api_key INTO v_key FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Chave de API não encontrada';
  END IF;

  v_secret := encode(extensions.gen_random_bytes(32), 'hex');
  v_salt := encode(extensions.gen_random_bytes(16), 'hex');

  UPDATE public.external_api_keys
  SET secret_salt = v_salt,
      secret_hash = encode(extensions.digest(v_salt || v_secret, 'sha256'), 'hex'),
      secret_last_rotated_at = now()
  WHERE external_api_keys.id = p_id;

  RETURN QUERY SELECT p_id, v_key, v_secret;
END;
$function$;

REVOKE ALL ON FUNCTION public.rotate_external_api_secret(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotate_external_api_secret(uuid) TO authenticated, service_role;