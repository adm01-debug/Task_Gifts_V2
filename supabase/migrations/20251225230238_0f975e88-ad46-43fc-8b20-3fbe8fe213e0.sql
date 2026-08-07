
-- =============================================
-- MÓDULO TRANSVERSAL - PERMISSÕES GRANULARES
-- =============================================

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Roles (se não existir já temos user_roles mas precisamos de definição de roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Role-Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- =============================================
-- MÓDULO TRANSVERSAL - TEMPLATES DE NOTIFICAÇÃO
-- =============================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  channels JSONB DEFAULT '["in_app"]',
  subject_template TEXT,
  body_template TEXT NOT NULL,
  body_template_html TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos faltantes em notification_preferences se necessário
ALTER TABLE public.notification_preferences 
  ADD COLUMN IF NOT EXISTS channel_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS channel_push BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS channel_in_app BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours_start TIME,
  ADD COLUMN IF NOT EXISTS quiet_hours_end TIME,
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'instant';

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Permissions - todos podem ver
CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (true);

-- Roles - todos podem ver
CREATE POLICY "roles_select" ON public.roles FOR SELECT USING (true);

-- Role Permissions - todos podem ver
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT USING (true);

-- Notification Templates - todos podem ver templates ativos
CREATE POLICY "notification_templates_select" ON public.notification_templates FOR SELECT USING (is_active = true);

-- =============================================
-- SEED DATA - Permissões Base
-- =============================================

INSERT INTO public.permissions (key, name, description, module, category, is_system) VALUES
  ('admin.full', 'Acesso Administrativo Completo', 'Acesso total ao sistema', 'admin', 'system', true),
  ('users.view', 'Visualizar Usuários', 'Pode visualizar lista de usuários', 'users', 'read', true),
  ('users.create', 'Criar Usuários', 'Pode criar novos usuários', 'users', 'write', true),
  ('users.edit', 'Editar Usuários', 'Pode editar usuários existentes', 'users', 'write', true),
  ('users.delete', 'Excluir Usuários', 'Pode excluir usuários', 'users', 'delete', true),
  ('surveys.view', 'Visualizar Pesquisas', 'Pode visualizar pesquisas', 'surveys', 'read', false),
  ('surveys.create', 'Criar Pesquisas', 'Pode criar novas pesquisas', 'surveys', 'write', false),
  ('surveys.results', 'Ver Resultados', 'Pode ver resultados de pesquisas', 'surveys', 'read', false),
  ('feedback.view', 'Visualizar Feedbacks', 'Pode visualizar feedbacks', 'feedback', 'read', false),
  ('feedback.manage', 'Gerenciar Feedbacks', 'Pode gerenciar ciclos de feedback', 'feedback', 'write', false),
  ('reports.view', 'Visualizar Relatórios', 'Pode visualizar relatórios', 'reports', 'read', false),
  ('reports.export', 'Exportar Relatórios', 'Pode exportar relatórios', 'reports', 'write', false),
  ('gamification.manage', 'Gerenciar Gamificação', 'Pode gerenciar sistema de gamificação', 'gamification', 'write', false),
  ('shop.manage', 'Gerenciar Loja', 'Pode gerenciar loja de recompensas', 'shop', 'write', false)
ON CONFLICT (key) DO NOTHING;

-- SEED DATA - Roles Base
INSERT INTO public.roles (key, name, description, level, is_system) VALUES
  ('super_admin', 'Super Administrador', 'Acesso total ao sistema', 100, true),
  ('admin', 'Administrador', 'Acesso administrativo', 80, true),
  ('hr_manager', 'Gestor de RH', 'Gerencia recursos humanos', 60, false),
  ('manager', 'Gestor', 'Gerencia equipe', 40, false),
  ('employee', 'Colaborador', 'Acesso básico de colaborador', 10, false)
ON CONFLICT (key) DO NOTHING;

-- SEED DATA - Templates de Notificação
INSERT INTO public.notification_templates (key, name, description, category, channels, subject_template, body_template, variables) VALUES
  ('welcome', 'Boas-vindas', 'Notificação de boas-vindas ao novo usuário', 'onboarding', '["in_app", "email"]', 'Bem-vindo à {{company_name}}!', 'Olá {{user_name}}, seja bem-vindo! Estamos felizes em tê-lo conosco.', '["user_name", "company_name"]'),
  ('feedback_request', 'Solicitação de Feedback', 'Notifica sobre nova solicitação de feedback', 'feedback', '["in_app", "email", "push"]', 'Nova solicitação de feedback', '{{requester_name}} solicitou seu feedback. Prazo: {{due_date}}.', '["requester_name", "due_date"]'),
  ('survey_reminder', 'Lembrete de Pesquisa', 'Lembra sobre pesquisa pendente', 'surveys', '["in_app", "push"]', 'Pesquisa pendente', 'Você tem uma pesquisa pendente: {{survey_name}}. Termine até {{due_date}}.', '["survey_name", "due_date"]'),
  ('achievement_unlocked', 'Conquista Desbloqueada', 'Notifica sobre nova conquista', 'gamification', '["in_app", "push"]', 'Nova conquista!', 'Parabéns! Você desbloqueou: {{achievement_name}}. +{{xp_reward}} XP!', '["achievement_name", "xp_reward"]'),
  ('level_up', 'Subiu de Nível', 'Notifica sobre aumento de nível', 'gamification', '["in_app", "push"]', 'Parabéns, você subiu de nível!', 'Você alcançou o nível {{new_level}}! Continue assim!', '["new_level", "old_level"]'),
  ('checkin_reminder', 'Lembrete de Check-in', 'Lembra sobre check-in agendado', 'checkins', '["in_app", "email"]', 'Check-in agendado', 'Você tem um check-in agendado com {{manager_name}} em {{date}}.', '["manager_name", "date"]'),
  ('pdi_action_due', 'Ação do PDI Vencendo', 'Alerta sobre ação do PDI vencendo', 'pdi', '["in_app", "email"]', 'Ação do PDI vencendo', 'A ação "{{action_title}}" do seu PDI vence em {{days_remaining}} dias.', '["action_title", "days_remaining"]')
ON CONFLICT (key) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
