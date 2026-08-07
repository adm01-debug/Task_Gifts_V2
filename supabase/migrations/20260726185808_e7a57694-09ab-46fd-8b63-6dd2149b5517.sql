-- 1. Colunas de emissão verificável
ALTER TABLE public.user_certifications
  ADD COLUMN IF NOT EXISTS certificate_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_hash TEXT;

-- 2. Gerador de código legível e colisão-resistente (12 chars base32 sem ambíguos)
CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate TEXT;
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..12 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    candidate := substr(candidate, 1, 4) || '-' || substr(candidate, 5, 4) || '-' || substr(candidate, 9, 4);

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.user_certifications WHERE certificate_code = candidate
    );

    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar um código de certificado único';
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_certificate_code() FROM PUBLIC, anon, authenticated;

-- 3. Backfill dos certificados já emitidos
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.user_certifications WHERE certificate_code IS NULL LOOP
    UPDATE public.user_certifications
      SET certificate_code = public.generate_certificate_code()
      WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 4. Trigger de emissão: código + hash de autenticidade
CREATE OR REPLACE FUNCTION public.set_certificate_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.certificate_code IS NULL THEN
    NEW.certificate_code := public.generate_certificate_code();
  END IF;

  NEW.verification_hash := encode(
    digest(
      NEW.certificate_code || '|' || NEW.user_id::text || '|' ||
      NEW.certification_id::text || '|' || COALESCE(NEW.issued_at, now())::text,
      'sha256'
    ),
    'hex'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_certifications_identity ON public.user_certifications;
CREATE TRIGGER trg_user_certifications_identity
  BEFORE INSERT OR UPDATE OF certificate_code, issued_at, renewed_at
  ON public.user_certifications
  FOR EACH ROW EXECUTE FUNCTION public.set_certificate_identity();

-- Recalcula hash das linhas existentes
UPDATE public.user_certifications
  SET verification_hash = encode(
    digest(certificate_code || '|' || user_id::text || '|' || certification_id::text || '|' || issued_at::text, 'sha256'),
    'hex'
  )
  WHERE verification_hash IS NULL AND certificate_code IS NOT NULL;

ALTER TABLE public.user_certifications
  ALTER COLUMN certificate_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_certifications_certificate_code_key
  ON public.user_certifications (certificate_code);

-- 5. Verificação pública por código (não expõe user_id nem notas internas)
CREATE OR REPLACE FUNCTION public.verify_certificate(_code TEXT)
RETURNS TABLE (
  certificate_code TEXT,
  holder_name TEXT,
  certification_name TEXT,
  certification_category TEXT,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT,
  is_valid BOOLEAN,
  verification_hash TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    uc.certificate_code,
    COALESCE(p.display_name, 'Colaborador'),
    c.name,
    c.category,
    uc.issued_at,
    uc.expires_at,
    uc.status,
    (uc.status IN ('active', 'expiring_soon') AND (uc.expires_at IS NULL OR uc.expires_at > now())),
    uc.verification_hash
  FROM public.user_certifications uc
  JOIN public.certifications c ON c.id = uc.certification_id
  LEFT JOIN public.profiles p ON p.id = uc.user_id
  WHERE upper(trim(uc.certificate_code)) = upper(trim(_code))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;