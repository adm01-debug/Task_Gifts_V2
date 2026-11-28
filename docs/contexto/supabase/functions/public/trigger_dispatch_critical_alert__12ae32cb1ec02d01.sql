CREATE OR REPLACE FUNCTION public.trigger_dispatch_critical_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_project_url TEXT;
  v_secret TEXT;
BEGIN
  IF LOWER(COALESCE(NEW.severity, '')) NOT IN ('high', 'critical') THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT value INTO v_project_url
    FROM _internal.dispatch_config
    WHERE key = 'project_url'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_project_url := NULL;
  END;

  IF v_project_url IS NULL OR v_project_url = '' THEN
    v_project_url := 'https://eidsaqymojyuhprobfpn.supabase.co';
  END IF;

  -- O Vault vem primeiro de proposito: `_internal.dispatch_config.dispatch_secret`
  -- e' a copia estatica feita no provisionamento. Depois de rotacionar o segredo no
  -- Vault, uma copia antiga aqui faria o trigger enviar o valor revogado, a edge
  -- devolver 401 e o alerta critico se perder em silencio.
  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'internal_dispatch_secret'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
    BEGIN
      SELECT value INTO v_secret
      FROM _internal.dispatch_config
      WHERE key = 'dispatch_secret'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_secret := NULL;
    END;
  END IF;

  -- Ultimo recurso: 'cron_secret' e' um token ja aceito pelas funcoes internas,
  -- entao serve quando o Vault nao esta acessivel nem ha sobrescrita explicita.
  IF v_secret IS NULL OR v_secret = '' THEN
    BEGIN
      SELECT value INTO v_secret
      FROM _internal.dispatch_config
      WHERE key = 'cron_secret'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_secret := NULL;
    END;
  END IF;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'dispatch-critical-alert skipped: segredo ausente no vault e em _internal.dispatch_config (dispatch_secret/cron_secret)';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/dispatch-critical-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_secret
    ),
    body := jsonb_build_object(
      'alert_id', NEW.id,
      'alert_type', NEW.alert_type,
      'severity', NEW.severity,
      'title', NEW.title,
      'description', NEW.description,
      'metadata', NEW.metadata
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'dispatch-critical-alert failed: %', SQLERRM;
  RETURN NEW;
END;
$function$
