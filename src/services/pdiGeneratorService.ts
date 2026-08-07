import { supabase } from "@/integrations/supabase/client";
import { BOX_LABELS } from "./nineBoxService";

interface PDITemplate {
  title: string;
  description: string;
  actions: {
    title: string;
    description: string;
    action_type: string;
    priority: string;
    xp_reward: number;
  }[];
}

// Templates de PDI baseados na posição 9-Box
const PDI_TEMPLATES: Record<number, PDITemplate> = {
  1: {
    // Iceberg - Baixo Desempenho / Baixo Potencial
    title: "Plano de Melhoria Intensiva",
    description: "Foco em desenvolvimento de competências básicas e melhoria de performance",
    actions: [
      { title: "Treinamento básico obrigatório", description: "Completar todos os treinamentos fundamentais da função", action_type: "training", priority: "high", xp_reward: 100 },
      { title: "Acompanhamento semanal com gestor", description: "Check-ins semanais para alinhar expectativas e progresso", action_type: "mentoring", priority: "high", xp_reward: 50 },
      { title: "Metas de curto prazo", description: "Definir e atingir 3 metas SMART em 30 dias", action_type: "goal", priority: "high", xp_reward: 150 },
    ],
  },
  2: {
    // Dilema - Médio Desempenho / Baixo Potencial
    title: "Plano de Consolidação",
    description: "Fortalecer competências atuais e explorar novas áreas de atuação",
    actions: [
      { title: "Especialização técnica", description: "Aprofundar conhecimento na área de atuação atual", action_type: "training", priority: "medium", xp_reward: 120 },
      { title: "Mentoria de pares", description: "Ser mentorado por colega de alto desempenho", action_type: "mentoring", priority: "medium", xp_reward: 80 },
      { title: "Projeto de melhoria", description: "Liderar um projeto de melhoria de processos", action_type: "project", priority: "medium", xp_reward: 200 },
    ],
  },
  3: {
    // Profissional de Confiança - Alto Desempenho / Baixo Potencial
    title: "Plano de Expertise",
    description: "Reconhecer expertise e desenvolver papel de referência técnica",
    actions: [
      { title: "Documentar conhecimento", description: "Criar documentação e guias para a equipe", action_type: "project", priority: "medium", xp_reward: 150 },
      { title: "Mentoria reversa", description: "Ser mentor técnico de novos colaboradores", action_type: "mentoring", priority: "low", xp_reward: 100 },
      { title: "Certificação avançada", description: "Obter certificação de especialista na área", action_type: "certification", priority: "medium", xp_reward: 250 },
    ],
  },
  4: {
    // Enigma - Baixo Desempenho / Médio Potencial
    title: "Plano de Desbloqueio",
    description: "Identificar barreiras e liberar potencial latente",
    actions: [
      { title: "Avaliação de fit", description: "Analisar adequação de cargo e responsabilidades", action_type: "assessment", priority: "high", xp_reward: 50 },
      { title: "Coaching individual", description: "Sessões de coaching para desenvolvimento pessoal", action_type: "coaching", priority: "high", xp_reward: 120 },
      { title: "Job rotation", description: "Experimentar atuação em área diferente por 30 dias", action_type: "experience", priority: "medium", xp_reward: 200 },
    ],
  },
  5: {
    // Mantenedor - Médio Desempenho / Médio Potencial
    title: "Plano de Crescimento Contínuo",
    description: "Manter engajamento e desenvolver para próximo nível",
    actions: [
      { title: "Treinamento de liderança básica", description: "Desenvolver soft skills de liderança", action_type: "training", priority: "medium", xp_reward: 150 },
      { title: "Participar de projetos cross-funcionais", description: "Ampliar visão através de projetos multidisciplinares", action_type: "project", priority: "medium", xp_reward: 180 },
      { title: "Feedback 360°", description: "Realizar ciclo completo de feedback para autoconhecimento", action_type: "assessment", priority: "low", xp_reward: 100 },
    ],
  },
  6: {
    // Forte Desempenho - Alto Desempenho / Médio Potencial
    title: "Plano de Desenvolvimento de Liderança",
    description: "Preparar para assumir responsabilidades maiores",
    actions: [
      { title: "Programa de liderança", description: "Participar do programa de desenvolvimento de líderes", action_type: "training", priority: "high", xp_reward: 200 },
      { title: "Liderar squad temporário", description: "Assumir liderança de equipe em projeto específico", action_type: "experience", priority: "high", xp_reward: 250 },
      { title: "Mentoria executiva", description: "Ser mentorado por líder sênior da organização", action_type: "mentoring", priority: "medium", xp_reward: 150 },
    ],
  },
  7: {
    // Diamante Bruto - Baixo Desempenho / Alto Potencial
    title: "Plano de Lapidação",
    description: "Desenvolver rapidamente para manifestar alto potencial",
    actions: [
      { title: "Programa acelerado de desenvolvimento", description: "Trilha intensiva de capacitação", action_type: "training", priority: "high", xp_reward: 200 },
      { title: "Acompanhamento intensivo", description: "Check-ins 2x por semana com gestor e RH", action_type: "mentoring", priority: "high", xp_reward: 100 },
      { title: "Projeto desafiador", description: "Assumir projeto de alta visibilidade", action_type: "project", priority: "high", xp_reward: 300 },
      { title: "Coaching executivo", description: "Sessões com coach externo especializado", action_type: "coaching", priority: "medium", xp_reward: 180 },
    ],
  },
  8: {
    // Futuro Líder - Médio Desempenho / Alto Potencial
    title: "Plano de Aceleração de Carreira",
    description: "Preparar para posições de liderança em curto prazo",
    actions: [
      { title: "MBA/Pós-graduação", description: "Apoio para formação executiva", action_type: "training", priority: "high", xp_reward: 300 },
      { title: "Substituição de gestor", description: "Assumir temporariamente papel de liderança", action_type: "experience", priority: "high", xp_reward: 250 },
      { title: "Networking estratégico", description: "Participar de eventos e fóruns de liderança", action_type: "experience", priority: "medium", xp_reward: 150 },
      { title: "Projeto estratégico", description: "Liderar iniciativa estratégica da empresa", action_type: "project", priority: "high", xp_reward: 350 },
    ],
  },
  9: {
    // Estrela - Alto Desempenho / Alto Potencial
    title: "Plano de Retenção e Sucessão",
    description: "Manter engajamento, preparar para C-level e garantir retenção",
    actions: [
      { title: "Executive coaching", description: "Programa de coaching para executivos", action_type: "coaching", priority: "high", xp_reward: 300 },
      { title: "Plano de sucessão", description: "Participar ativamente do plano de sucessão", action_type: "experience", priority: "high", xp_reward: 200 },
      { title: "Representar empresa externamente", description: "Palestras, eventos e representação institucional", action_type: "experience", priority: "medium", xp_reward: 250 },
      { title: "Mentoria de outros talentos", description: "Ser mentor de colaboradores de alto potencial", action_type: "mentoring", priority: "medium", xp_reward: 180 },
      { title: "Projeto de inovação", description: "Liderar iniciativa de inovação ou transformação", action_type: "project", priority: "high", xp_reward: 400 },
    ],
  },
};

