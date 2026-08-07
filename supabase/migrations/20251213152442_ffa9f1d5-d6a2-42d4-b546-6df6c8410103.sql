-- Create avatar items catalog table
CREATE TABLE public.avatar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('background', 'frame', 'accessory', 'effect', 'badge_style')),
  icon TEXT NOT NULL DEFAULT '✨',
  preview_color TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_type TEXT NOT NULL DEFAULT 'level' CHECK (unlock_type IN ('default', 'level', 'achievement', 'purchase', 'streak', 'special')),
  unlock_requirement INTEGER,
  unlock_achievement_key TEXT,
  price_coins INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user owned avatar items table
CREATE TABLE public.user_avatar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Create user avatar configuration table
CREATE TABLE public.user_avatar_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  selected_background UUID REFERENCES public.avatar_items(id),
  selected_frame UUID REFERENCES public.avatar_items(id),
  selected_accessory UUID REFERENCES public.avatar_items(id),
  selected_effect UUID REFERENCES public.avatar_items(id),
  selected_badge_style UUID REFERENCES public.avatar_items(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_config ENABLE ROW LEVEL SECURITY;

-- Avatar items policies
CREATE POLICY "Everyone can view active avatar items"
ON public.avatar_items FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage avatar items"
ON public.avatar_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- User avatar items policies
CREATE POLICY "Users can view own avatar items"
ON public.user_avatar_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others avatar items for display"
ON public.user_avatar_items FOR SELECT
USING (true);

CREATE POLICY "Users can insert own avatar items"
ON public.user_avatar_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User avatar config policies
CREATE POLICY "Users can view any avatar config"
ON public.user_avatar_config FOR SELECT
USING (true);

CREATE POLICY "Users can insert own avatar config"
ON public.user_avatar_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar config"
ON public.user_avatar_config FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_avatar_config_updated_at
BEFORE UPDATE ON public.user_avatar_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default avatar items
INSERT INTO public.avatar_items (name, description, category, icon, preview_color, rarity, unlock_type, unlock_requirement) VALUES
-- Backgrounds (unlock by level)
('Padrão', 'Fundo padrão do sistema', 'background', '⬜', '#1a1a2e', 'common', 'default', NULL),
('Aurora Boreal', 'Gradiente verde e azul místico', 'background', '🌌', '#0f766e', 'common', 'level', 5),
('Pôr do Sol', 'Cores quentes vibrantes', 'background', '🌅', '#ea580c', 'rare', 'level', 10),
('Galáxia', 'Estrelas e nebulosas', 'background', '🌠', '#7c3aed', 'epic', 'level', 20),
('Ouro Líquido', 'Gradiente dourado premium', 'background', '✨', '#ca8a04', 'legendary', 'level', 50),

-- Frames (unlock by achievements/streaks)
('Simples', 'Borda básica', 'frame', '⭕', '#64748b', 'common', 'default', NULL),
('Bronze', 'Moldura de bronze', 'frame', '🥉', '#cd7f32', 'common', 'level', 3),
('Prata', 'Moldura prateada', 'frame', '🥈', '#c0c0c0', 'rare', 'level', 15),
('Ouro', 'Moldura dourada', 'frame', '🥇', '#ffd700', 'epic', 'level', 30),
('Diamante', 'Moldura de diamante cintilante', 'frame', '💎', '#00d4ff', 'legendary', 'level', 75),
('Fogo', 'Moldura com chamas animadas', 'frame', '🔥', '#ef4444', 'epic', 'streak', 30),
('Raio', 'Energia elétrica', 'frame', '⚡', '#facc15', 'rare', 'streak', 7),

-- Accessories
('Nenhum', 'Sem acessório', 'accessory', '➖', NULL, 'common', 'default', NULL),
('Coroa Simples', 'Uma coroa básica', 'accessory', '👑', '#fbbf24', 'rare', 'level', 25),
('Auréola', 'Círculo dourado', 'accessory', '😇', '#fde047', 'epic', 'achievement', NULL),
('Chifres', 'Chifres de demônio', 'accessory', '😈', '#dc2626', 'rare', 'purchase', 500),
('Óculos Nerd', 'Óculos inteligentes', 'accessory', '🤓', '#3b82f6', 'common', 'purchase', 100),
('Chapéu de Mago', 'Chapéu místico', 'accessory', '🧙', '#8b5cf6', 'epic', 'purchase', 750),

-- Effects
('Nenhum', 'Sem efeito', 'effect', '➖', NULL, 'common', 'default', NULL),
('Brilho', 'Partículas brilhantes', 'effect', '✨', '#fef08a', 'rare', 'level', 40),
('Corações', 'Corações flutuantes', 'effect', '💕', '#f472b6', 'rare', 'purchase', 300),
('Estrelas', 'Estrelas girando', 'effect', '⭐', '#fbbf24', 'epic', 'streak', 14),
('Arco-íris', 'Efeito arco-íris', 'effect', '🌈', '#a855f7', 'legendary', 'achievement', NULL),

-- Badge Styles
('Círculo', 'Badge circular padrão', 'badge_style', '🔵', '#3b82f6', 'common', 'default', NULL),
('Hexágono', 'Badge hexagonal', 'badge_style', '⬡', '#10b981', 'rare', 'level', 8),
('Escudo', 'Badge em formato de escudo', 'badge_style', '🛡️', '#6366f1', 'epic', 'level', 35),
('Estrela', 'Badge em formato de estrela', 'badge_style', '⭐', '#f59e0b', 'legendary', 'level', 60);