CREATE OR REPLACE FUNCTION public.check_api_key_rotation_overdue()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT eak.id, eak.name, eak.api_key,
           GREATEST(0, EXTRACT(DAY FROM now() - COALESCE(eak.secret_last_rotated_at, eak.created_at))::int) AS days
    FROM public.external_api_keys eak
    WHERE eak.is_active = true
      AND COALESCE(eak.secret_last_rotated_at, eak.created_at) < now() - interval '90 days'
  LOOP
    -- Evita duplicidade: um alerta aberto por chave a cada 7 dias
    IF NOT EXISTS (
      SELECT 1 FROM public.security_alerts sa
      WHERE sa.alert_type = 'api_key_rotation_overdue'
        AND sa.metadata->>'key_id' = r.id::text
        AND sa.is_resolved = false
        AND sa.created_at > now() - interval '7 days'
    ) THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'api_key_rotation_overdue',
        CASE WHEN r.days >= 180 THEN 'high' ELSE 'medium' END,
        'Chave de API sem rotação há ' || r.days || ' dias',
        'A chave "' || r.name || '" (' || left(r.api_key, 6) || '…' || right(r.api_key, 4) ||
        ') está ativa e não tem o segredo rotacionado há ' || r.days || ' dias. Rotacione em Admin > Chaves de API.',
        jsonb_build_object('key_id', r.id, 'name', r.name, 'days_since_rotation', r.days)
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$function$
