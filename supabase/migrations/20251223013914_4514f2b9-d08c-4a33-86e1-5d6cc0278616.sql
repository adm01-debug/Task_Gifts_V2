
-- Tabela de Temas de Gamificação por Departamento
CREATE TABLE public.gamification_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎮',
  color_primary TEXT DEFAULT '#6366f1',
  color_secondary TEXT DEFAULT '#8b5cf6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(department_id)
);

-- Tabela de Hierarquias/Ranks customizáveis
CREATE TABLE public.custom_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES public.gamification_themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#fbbf24',
  min_level INTEGER NOT NULL DEFAULT 1,
  max_level INTEGER,
  xp_multiplier NUMERIC(3,2) DEFAULT 1.00,
  coin_multiplier NUMERIC(3,2) DEFAULT 1.00,
  order_index INTEGER DEFAULT 0,
  badge_url TEXT,
  special_perks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Badges/Conquistas customizáveis por tema
CREATE TABLE public.custom_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES public.gamification_themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  color TEXT DEFAULT '#fbbf24',
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  category TEXT DEFAULT 'achievement',
  unlock_condition JSONB DEFAULT '{}',
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Títulos especiais por tema
CREATE TABLE public.custom_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES public.gamification_themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT,
  suffix TEXT,
  description TEXT,
  icon TEXT DEFAULT '👑',
  color TEXT DEFAULT '#fbbf24',
  unlock_type TEXT DEFAULT 'achievement' CHECK (unlock_type IN ('level', 'achievement', 'purchase', 'manual', 'event')),
  unlock_requirement JSONB DEFAULT '{}',
  is_limited BOOLEAN DEFAULT false,
  max_holders INTEGER,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de atribuição de títulos aos usuários
CREATE TABLE public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title_id UUID REFERENCES public.custom_titles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  earned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Tabela de configurações de níveis por tema
CREATE TABLE public.level_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES public.gamification_themes(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  name TEXT,
  xp_required INTEGER NOT NULL,
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#6366f1',
  rank_id UUID REFERENCES public.custom_ranks(id) ON DELETE SET NULL,
  rewards JSONB DEFAULT '{"coins": 0, "special_item": null}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(theme_id, level)
);

-- Atualizar tabela de leagues para suportar departamentos
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES public.gamification_themes(id) ON DELETE SET NULL;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS special_rewards JSONB DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.gamification_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_configs ENABLE ROW LEVEL SECURITY;

-- Policies para gamification_themes
CREATE POLICY "Everyone can view active themes" ON public.gamification_themes
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage themes" ON public.gamification_themes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies para custom_ranks
CREATE POLICY "Everyone can view ranks" ON public.custom_ranks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage ranks" ON public.custom_ranks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies para custom_badges
CREATE POLICY "Everyone can view active badges" ON public.custom_badges
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage badges" ON public.custom_badges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies para custom_titles
CREATE POLICY "Everyone can view active titles" ON public.custom_titles
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage titles" ON public.custom_titles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies para user_titles
CREATE POLICY "Users can view own titles" ON public.user_titles
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user titles" ON public.user_titles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies para level_configs
CREATE POLICY "Everyone can view level configs" ON public.level_configs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage level configs" ON public.level_configs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Índices para performance
CREATE INDEX idx_custom_ranks_theme ON public.custom_ranks(theme_id);
CREATE INDEX idx_custom_badges_theme ON public.custom_badges(theme_id);
CREATE INDEX idx_custom_titles_theme ON public.custom_titles(theme_id);
CREATE INDEX idx_user_titles_user ON public.user_titles(user_id);
CREATE INDEX idx_level_configs_theme ON public.level_configs(theme_id);
CREATE INDEX idx_leagues_department ON public.leagues(department_id);
