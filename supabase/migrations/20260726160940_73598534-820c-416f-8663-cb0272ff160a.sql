-- 1) Colunas de rastreabilidade no plano de ação
ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS engagement_factor_id uuid REFERENCES public.engagement_factors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS analysis_days integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_source_check'
  ) THEN
    ALTER TABLE public.action_plans
      ADD CONSTRAINT action_plans_source_check
      CHECK (source IN ('manual', 'engagement_factor', 'climate_survey', 'nine_box'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_action_plans_factor
  ON public.action_plans (engagement_factor_id) WHERE engagement_factor_id IS NOT NULL;

-- 2) Biblioteca de ações recomendadas por pilar
CREATE TABLE IF NOT EXISTS public.engagement_action_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar climate_pillar NOT NULL,
  title text NOT NULL,
  why_reason text NOT NULL,
  how_method text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  duration_days integer NOT NULL DEFAULT 30 CHECK (duration_days > 0),
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.engagement_action_playbooks TO authenticated;
GRANT ALL ON public.engagement_action_playbooks TO service_role;

ALTER TABLE public.engagement_action_playbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playbooks_select" ON public.engagement_action_playbooks;
CREATE POLICY "playbooks_select" ON public.engagement_action_playbooks
  FOR SELECT TO authenticated USING (is_active);

DROP POLICY IF EXISTS "playbooks_admin_write" ON public.engagement_action_playbooks;
CREATE POLICY "playbooks_admin_write" ON public.engagement_action_playbooks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_playbooks_pillar
  ON public.engagement_action_playbooks (pillar, order_index);

DROP TRIGGER IF EXISTS trg_playbooks_updated ON public.engagement_action_playbooks;
CREATE TRIGGER trg_playbooks_updated BEFORE UPDATE ON public.engagement_action_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seeds (idempotentes por pilar + titulo)
CREATE UNIQUE INDEX IF NOT EXISTS uq_playbooks_pillar_title
  ON public.engagement_action_playbooks (pillar, title);

INSERT INTO public.engagement_action_playbooks (pillar, title, why_reason, how_method, priority, duration_days, order_index) VALUES
('recognition','Ritual quinzenal de reconhecimento','Reconhecimento infrequente reduz a percepcao de valor do trabalho entregue.','Reservar 15 minutos na reuniao quinzenal da area para reconhecer publicamente entregas especificas, citando o impacto no cliente ou no time.','high',30,1),
('recognition','Revisar criterios de meritocracia','Criterios pouco claros geram percepcao de injustica nas promocoes.','Documentar e publicar os criterios objetivos de promocao e bonificacao, com exemplos praticos por nivel.','high',45,2),
('recognition','Ativar kudos entre pares','Reconhecimento horizontal amplia o alcance alem do gestor.','Estimular o uso semanal de kudos na plataforma e acompanhar a adesao por area no ranking.','medium',30,3),
('autonomy','Mapear alcada de decisao','A falta de clareza sobre o que cada pessoa pode decidir gera gargalo no gestor.','Construir com o time uma matriz de decisao (decide / consulta / informa) e validar em reuniao.','high',30,1),
('autonomy','Delegar um projeto por pessoa','Autonomia se constroi com responsabilidade real, nao com discurso.','Atribuir a cada pessoa a conducao completa de um projeto do trimestre, com checkpoint quinzenal.','medium',60,2),
('autonomy','Reduzir aprovacoes desnecessarias','Excesso de aprovacao sinaliza baixa confianca.','Listar as aprovacoes atuais do fluxo e eliminar as que nao mitigam risco relevante.','medium',45,3),
('growth','Construir PDI para 100% do time','Sem plano individual, o desenvolvimento vira acaso.','Realizar uma sessao de PDI por pessoa e registrar metas de desenvolvimento na plataforma.','critical',45,1),
('growth','Trilha de aprendizagem da area','Conteudo generico nao endereca a lacuna tecnica real.','Publicar uma trilha com os modulos criticos da area e meta de conclusao trimestral.','high',60,2),
('growth','Programa de mentoria interna','Aprendizado entre pares acelera a curva sem custo externo.','Parear pessoas senior e junior com missoes de mentoria mensais acompanhadas na plataforma.','medium',90,3),
('leadership','Feedback 1:1 quinzenal','Feedback esparso e a principal causa de baixa percepcao de suporte da lideranca.','Agendar 1:1 recorrente de 30 minutos com pauta fixa: entregas, obstaculos e desenvolvimento.','critical',30,1),
('leadership','Capacitar lideres em conversas dificeis','Lideres despreparados evitam a conversa e o problema escala.','Treinamento pratico de 4 horas com role-play de feedback corretivo e escuta ativa.','high',45,2),
('leadership','Avaliacao ascendente da lideranca','O lider precisa de dado sobre o proprio impacto.','Aplicar ciclo de feedback do time para o lider com devolutiva estruturada e plano pessoal.','medium',60,3),
('peers','Acordo de convivencia do time','Regras implicitas geram atrito silencioso.','Facilitar workshop de 2 horas para definir acordos de comunicacao, prazos e respeito mutuo.','high',30,1),
('peers','Retrospectiva mensal sem culpados','Seguranca psicologica cresce quando o erro vira aprendizado.','Conduzir retrospectiva mensal focada em processo, com regra explicita de nao atribuicao de culpa.','high',45,2),
('peers','Rituais de integracao entre areas','Silos reduzem colaboracao e aumentam retrabalho.','Promover encontro mensal entre areas interdependentes para alinhar handoffs.','medium',60,3),
('purpose','Conectar entregas ao resultado do cliente','Sem linha de visao, o trabalho perde significado.','Abrir cada reuniao mensal apresentando o impacto concreto das entregas no cliente final.','high',30,1),
('purpose','Desdobrar a estrategia ate a tarefa','Alinhamento exige traducao do OKR corporativo para o dia a dia.','Desdobrar os OKRs da empresa em metas de area e vincula-las as tarefas da plataforma.','high',60,2),
('purpose','Comunicar conquistas da empresa','Orgulho de pertencer cresce com visibilidade dos resultados.','Publicar comunicado mensal com conquistas, novos clientes e marcos atingidos.','low',30,3),
('environment','Diagnostico de infraestrutura','Problemas fisicos e de equipamento corroem a experiencia diaria.','Aplicar checklist de infraestrutura por posto de trabalho e priorizar correcoes por criticidade.','high',30,1),
('environment','Plano de reposicao de equipamentos','Ferramenta inadequada reduz produtividade e motivacao.','Levantar equipamentos fora do ciclo de vida e montar cronograma de substituicao com orcamento.','medium',90,2),
('environment','Canal rapido de suporte interno','Chamados sem resposta ampliam a percepcao de descaso.','Definir SLA de atendimento interno e acompanhar o cumprimento semanalmente.','medium',45,3),
('communication','Comunicado semanal da lideranca','Informacao dispersa gera ruido e boato.','Publicar resumo semanal padronizado com decisoes, prioridades e proximos passos.','high',30,1),
('communication','Canal de escuta ativa','Escuta sem canal formal depende da iniciativa individual.','Ativar canal de opinioes com compromisso publico de resposta em ate 7 dias.','high',30,2),
('communication','Transparencia sobre decisoes dificeis','Silencio em momentos criticos destroi confianca.','Comunicar o contexto e o criterio das decisoes impopulares em reuniao aberta com espaco para perguntas.','critical',45,3),
('benefits','Pesquisa de percepcao de beneficios','Beneficio nao percebido nao gera valor.','Aplicar pesquisa curta sobre uso e utilidade de cada beneficio e repriorizar o pacote.','medium',30,1),
('benefits','Estudo de equidade salarial','Percepcao de desigualdade e um dos maiores geradores de turnover.','Rodar analise de faixas salariais por cargo e senioridade e corrigir distorcoes identificadas.','critical',90,2),
('benefits','Comunicar a remuneracao total','Colaboradores subestimam o valor do pacote quando nao ha demonstrativo.','Enviar demonstrativo individual de remuneracao total, incluindo beneficios e encargos.','low',45,3),
('balance','Redistribuir carga de trabalho','Sobrecarga cronica antecede afastamento e desligamento.','Mapear a carga por pessoa, identificar os sobrecarregados e redistribuir ou repriorizar demandas.','critical',30,1),
('balance','Politica de direito a desconexao','Contato fora do horario impede recuperacao real.','Formalizar politica de nao acionamento fora do expediente, com excecoes definidas e comunicadas.','high',45,2),
('balance','Programa de bem-estar continuo','Bem-estar exige rotina, nao acao pontual.','Implantar acoes mensais de bem-estar e acompanhar o humor do time pelos registros da plataforma.','medium',90,3)
ON CONFLICT (pillar, title) DO NOTHING;

-- 4) Geracao automatica do plano a partir de um fator critico
CREATE OR REPLACE FUNCTION public.generate_action_plan_from_factor(
  p_factor_key text,
  p_department_id uuid DEFAULT NULL,
  p_days integer DEFAULT 90
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_days integer := GREATEST(COALESCE(p_days, 90), 1);
  v_factor public.engagement_factors%ROWTYPE;
  v_score numeric(5,2);
  v_existing uuid;
  v_plan_id uuid;
  v_cursor date := CURRENT_DATE;
  v_item record;
  v_idx integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria';
  END IF;

  IF NOT (public.has_role(v_user, 'admin'::app_role) OR public.has_role(v_user, 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Apenas gestores e administradores podem gerar planos de acao';
  END IF;

  SELECT * INTO v_factor
  FROM public.engagement_factors
  WHERE key = p_factor_key AND is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fator de engajamento nao encontrado: %', p_factor_key;
  END IF;

  -- Idempotencia: nao duplicar plano vivo para o mesmo fator e area
  SELECT id INTO v_existing
  FROM public.action_plans
  WHERE engagement_factor_id = v_factor.id
    AND status IN ('planning', 'active', 'paused')
    AND department_id IS NOT DISTINCT FROM p_department_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT f.score INTO v_score
  FROM public.get_engagement_factor_scores(p_department_id, v_days) f
  WHERE f.factor_key = p_factor_key;

  INSERT INTO public.action_plans (
    title, description, pillar, engagement_factor_id, source, analysis_days,
    initial_score, target_score, current_score, root_cause_summary,
    target_date, department_id, owner_id, status
  ) VALUES (
    'Plano de acao: ' || v_factor.name,
    'Plano gerado automaticamente a partir do diagnostico de engajamento do fator "' || v_factor.name || '".',
    v_factor.pillar,
    v_factor.id,
    'engagement_factor',
    v_days,
    v_score,
    LEAST(10::numeric, COALESCE(v_score, 5) + 1.5),
    v_score,
    COALESCE(v_factor.description, v_factor.name) ||
      CASE WHEN v_score IS NULL
           THEN ' (sem score suficiente no periodo analisado).'
           ELSE ' (score atual: ' || v_score::text || ').' END,
    CURRENT_DATE + 90,
    p_department_id,
    v_user,
    'planning'
  )
  RETURNING id INTO v_plan_id;

  FOR v_item IN
    SELECT * FROM public.engagement_action_playbooks
    WHERE pillar = v_factor.pillar AND is_active
    ORDER BY order_index
  LOOP
    v_idx := v_idx + 1;
    INSERT INTO public.action_plan_items (
      plan_id, what_title, what_description, why_reason,
      when_start, when_end, who_responsible_id, how_method,
      priority, order_index, status
    ) VALUES (
      v_plan_id, v_item.title, v_item.how_method, v_item.why_reason,
      v_cursor, v_cursor + v_item.duration_days, v_user, v_item.how_method,
      v_item.priority, v_idx, 'pending'
    );
    v_cursor := v_cursor + GREATEST(v_item.duration_days / 2, 7);
  END LOOP;

  RETURN v_plan_id;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_action_plan_from_factor(text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_action_plan_from_factor(text, uuid, integer) TO authenticated;