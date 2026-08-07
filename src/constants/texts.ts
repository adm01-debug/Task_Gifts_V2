/**
 * Dashboard Text Constants
 * Centralized strings for potential i18n support
 */
export const DASHBOARD_TEXTS = {
  // Greetings
  greeting: (name: string) => `Olá, ${name}! 👋`,
  rankMessage: (rank: number) => `Você está no #${rank} lugar. Continue assim!`,
  noRankMessage: "Complete atividades para subir no ranking!",
  
  // User Menu
  userMenu: {
    profile: "Meu Perfil",
    logout: "Sair",
    logoutSuccess: "Até logo! 👋",
  },
  
  // Accessibility
  a11y: {
    openNavMenu: "Abrir menu de navegação",
    userMenu: "Menu do usuário",
    menuTitle: (name: string) => `Menu de ${name}`,
  },
  
  // Footer
  footer: {
    madeWith: "Feito com",
    by: "por Task Gifts",
    tagline: "Melhor que o Figma",
  },
} as const;

export const COMMON_TEXTS = {
  loading: "Carregando...",
  error: "Ocorreu um erro",
  retry: "Tentar novamente",
  save: "Salvar",
  cancel: "Cancelar",
  confirm: "Confirmar",
  delete: "Excluir",
  edit: "Editar",
  view: "Ver",
  close: "Fechar",
  search: "Buscar",
  filter: "Filtrar",
  noResults: "Nenhum resultado encontrado",
  seeMore: "Ver mais",
  seeLess: "Ver menos",
} as const;

export const GAMIFICATION_TEXTS = {
  xp: "XP",
  coins: "Moedas",
  level: "Nível",
  streak: "Sequência",
  rank: "Ranking",
  achievements: "Conquistas",
  quests: "Missões",
  rewards: "Recompensas",
} as const;
