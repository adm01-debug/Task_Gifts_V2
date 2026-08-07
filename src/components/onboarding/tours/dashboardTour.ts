import { Tour } from "@/contexts/OnboardingTourContext";

export const dashboardTour: Tour = {
  id: "dashboard-tour",
  name: "Tour do Dashboard",
  description: "Conheça as principais funcionalidades do seu painel",
  route: "/",
  triggerOnFirstVisit: true,
  steps: [
    {
      id: "welcome",
      target: "[data-tour='stats-grid']",
      title: "Bem-vindo ao Dashboard! 🎉",
      content: "Este é o seu painel principal. Aqui você acompanha todo o seu progresso, conquistas e atividades da equipe.",
      placement: "center",
    },
    {
      id: "stats",
      target: "[data-tour='stats-grid']",
      title: "Suas Estatísticas",
      content: "Veja seu nível, XP, moedas e posição no ranking em tempo real. Cada ação no sistema gera recompensas!",
      placement: "bottom",
      spotlightPadding: 16,
    },
    {
      id: "quick-actions",
      target: "[data-tour='quick-actions']",
      title: "Ações Rápidas",
      content: "Acesse rapidamente as funcionalidades mais usadas: criar metas, registrar humor, enviar kudos e mais.",
      placement: "bottom",
    },
    {
      id: "micro-quests",
      target: "[data-tour='micro-quests']",
      title: "Micro Quests ⚡",
      content: "Tarefas rápidas de 2-5 minutos! Perfeitas para ganhar XP nos intervalos. Complete várias ao longo do dia!",
      placement: "right",
    },
    {
      id: "missions",
      target: "[data-tour='missions']",
      title: "Missões do Dia",
      content: "Complete missões diárias para ganhar XP bônus e manter sua streak ativa. Quanto maior a streak, mais recompensas!",
      placement: "right",
    },
    {
      id: "quests",
      target: "[data-tour='quests']",
      title: "Quests Ativas",
      content: "Quests são desafios maiores com recompensas especiais. Complete-as para subir de nível mais rápido!",
      placement: "right",
    },
    {
      id: "lucky-drops",
      target: "[data-tour='lucky-drop']",
      title: "Lucky Drops 🎁",
      content: "Clique para tentar a sorte! Drops aleatórios podem dar XP, moedas, badges ou multiplicadores. Tente sua sorte!",
      placement: "bottom",
    },
    {
      id: "streak-tracker",
      target: "[data-tour='streak-tracker']",
      title: "Streak de Fogo 🔥",
      content: "Mantenha sua sequência ativa! Quanto mais dias seguidos você participar, maiores as recompensas e multiplicadores.",
      placement: "left",
    },
    {
      id: "daily-challenges",
      target: "[data-tour='daily-challenges']",
      title: "Desafios Diários 🎯",
      content: "Complete desafios diários para ganhar XP e moedas extras! Novos desafios são gerados todos os dias.",
      placement: "left",
    },
    {
      id: "leaderboard",
      target: "[data-tour='leaderboard']",
      title: "Ranking & Ligas",
      content: "Veja sua posição no ranking e acompanhe a competição saudável com seus colegas. Suba de liga para ganhar badges exclusivos!",
      placement: "left",
    },
    {
      id: "sidebar",
      target: "[data-tour='sidebar']",
      title: "Menu de Navegação",
      content: "Use o menu lateral para acessar todas as áreas: Metas, Trilhas de Aprendizado, Loja, Perfil e muito mais.",
      placement: "right",
    },
    {
      id: "complete",
      target: "[data-tour='user-menu']",
      title: "Tudo Pronto! 🚀",
      content: "Você está pronto para começar! Explore o sistema, complete missões e ganhe recompensas. Boa jornada!",
      placement: "bottom",
    },
  ],
};

export const goalsTour: Tour = {
  id: "goals-tour",
  name: "Tour de Metas",
  description: "Aprenda a criar e gerenciar suas metas",
  route: "/goals",
  steps: [
    {
      id: "goals-intro",
      target: "[data-tour='goals-header']",
      title: "Sistema de Metas",
      content: "Defina metas pessoais e profissionais. Cada meta concluída gera XP e ajuda no seu desenvolvimento.",
      placement: "bottom",
    },
    {
      id: "create-goal",
      target: "[data-tour='create-goal-btn']",
      title: "Criar Nova Meta",
      content: "Clique aqui para criar uma nova meta. Defina título, prazo, prioridade e as recompensas serão calculadas automaticamente.",
      placement: "bottom",
    },
    {
      id: "goal-progress",
      target: "[data-tour='goal-progress']",
      title: "Acompanhe o Progresso",
      content: "Veja o progresso de cada meta e atualize conforme avança. Metas com prazos próximos são destacadas.",
      placement: "right",
    },
  ],
};

export const trailsTour: Tour = {
  id: "trails-tour",
  name: "Tour de Trilhas",
  description: "Descubra as trilhas de aprendizado",
  route: "/trails",
  steps: [
    {
      id: "trails-intro",
      target: "[data-tour='trails-grid']",
      title: "Trilhas de Aprendizado",
      content: "Trilhas são caminhos estruturados de desenvolvimento. Cada trilha contém módulos com conteúdos e avaliações.",
      placement: "bottom",
    },
    {
      id: "trail-progress",
      target: "[data-tour='trail-card']",
      title: "Progresso nas Trilhas",
      content: "Veja quanto falta para concluir cada trilha e ganhar o certificado. Trilhas concluídas desbloqueiam badges especiais!",
      placement: "right",
    },
  ],
};

export const allTours = [dashboardTour, goalsTour, trailsTour];
