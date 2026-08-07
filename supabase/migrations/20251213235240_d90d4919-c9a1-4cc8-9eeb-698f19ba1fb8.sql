-- Bitrix24 integration tokens storage
CREATE TABLE public.bitrix24_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  member_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Bitrix24 sync mappings (our entities <-> Bitrix24 entities)
CREATE TABLE public.bitrix24_sync_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'user', 'quest', 'department', etc.
  local_id TEXT NOT NULL,
  bitrix_id TEXT NOT NULL,
  bitrix_entity_type TEXT NOT NULL, -- 'contact', 'deal', 'task', etc.
  sync_status TEXT NOT NULL DEFAULT 'synced',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, local_id, bitrix_entity_type)
);

-- Bitrix24 webhook events log
CREATE TABLE public.bitrix24_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix24_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix24_sync_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix24_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tokens (only admins can manage)
CREATE POLICY "Admins can manage bitrix tokens" 
ON public.bitrix24_tokens 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for sync mappings (admins and managers)
CREATE POLICY "Admins and managers can view sync mappings" 
ON public.bitrix24_sync_mappings 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Admins can manage sync mappings" 
ON public.bitrix24_sync_mappings 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for webhook logs (admins only)
CREATE POLICY "Admins can view webhook logs" 
ON public.bitrix24_webhook_logs 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Service can insert webhook logs" 
ON public.bitrix24_webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_bitrix24_tokens_updated_at
BEFORE UPDATE ON public.bitrix24_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bitrix24_sync_mappings_updated_at
BEFORE UPDATE ON public.bitrix24_sync_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();