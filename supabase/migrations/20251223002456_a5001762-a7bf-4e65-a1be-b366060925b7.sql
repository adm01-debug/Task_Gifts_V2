
-- Enum para status de tarefa
CREATE TYPE public.task_completion_status AS ENUM ('pending', 'on_time', 'late', 'rejected', 'rework');

-- Tabela de Cargos/Funções
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Templates de Tarefas por Cargo
CREATE TABLE public.position_task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  expected_duration_minutes INTEGER DEFAULT 60,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 25,
  xp_penalty_late INTEGER NOT NULL DEFAULT 25, -- Penalidade por atraso
  xp_penalty_rework INTEGER NOT NULL DEFAULT 50, -- Penalidade por retrabalho
  deadline_hours INTEGER DEFAULT 24, -- Prazo em horas
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Vínculo Usuário-Cargo
CREATE TABLE public.user_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, position_id)
);

-- Tabela de Pontuação de Tarefas (inclui Bitrix24)
CREATE TABLE public.task_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_template_id UUID REFERENCES public.position_task_templates(id) ON DELETE SET NULL,
  bitrix_task_id TEXT, -- ID da tarefa no Bitrix24 (se aplicável)
  title TEXT NOT NULL,
  description TEXT,
  status task_completion_status NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'internal', -- internal, bitrix24
  
  -- Datas
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deadline_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Pontuação
  xp_earned INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  xp_penalty INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas
  is_late BOOLEAN NOT NULL DEFAULT false,
  late_hours INTEGER DEFAULT 0,
  rework_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata do Bitrix24
  bitrix_metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Histórico de Penalidades
