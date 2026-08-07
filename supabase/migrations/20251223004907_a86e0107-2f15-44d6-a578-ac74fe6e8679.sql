-- Tabela para API Keys de sistemas externos
CREATE TABLE public.external_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  system_type TEXT NOT NULL DEFAULT 'generic',
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de uso da API
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.external_api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER NOT NULL,
  response_body JSONB,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para webhooks de saída (TaskGifts -> Sistemas externos)
CREATE TABLE public.webhook_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.external_api_keys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  headers JSONB DEFAULT '{}'::jsonb,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de webhooks enviados
CREATE TABLE public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para tarefas recebidas de sistemas externos
CREATE TABLE public.external_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.external_api_keys(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  external_system TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 25,
  xp_penalty_late INTEGER NOT NULL DEFAULT 25,
  xp_penalty_rework INTEGER NOT NULL DEFAULT 50,
  deadline_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_system, external_id)
);

-- Enable RLS
ALTER TABLE public.external_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_api_keys
CREATE POLICY "Admins can manage API keys" ON public.external_api_keys
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view API keys" ON public.external_api_keys
  FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- RLS Policies for api_request_logs
CREATE POLICY "Admins can view API logs" ON public.api_request_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for webhook_subscriptions
CREATE POLICY "Admins can manage webhooks" ON public.webhook_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view webhooks" ON public.webhook_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- RLS Policies for webhook_delivery_logs
CREATE POLICY "Admins can view webhook logs" ON public.webhook_delivery_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for external_tasks
CREATE POLICY "System can manage external tasks" ON public.external_tasks
  FOR ALL USING (true);

CREATE POLICY "Users can view own external tasks" ON public.external_tasks
  FOR SELECT USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_external_api_keys_updated_at
  BEFORE UPDATE ON public.external_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at
  BEFORE UPDATE ON public.webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_tasks_updated_at
  BEFORE UPDATE ON public.external_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate API key
CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key TEXT, p_api_secret TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  system_type TEXT,
  permissions JSONB,
  rate_limit_per_minute INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eak.id,
    eak.name,
    eak.system_type,
    eak.permissions,
    eak.rate_limit_per_minute
  FROM external_api_keys eak
  WHERE eak.api_key = p_api_key 
    AND eak.api_secret = p_api_secret
    AND eak.is_active = true;
  
  -- Update last used
  UPDATE external_api_keys 
  SET last_used_at = now() 
  WHERE external_api_keys.api_key = p_api_key;
END;
$$;

-- Function to process external task and create task_score
CREATE OR REPLACE FUNCTION public.process_external_task(p_external_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task external_tasks%ROWTYPE;
  v_user_id UUID;
  v_task_score_id UUID;
BEGIN
  -- Get external task
  SELECT * INTO v_task FROM external_tasks WHERE id = p_external_task_id;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  -- Find user by email
  SELECT id INTO v_user_id FROM profiles WHERE email = v_task.user_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found with email: ' || v_task.user_email);
  END IF;
  
  -- Update external task with user_id
  UPDATE external_tasks SET user_id = v_user_id WHERE id = p_external_task_id;
  
  -- Create task_score
  INSERT INTO task_scores (
    user_id,
    title,
    description,
    source,
    deadline_at,
    status
  ) VALUES (
    v_user_id,
    v_task.title,
    v_task.description,
    v_task.external_system,
    v_task.deadline_at,
    'pending'
  )
  RETURNING id INTO v_task_score_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'task_score_id', v_task_score_id,
    'user_id', v_user_id
  );
END;
$$;