export const pdiGeneratorService = {
  async generatePDIFromNineBox(
    userId: string,
    boxPosition: number,
    evaluationId: string,
    createdBy: string,
    developmentAreas?: string[]
  ) {
    const template = PDI_TEMPLATES[boxPosition];
    if (!template) throw new Error("Invalid box position");

    const boxLabel = BOX_LABELS[boxPosition];
    
    // Create the development plan
    const { data: plan, error: planError } = await supabase
      .from("development_plans")
      .insert({
        user_id: userId,
        created_by: createdBy,
        title: template.title,
        description: `${template.description}\n\nBaseado na avaliação 9-Box: ${boxLabel.name} - ${boxLabel.description}${developmentAreas?.length ? `\n\nÁreas de desenvolvimento identificadas: ${developmentAreas.join(", ")}` : ""}`,
        linked_nine_box_id: evaluationId,
        status: "active",
        start_date: new Date().toISOString(),
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select()
      .single();

    if (planError) throw planError;

    // Create the actions
    const actions = template.actions.map((action, index) => ({
      plan_id: plan.id,
      title: action.title,
      description: action.description,
      action_type: action.action_type,
      priority: action.priority,
      xp_reward: action.xp_reward,
      status: "pending",
      progress_percent: 0,
      due_date: new Date(Date.now() + (30 + index * 15) * 24 * 60 * 60 * 1000).toISOString(), // Staggered deadlines
    }));

    const { error: actionsError } = await supabase
      .from("development_plan_actions")
      .insert(actions);

    if (actionsError) throw actionsError;

    return plan;
  },

  getTemplatePreview(boxPosition: number) {
    return PDI_TEMPLATES[boxPosition] || null;
  },
};