CREATE TABLE public.task_penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_score_id UUID REFERENCES public.task_scores(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL, -- late, rework, incomplete, quality
  xp_deducted INTEGER NOT NULL DEFAULT 0,
  coins_deducted INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  applied_by UUID, -- Admin/Manager que aplicou
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Configuração de Regras de Penalidade
CREATE TABLE public.penalty_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  penalty_type TEXT NOT NULL, -- late, rework, incomplete, quality
  
  -- Regras de aplicação
  trigger_condition TEXT NOT NULL, -- ex: "late_hours > 24", "rework_count >= 2"
  xp_penalty_percent INTEGER DEFAULT 50, -- % do XP original a ser deduzido
  xp_penalty_fixed INTEGER DEFAULT 0, -- Valor fixo de XP a deduzir
  coin_penalty_percent INTEGER DEFAULT 0,
  coin_penalty_fixed INTEGER DEFAULT 0,
  
  -- Escalonamento
  is_escalating BOOLEAN NOT NULL DEFAULT false, -- Aumenta com reincidência
  escalation_multiplier NUMERIC(3,2) DEFAULT 1.5,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalty_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: positions
CREATE POLICY "Everyone can view positions" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Admins can manage positions" ON public.positions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: position_task_templates
CREATE POLICY "Everyone can view active templates" ON public.position_task_templates FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins and managers can manage templates" ON public.position_task_templates FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies: user_positions
CREATE POLICY "Users can view own positions" ON public.user_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team positions" ON public.user_positions FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can manage user positions" ON public.user_positions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: task_scores
CREATE POLICY "Users can view own task scores" ON public.task_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all task scores" ON public.task_scores FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "System can insert task scores" ON public.task_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update task scores" ON public.task_scores FOR UPDATE USING (true);

-- RLS Policies: task_penalties
CREATE POLICY "Users can view own penalties" ON public.task_penalties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all penalties" ON public.task_penalties FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can manage penalties" ON public.task_penalties FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies: penalty_rules
CREATE POLICY "Everyone can view active rules" ON public.penalty_rules FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage penalty rules" ON public.penalty_rules FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_position_task_templates_updated_at BEFORE UPDATE ON public.position_task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_scores_updated_at BEFORE UPDATE ON public.task_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_penalty_rules_updated_at BEFORE UPDATE ON public.penalty_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para aplicar penalidade e deduzir XP/coins do perfil
CREATE OR REPLACE FUNCTION public.apply_task_penalty(
  p_user_id UUID,
  p_task_score_id UUID,
  p_penalty_type TEXT,
  p_xp_deducted INTEGER,
  p_coins_deducted INTEGER DEFAULT 0,
  p_reason TEXT DEFAULT NULL,
  p_applied_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_penalty_id UUID;
BEGIN
  -- Inserir registro de penalidade
  INSERT INTO task_penalties (user_id, task_score_id, penalty_type, xp_deducted, coins_deducted, reason, applied_by)
  VALUES (p_user_id, p_task_score_id, p_penalty_type, p_xp_deducted, p_coins_deducted, p_reason, p_applied_by)
  RETURNING id INTO v_penalty_id;
  
  -- Deduzir do perfil (não deixar ficar negativo)
  UPDATE profiles
  SET 
    xp = GREATEST(0, xp - p_xp_deducted),
    coins = GREATEST(0, coins - p_coins_deducted),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Atualizar task_score
  UPDATE task_scores
  SET xp_penalty = xp_penalty + p_xp_deducted
  WHERE id = p_task_score_id;
  
  RETURN v_penalty_id;
END;
$$;

-- Função para completar tarefa e calcular pontuação
CREATE OR REPLACE FUNCTION public.complete_task_score(
  p_task_score_id UUID,
  p_status task_completion_status DEFAULT 'on_time'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task task_scores%ROWTYPE;
  v_template position_task_templates%ROWTYPE;
  v_xp_earned INTEGER := 0;
  v_coins_earned INTEGER := 0;
  v_xp_penalty INTEGER := 0;
  v_is_late BOOLEAN := false;
  v_late_hours INTEGER := 0;
BEGIN
  -- Buscar tarefa
  SELECT * INTO v_task FROM task_scores WHERE id = p_task_score_id;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  -- Buscar template se existir
  IF v_task.task_template_id IS NOT NULL THEN
    SELECT * INTO v_template FROM position_task_templates WHERE id = v_task.task_template_id;
  END IF;
  
  -- Calcular atraso
  IF v_task.deadline_at IS NOT NULL AND now() > v_task.deadline_at THEN
    v_is_late := true;
    v_late_hours := EXTRACT(EPOCH FROM (now() - v_task.deadline_at)) / 3600;
  END IF;
  
  -- Calcular pontuação baseada no status
  IF v_template IS NOT NULL THEN
    CASE p_status
      WHEN 'on_time' THEN
        v_xp_earned := v_template.xp_reward;
        v_coins_earned := v_template.coin_reward;
      WHEN 'late' THEN
        v_xp_earned := GREATEST(0, v_template.xp_reward - v_template.xp_penalty_late);
        v_coins_earned := v_template.coin_reward / 2;
        v_xp_penalty := v_template.xp_penalty_late;
      WHEN 'rework' THEN
        v_xp_penalty := v_template.xp_penalty_rework;
        v_xp_earned := 0;
        v_coins_earned := 0;
      WHEN 'rejected' THEN
        v_xp_penalty := v_template.xp_reward; -- Perde todo XP potencial
        v_xp_earned := 0;
        v_coins_earned := 0;
      ELSE
        v_xp_earned := v_template.xp_reward;
        v_coins_earned := v_template.coin_reward;
    END CASE;
  ELSE
    -- Valores padrão se não tiver template
    IF p_status = 'on_time' THEN
      v_xp_earned := 50;
      v_coins_earned := 25;
    ELSIF p_status = 'late' THEN
      v_xp_earned := 25;
      v_coins_earned := 10;
      v_xp_penalty := 25;
    ELSIF p_status IN ('rework', 'rejected') THEN
      v_xp_penalty := 50;
    END IF;
  END IF;
  
  -- Atualizar task_score
  UPDATE task_scores
  SET 
    status = p_status,
    completed_at = now(),
    xp_earned = v_xp_earned,
    coins_earned = v_coins_earned,
    xp_penalty = v_xp_penalty,
    is_late = v_is_late,
    late_hours = v_late_hours,
    rework_count = CASE WHEN p_status = 'rework' THEN rework_count + 1 ELSE rework_count END
  WHERE id = p_task_score_id;
  
  -- Atualizar perfil do usuário
  UPDATE profiles
  SET 
    xp = xp + v_xp_earned - v_xp_penalty,
    coins = coins + v_coins_earned,
    quests_completed = quests_completed + CASE WHEN p_status IN ('on_time', 'late') THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = v_task.user_id;
  
  -- Registrar penalidade se houver
  IF v_xp_penalty > 0 THEN
    INSERT INTO task_penalties (user_id, task_score_id, penalty_type, xp_deducted, reason)
    VALUES (v_task.user_id, p_task_score_id, p_status::TEXT, v_xp_penalty, 
            CASE 
              WHEN p_status = 'late' THEN 'Tarefa entregue com atraso de ' || v_late_hours || ' horas'
              WHEN p_status = 'rework' THEN 'Tarefa devolvida para retrabalho'
              WHEN p_status = 'rejected' THEN 'Tarefa rejeitada por qualidade insuficiente'
              ELSE 'Penalidade aplicada'
            END);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'coins_earned', v_coins_earned,
    'xp_penalty', v_xp_penalty,
    'is_late', v_is_late,
    'late_hours', v_late_hours
  );
END;
$$;

-- Inserir regras de penalidade padrão
INSERT INTO penalty_rules (name, description, penalty_type, trigger_condition, xp_penalty_percent, is_active) VALUES
('Atraso Leve', 'Tarefa entregue com até 24h de atraso', 'late', 'late_hours <= 24', 25, true),
('Atraso Moderado', 'Tarefa entregue com 24-48h de atraso', 'late', 'late_hours > 24 AND late_hours <= 48', 50, true),
('Atraso Grave', 'Tarefa entregue com mais de 48h de atraso', 'late', 'late_hours > 48', 75, true),
('Primeiro Retrabalho', 'Primeira devolução para correção', 'rework', 'rework_count = 1', 50, true),
('Retrabalho Recorrente', 'Segunda ou mais devoluções', 'rework', 'rework_count >= 2', 100, true),
('Tarefa Incompleta', 'Tarefa não finalizada no prazo', 'incomplete', 'status = pending AND deadline_passed', 100, true);
