-- =====================================================================
-- Onda 1 (pos-auditoria 2026-09-05): correcoes de seguranca cirurgicas
-- Ref: auditoria tecnica — dimensoes Autorizacao e Seguranca
-- =====================================================================

-- 1) search_path fixo na UNICA funcao SECURITY DEFINER sem configuracao
--    (249 das 250 ja tinham search_path; verificado via pg_proc.proconfig).
--    Sem isso, a funcao e vulneravel a sequestro de objetos em schemas
--    gravaveis pelo chamador.
ALTER FUNCTION public.audit_lucky_wheel_prize() SET search_path = public, extensions;

-- 2) Bucket org-assets: limite de 10 MB e allowlist de MIME types
--    (paridade com course-uploads; antes aceitava qualquer tamanho/tipo)
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'application/pdf'
    ]
WHERE id = 'org-assets';
