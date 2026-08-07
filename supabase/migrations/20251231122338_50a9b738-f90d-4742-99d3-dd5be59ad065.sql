-- Tabela para armazenar dispositivos conhecidos dos usuários
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT DEFAULT 'desktop',
  is_trusted BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_country TEXT,
  location_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Tabela para alertas de novos dispositivos
CREATE TABLE public.new_device_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.user_devices(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  is_read BOOLEAN DEFAULT false,
  is_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);
CREATE INDEX idx_new_device_alerts_user_id ON public.new_device_alerts(user_id);
CREATE INDEX idx_new_device_alerts_unread ON public.new_device_alerts(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_device_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies para user_devices
CREATE POLICY "Users can view their own devices"
  ON public.user_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.user_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert devices"
  ON public.user_devices FOR INSERT
  WITH CHECK (true);

-- RLS Policies para new_device_alerts
CREATE POLICY "Users can view their own alerts"
  ON public.new_device_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.new_device_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts"
  ON public.new_device_alerts FOR INSERT
  WITH CHECK (true);

-- Função para registrar dispositivo e detectar novo
CREATE OR REPLACE FUNCTION public.register_device(
  p_user_id UUID,
  p_fingerprint TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'desktop'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_device user_devices%ROWTYPE;
  v_is_new BOOLEAN := false;
  v_device_id UUID;
  v_alert_id UUID;
BEGIN
  -- Tentar encontrar dispositivo existente
  SELECT * INTO v_device
  FROM user_devices
  WHERE user_id = p_user_id AND device_fingerprint = p_fingerprint;
  
  IF v_device IS NULL THEN
    -- Novo dispositivo detectado
    v_is_new := true;
    
    INSERT INTO user_devices (
      user_id, device_fingerprint, ip_address, user_agent, 
      browser, os, device_type
    ) VALUES (
      p_user_id, p_fingerprint, p_ip_address, p_user_agent,
      p_browser, p_os, p_device_type
    )
    RETURNING id INTO v_device_id;
    
    -- Criar alerta de novo dispositivo
    INSERT INTO new_device_alerts (user_id, device_id, ip_address, user_agent)
    VALUES (p_user_id, v_device_id, p_ip_address, p_user_agent)
    RETURNING id INTO v_alert_id;
    
    -- Criar notificação
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'security',
      'Novo dispositivo detectado',
      'Um login foi realizado de um novo dispositivo: ' || COALESCE(p_browser, 'Navegador desconhecido') || ' em ' || COALESCE(p_os, 'Sistema desconhecido'),
      jsonb_build_object(
        'alert_id', v_alert_id,
        'device_id', v_device_id,
        'ip_address', p_ip_address::TEXT,
        'browser', p_browser,
        'os', p_os
      )
    );
  ELSE
    -- Atualizar último acesso
    UPDATE user_devices
    SET 
      last_seen_at = now(),
      ip_address = COALESCE(p_ip_address, ip_address)
    WHERE id = v_device.id;
    
    v_device_id := v_device.id;
  END IF;
  
  RETURN jsonb_build_object(
    'is_new_device', v_is_new,
    'device_id', v_device_id,
    'is_trusted', COALESCE(v_device.is_trusted, false)
  );
END;
$$;

-- Enable realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE public.new_device_alerts;