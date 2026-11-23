-- Migration: cria tabela goal_templates para o GoalsManager do painel admin
-- Regra 8: DDL em produção — requer aprovação antes do merge

CREATE TABLE IF NOT EXISTS public.goal_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  goal_type   TEXT        NOT NULL DEFAULT 'personal'
                          CHECK (goal_type IN ('personal', 'team', 'company')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low', 'medium', 'high')),
  xp_reward   INTEGER     NOT NULL DEFAULT 100 CHECK (xp_reward >= 0),
  coin_reward INTEGER     NOT NULL DEFAULT 50  CHECK (coin_reward >= 0),
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_goal_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_goal_templates_updated_at ON public.goal_templates;
CREATE TRIGGER trg_goal_templates_updated_at
  BEFORE UPDATE ON public.goal_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_goal_templates_updated_at();

-- RLS
ALTER TABLE public.goal_templates ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados podem ler
CREATE POLICY "goal_templates_select" ON public.goal_templates
  FOR SELECT TO authenticated USING (true);

-- Apenas admin pode inserir
CREATE POLICY "goal_templates_insert" ON public.goal_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Apenas admin pode atualizar
CREATE POLICY "goal_templates_update" ON public.goal_templates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Apenas admin pode deletar
CREATE POLICY "goal_templates_delete" ON public.goal_templates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Seed dos templates padrão
INSERT INTO public.goal_templates (title, description, goal_type, priority, xp_reward, coin_reward)
VALUES
  ('Aumentar Produtividade', 'Meta para aumentar a produtividade individual em 20%', 'personal', 'high', 200, 100),
  ('Concluir Treinamento', 'Finalizar todas as trilhas de aprendizado obrigatórias', 'personal', 'medium', 150, 75),
  ('Meta de Vendas da Equipe', 'Atingir R$ 100.000 em vendas no trimestre', 'team', 'high', 500, 250),
  ('Engajamento da Empresa', 'Aumentar o NPS interno para 8.5', 'company', 'medium', 300, 150),
  ('Reduzir Ausências', 'Diminuir taxa de absenteísmo em 15%', 'team', 'low', 100, 50)
ON CONFLICT DO NOTHING;