-- Function to complete external task
CREATE OR REPLACE FUNCTION public.complete_external_task(
  p_external_system TEXT,
  p_external_id TEXT,
  p_status TEXT DEFAULT 'on_time',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task external_tasks%ROWTYPE;
  v_xp_earned INTEGER := 0;
  v_coins_earned INTEGER := 0;
  v_xp_penalty INTEGER := 0;
  v_is_late BOOLEAN := false;
BEGIN
  -- Get external task
  SELECT * INTO v_task 
  FROM external_tasks 
  WHERE external_system = p_external_system AND external_id = p_external_id;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  IF v_task.user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not linked to user');
  END IF;
  
  -- Check if late
  IF v_task.deadline_at IS NOT NULL AND now() > v_task.deadline_at THEN
    v_is_late := true;
  END IF;
  
  -- Calculate rewards based on status
  CASE p_status
    WHEN 'on_time' THEN
      v_xp_earned := v_task.xp_reward;
      v_coins_earned := v_task.coin_reward;
    WHEN 'late' THEN
      v_xp_earned := GREATEST(0, v_task.xp_reward - v_task.xp_penalty_late);
      v_coins_earned := v_task.coin_reward / 2;
      v_xp_penalty := v_task.xp_penalty_late;
    WHEN 'rework' THEN
      v_xp_penalty := v_task.xp_penalty_rework;
    WHEN 'rejected' THEN
      v_xp_penalty := v_task.xp_reward;
    ELSE
      v_xp_earned := v_task.xp_reward;
      v_coins_earned := v_task.coin_reward;
  END CASE;
  
  -- Update external task
  UPDATE external_tasks
  SET 
    status = p_status,
    completed_at = now(),
    metadata = v_task.metadata || p_metadata
  WHERE id = v_task.id;
  
  -- Update user profile
  UPDATE profiles
  SET 
    xp = GREATEST(0, xp + v_xp_earned - v_xp_penalty),
    coins = coins + v_coins_earned,
    quests_completed = quests_completed + CASE WHEN p_status IN ('on_time', 'late') THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = v_task.user_id;
  
  -- Record penalty if applicable
  IF v_xp_penalty > 0 THEN
    INSERT INTO task_penalties (user_id, penalty_type, xp_deducted, reason)
    VALUES (
      v_task.user_id, 
      p_status, 
      v_xp_penalty,
      'Tarefa externa: ' || v_task.title || ' - ' || 
      CASE 
        WHEN p_status = 'late' THEN 'Entregue com atraso'
        WHEN p_status = 'rework' THEN 'Devolvida para retrabalho'
        WHEN p_status = 'rejected' THEN 'Rejeitada'
        ELSE 'Penalidade aplicada'
      END
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_task.user_id,
    'xp_earned', v_xp_earned,
    'coins_earned', v_coins_earned,
    'xp_penalty', v_xp_penalty,
    'is_late', v_is_late
  );
END;
$$;

-- Function to get user stats for API
CREATE OR REPLACE FUNCTION public.get_user_stats_api(p_user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user profiles%ROWTYPE;
  v_rank INTEGER;
  v_department TEXT;
  v_position TEXT;
BEGIN
  -- Get user profile
  SELECT * INTO v_user FROM profiles WHERE email = p_user_email;
  
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get rank
  SELECT COUNT(*) + 1 INTO v_rank
  FROM profiles WHERE xp > v_user.xp;
  
  -- Get department
  SELECT d.name INTO v_department
  FROM team_members tm
  JOIN departments d ON d.id = tm.department_id
  WHERE tm.user_id = v_user.id
  LIMIT 1;
  
  -- Get position
  SELECT p.name INTO v_position
  FROM user_positions up
  JOIN positions p ON p.id = up.position_id
  WHERE up.user_id = v_user.id AND up.is_primary = true
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'level', v_user.level,
      'xp', v_user.xp,
      'coins', v_user.coins,
      'streak', v_user.streak,
      'best_streak', v_user.best_streak,
      'quests_completed', v_user.quests_completed,
      'rank', v_rank,
      'department', v_department,
      'position', v_position
    )
  );
END;
$$;

-- Function to get leaderboard for API
CREATE OR REPLACE FUNCTION public.get_leaderboard_api(p_limit INTEGER DEFAULT 10, p_department_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'success', true,
    'leaderboard', COALESCE(jsonb_agg(row_data ORDER BY rn), '[]'::jsonb)
  ) INTO v_result
  FROM (
    SELECT 
      jsonb_build_object(
        'rank', ROW_NUMBER() OVER (ORDER BY p.xp DESC),
        'user_id', p.id,
        'display_name', p.display_name,
        'email', p.email,
        'level', p.level,
        'xp', p.xp,
        'coins', p.coins,
        'streak', p.streak,
        'quests_completed', p.quests_completed
      ) as row_data,
      ROW_NUMBER() OVER (ORDER BY p.xp DESC) as rn
    FROM profiles p
    LEFT JOIN team_members tm ON tm.user_id = p.id
    WHERE p_department_id IS NULL OR tm.department_id = p_department_id
    ORDER BY p.xp DESC
    LIMIT p_limit
  ) ranked;
  
  RETURN v_result;
END;
$$;