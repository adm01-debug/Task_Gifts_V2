-- Adicionar coluna is_active à tabela roles se não existir
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Shield';

-- Criar tabela de permissões se não existir
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'access',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de permissões por role se não existir
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON public.permissions(key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

-- Habilitar RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop policies se existirem para recriar
DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;

-- Políticas para permissions
CREATE POLICY "Everyone can view permissions"
  ON public.permissions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para role_permissions
CREATE POLICY "Everyone can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Atualizar roles existentes com cores e ícones
UPDATE public.roles SET color = '#ef4444', icon = 'ShieldCheck' WHERE key = 'admin';
UPDATE public.roles SET color = '#f59e0b', icon = 'Users' WHERE key = 'manager';
UPDATE public.roles SET color = '#3b82f6', icon = 'User' WHERE key = 'user';

-- Inserir permissões por módulo
INSERT INTO public.permissions (key, name, description, module, category, is_system) VALUES
  ('dashboard.view', 'Visualizar Dashboard', 'Acesso ao dashboard principal', 'dashboard', 'view', true),
  ('dashboard.analytics', 'Visualizar Analytics', 'Acesso a métricas e relatórios', 'dashboard', 'view', true),
  ('users.view', 'Visualizar Usuários', 'Listar e visualizar usuários', 'users', 'view', true),
  ('users.create', 'Criar Usuários', 'Adicionar novos usuários', 'users', 'create', true),
  ('users.edit', 'Editar Usuários', 'Modificar dados de usuários', 'users', 'edit', true),
  ('users.delete', 'Excluir Usuários', 'Remover usuários do sistema', 'users', 'delete', true),
  ('users.manage_roles', 'Gerenciar Roles', 'Atribuir e remover roles de usuários', 'users', 'admin', true),
  ('departments.view', 'Visualizar Departamentos', 'Listar departamentos', 'departments', 'view', true),
  ('departments.manage', 'Gerenciar Departamentos', 'Criar e editar departamentos', 'departments', 'admin', true),
  ('gamification.view', 'Visualizar Gamificação', 'Acesso ao módulo de gamificação', 'gamification', 'view', true),
  ('gamification.manage', 'Gerenciar Gamificação', 'Configurar regras e recompensas', 'gamification', 'admin', true),
  ('shop.view', 'Visualizar Loja', 'Acesso à loja de recompensas', 'gamification', 'view', true),
  ('shop.manage', 'Gerenciar Loja', 'Adicionar e editar itens da loja', 'gamification', 'admin', true),
  ('training.view', 'Visualizar Treinamentos', 'Acesso aos treinamentos', 'training', 'view', true),
  ('training.manage', 'Gerenciar Treinamentos', 'Criar e editar trilhas', 'training', 'admin', true),
  ('training.certify', 'Emitir Certificados', 'Certificar conclusões', 'training', 'admin', true),
  ('feedback.view', 'Visualizar Feedback', 'Acesso ao módulo de feedback', 'feedback', 'view', true),
  ('feedback.give', 'Dar Feedback', 'Enviar feedback a outros', 'feedback', 'create', true),
  ('feedback.manage', 'Gerenciar Feedback', 'Configurar ciclos de feedback', 'feedback', 'admin', true),
  ('surveys.view', 'Visualizar Pesquisas', 'Responder pesquisas', 'surveys', 'view', true),
  ('surveys.create', 'Criar Pesquisas', 'Criar novas pesquisas', 'surveys', 'create', true),
  ('surveys.results', 'Ver Resultados', 'Acessar resultados de pesquisas', 'surveys', 'view', true),
  ('pdi.view_own', 'Ver Próprio PDI', 'Visualizar próprio plano de desenvolvimento', 'pdi', 'view', true),
  ('pdi.view_team', 'Ver PDI da Equipe', 'Visualizar PDI dos subordinados', 'pdi', 'view', true),
  ('pdi.manage', 'Gerenciar PDI', 'Criar e aprovar PDIs', 'pdi', 'admin', true),
  ('goals.view_own', 'Ver Próprias Metas', 'Visualizar próprias metas', 'goals', 'view', true),
  ('goals.view_team', 'Ver Metas da Equipe', 'Visualizar metas dos subordinados', 'goals', 'view', true),
  ('goals.create', 'Criar Metas', 'Definir metas para si ou equipe', 'goals', 'create', true),
  ('goals.approve', 'Aprovar Metas', 'Aprovar metas de subordinados', 'goals', 'admin', true),
  ('checkins.view_own', 'Ver Próprios Check-ins', 'Visualizar próprios check-ins', 'checkins', 'view', true),
  ('checkins.view_team', 'Ver Check-ins da Equipe', 'Visualizar check-ins da equipe', 'checkins', 'view', true),
  ('checkins.schedule', 'Agendar Check-ins', 'Criar reuniões 1:1', 'checkins', 'create', true),
  ('reports.basic', 'Relatórios Básicos', 'Acesso a relatórios simples', 'reports', 'view', true),
  ('reports.advanced', 'Relatórios Avançados', 'Acesso a relatórios completos', 'reports', 'view', true),
  ('reports.export', 'Exportar Relatórios', 'Exportar dados em CSV/PDF', 'reports', 'export', true),
  ('security.view', 'Visualizar Segurança', 'Acesso ao painel de segurança', 'security', 'view', true),
  ('security.manage', 'Gerenciar Segurança', 'Configurar regras de segurança', 'security', 'admin', true),
  ('security.audit', 'Auditoria', 'Acesso a logs de auditoria', 'security', 'view', true),
  ('settings.view', 'Visualizar Configurações', 'Ver configurações do sistema', 'settings', 'view', true),
  ('settings.manage', 'Gerenciar Configurações', 'Modificar configurações globais', 'settings', 'admin', true),
  ('integrations.view', 'Visualizar Integrações', 'Ver integrações ativas', 'integrations', 'view', true),
  ('integrations.manage', 'Gerenciar Integrações', 'Configurar integrações externas', 'integrations', 'admin', true),
  ('admin.full', 'Acesso Total', 'Permissão master do sistema', 'admin', 'admin', true)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  category = EXCLUDED.category;

-- Atribuir permissões aos roles
DO $$
DECLARE
  v_admin_id UUID;
  v_manager_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM roles WHERE key = 'admin';
  SELECT id INTO v_manager_id FROM roles WHERE key = 'manager';
  SELECT id INTO v_user_id FROM roles WHERE key = 'user';
  
  -- Admin recebe todas as permissões
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_id, id FROM permissions
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Manager recebe permissões de gestão
  IF v_manager_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_id, id FROM permissions 
    WHERE key IN (
      'dashboard.view', 'dashboard.analytics', 'users.view', 'departments.view',
      'gamification.view', 'shop.view', 'training.view', 'training.manage',
      'feedback.view', 'feedback.give', 'feedback.manage', 'surveys.view', 
      'surveys.create', 'surveys.results', 'pdi.view_own', 'pdi.view_team', 
      'pdi.manage', 'goals.view_own', 'goals.view_team', 'goals.create', 
      'goals.approve', 'checkins.view_own', 'checkins.view_team', 'checkins.schedule',
      'reports.basic', 'reports.advanced', 'reports.export', 'security.view'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- User recebe permissões básicas
  IF v_user_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_user_id, id FROM permissions 
    WHERE key IN (
      'dashboard.view', 'gamification.view', 'shop.view', 'training.view',
      'feedback.view', 'feedback.give', 'surveys.view', 'pdi.view_own',
      'goals.view_own', 'checkins.view_own', 'reports.basic'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;