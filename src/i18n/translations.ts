/**
 * Internationalization (i18n) System
 * Provides translations for the entire application
 */

export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES';

export interface Translations {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    noResults: string;
    viewAll: string;
    close: string;
    submit: string;
    retry: string;
  };
  auth: {
    login: string;
    logout: string;
    signup: string;
    email: string;
    password: string;
    forgotPassword: string;
    resetPassword: string;
    confirmPassword: string;
    displayName: string;
    welcomeBack: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    loginSuccess: string;
    signupSuccess: string;
    logoutSuccess: string;
    invalidCredentials: string;
    emailRequired: string;
    passwordRequired: string;
    passwordMinLength: string;
    passwordRequirements: string;
  };
  navigation: {
    dashboard: string;
    profile: string;
    achievements: string;
    goals: string;
    leagues: string;
    trails: string;
    quiz: string;
    shop: string;
    socialFeed: string;
    announcements: string;
    settings: string;
    admin: string;
    help: string;
    duels: string;
    statistics: string;
    mentorship: string;
    checkins: string;
    surveys: string;
    attendance: string;
    feedback: string;
  };
  dashboard: {
    welcome: string;
    totalXp: string;
    currentStreak: string;
    ranking: string;
    questsCompleted: string;
    level: string;
    coins: string;
    weeklyProgress: string;
    recentActivity: string;
    teamFeed: string;
    leaderboard: string;
    quickActions: string;
    newQuest: string;
    challenge: string;
    event: string;
  };
  achievements: {
    title: string;
    unlocked: string;
    locked: string;
    progress: string;
    rarity: string;
    common: string;
    rare: string;
    epic: string;
    legendary: string;
    category: string;
    reward: string;
    xpReward: string;
    coinReward: string;
    viewDetails: string;
    newAchievement: string;
    congratulations: string;
  };
  goals: {
    title: string;
    createGoal: string;
    editGoal: string;
    deleteGoal: string;
    myGoals: string;
    teamGoals: string;
    completed: string;
    inProgress: string;
    notStarted: string;
    overdue: string;
    dueDate: string;
    priority: string;
    high: string;
    medium: string;
    low: string;
    description: string;
    keyResults: string;
    addKeyResult: string;
    updateProgress: string;
  };
  leagues: {
    title: string;
    currentLeague: string;
    weeklyXp: string;
    position: string;
    promotionZone: string;
    demotionZone: string;
    xpBonus: string;
    rankingsUpdate: string;
    viewHistory: string;
    noLeague: string;
    completeActivities: string;
    top: string;
    last: string;
  };
  trails: {
    title: string;
    myTrails: string;
    recommended: string;
    inProgress: string;
    completed: string;
    notStarted: string;
    modules: string;
    duration: string;
    difficulty: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    expert: string;
    startTrail: string;
    continueTrail: string;
    viewCertificate: string;
    progress: string;
  };
  quiz: {
    title: string;
    dailyQuiz: string;
    startQuiz: string;
    question: string;
    answer: string;
    correct: string;
    incorrect: string;
    score: string;
    streak: string;
    leaderboard: string;
    categories: string;
    difficulty: string;
    timeLeft: string;
    nextQuestion: string;
    results: string;
    tryAgain: string;
  };
  shop: {
    title: string;
    myCoins: string;
    buy: string;
    price: string;
    sold: string;
    outOfStock: string;
    categories: string;
    featured: string;
    new: string;
    sale: string;
    purchaseSuccess: string;
    insufficientCoins: string;
    confirmPurchase: string;
  };
  notifications: {
    title: string;
    markAllRead: string;
    noNotifications: string;
    newNotification: string;
    clearAll: string;
    settings: string;
    pushEnabled: string;
    pushDisabled: string;
    enablePush: string;
  };
  errors: {
    generic: string;
    network: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    timeout: string;
    validation: string;
    tryAgain: string;
    contactSupport: string;
  };
  empty: {
    noData: string;
    noResults: string;
    noItems: string;
    getStarted: string;
  };
  time: {
    now: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
    yearsAgo: string;
    remaining: string;
    expired: string;
    daysLeft: string;
    hoursLeft: string;
  };
}

export const translations: Record<SupportedLocale, Translations> = {
  'pt-BR': {
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      create: 'Criar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      noResults: 'Nenhum resultado encontrado',
      viewAll: 'Ver tudo',
      close: 'Fechar',
      submit: 'Enviar',
      retry: 'Tentar novamente',
    },
    auth: {
      login: 'Entrar',
      logout: 'Sair',
      signup: 'Cadastrar',
      email: 'E-mail',
      password: 'Senha',
      forgotPassword: 'Esqueci minha senha',
      resetPassword: 'Redefinir senha',
      confirmPassword: 'Confirmar senha',
      displayName: 'Nome de exibição',
      welcomeBack: 'Bem-vindo de volta!',
      createAccount: 'Criar conta',
      alreadyHaveAccount: 'Já tem uma conta?',
      dontHaveAccount: 'Não tem uma conta?',
      loginSuccess: 'Login realizado com sucesso!',
      signupSuccess: 'Conta criada com sucesso!',
      logoutSuccess: 'Logout realizado com sucesso!',
      invalidCredentials: 'Credenciais inválidas',
      emailRequired: 'E-mail é obrigatório',
      passwordRequired: 'Senha é obrigatória',
      passwordMinLength: 'A senha deve ter pelo menos 8 caracteres',
      passwordRequirements: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    },
    navigation: {
      dashboard: 'Painel',
      profile: 'Perfil',
      achievements: 'Conquistas',
      goals: 'Metas',
      leagues: 'Ligas',
      trails: 'Trilhas',
      quiz: 'Quiz',
      shop: 'Loja',
      socialFeed: 'Feed Social',
      announcements: 'Comunicados',
      settings: 'Configurações',
      admin: 'Administração',
      help: 'Ajuda',
      duels: 'Duelos',
      statistics: 'Estatísticas',
      mentorship: 'Mentoria',
      checkins: 'Check-ins',
      surveys: 'Pesquisas',
      attendance: 'Ponto',
      feedback: 'Feedback',
    },
    dashboard: {
      welcome: 'Bem-vindo',
      totalXp: 'XP Total',
      currentStreak: 'Streak Atual',
      ranking: 'Ranking',
      questsCompleted: 'Quests Completas',
      level: 'Nível',
      coins: 'Moedas',
      weeklyProgress: 'Progresso Semanal',
      recentActivity: 'Atividade Recente',
      teamFeed: 'Feed da Equipe',
      leaderboard: 'Classificação',
      quickActions: 'Ações Rápidas',
      newQuest: 'Nova Quest',
      challenge: 'Desafio',
      event: 'Evento',
    },
    achievements: {
      title: 'Conquistas',
      unlocked: 'Desbloqueada',
      locked: 'Bloqueada',
      progress: 'Progresso',
      rarity: 'Raridade',
      common: 'Comum',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Lendário',
      category: 'Categoria',
      reward: 'Recompensa',
      xpReward: 'XP de recompensa',
      coinReward: 'Moedas de recompensa',
      viewDetails: 'Ver detalhes',
      newAchievement: 'Nova conquista!',
      congratulations: 'Parabéns!',
    },
    goals: {
      title: 'Metas',
      createGoal: 'Criar meta',
      editGoal: 'Editar meta',
      deleteGoal: 'Excluir meta',
      myGoals: 'Minhas metas',
      teamGoals: 'Metas da equipe',
      completed: 'Concluída',
      inProgress: 'Em andamento',
      notStarted: 'Não iniciada',
      overdue: 'Atrasada',
      dueDate: 'Data limite',
      priority: 'Prioridade',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
      description: 'Descrição',
      keyResults: 'Resultados-chave',
      addKeyResult: 'Adicionar resultado-chave',
      updateProgress: 'Atualizar progresso',
    },
    leagues: {
      title: 'Ligas',
      currentLeague: 'Liga atual',
      weeklyXp: 'XP semanal',
      position: 'Posição',
      promotionZone: 'Zona de promoção',
      demotionZone: 'Zona de rebaixamento',
      xpBonus: 'Bônus de XP',
      rankingsUpdate: 'Rankings atualizam toda segunda-feira',
      viewHistory: 'Ver histórico',
      noLeague: 'Você ainda não está em uma liga',
      completeActivities: 'Complete atividades para entrar na competição!',
      top: 'Top',
      last: 'Últimos',
    },
    trails: {
      title: 'Trilhas de Aprendizado',
      myTrails: 'Minhas trilhas',
      recommended: 'Recomendadas',
      inProgress: 'Em andamento',
      completed: 'Concluída',
      notStarted: 'Não iniciada',
      modules: 'Módulos',
      duration: 'Duração',
      difficulty: 'Dificuldade',
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      expert: 'Especialista',
      startTrail: 'Iniciar trilha',
      continueTrail: 'Continuar trilha',
      viewCertificate: 'Ver certificado',
      progress: 'Progresso',
    },
    quiz: {
      title: 'Quiz',
      dailyQuiz: 'Quiz Diário',
      startQuiz: 'Iniciar quiz',
      question: 'Pergunta',
      answer: 'Resposta',
      correct: 'Correto!',
      incorrect: 'Incorreto',
      score: 'Pontuação',
      streak: 'Sequência',
      leaderboard: 'Ranking',
      categories: 'Categorias',
      difficulty: 'Dificuldade',
      timeLeft: 'Tempo restante',
      nextQuestion: 'Próxima pergunta',
      results: 'Resultados',
      tryAgain: 'Tentar novamente',
    },
    shop: {
      title: 'Loja',
      myCoins: 'Minhas moedas',
      buy: 'Comprar',
      price: 'Preço',
      sold: 'Vendido',
      outOfStock: 'Esgotado',
      categories: 'Categorias',
      featured: 'Destaque',
      new: 'Novo',
      sale: 'Promoção',
      purchaseSuccess: 'Compra realizada com sucesso!',
      insufficientCoins: 'Moedas insuficientes',
      confirmPurchase: 'Confirmar compra',
    },
    notifications: {
      title: 'Notificações',
      markAllRead: 'Marcar todas como lidas',
      noNotifications: 'Nenhuma notificação',
      newNotification: 'Nova notificação',
      clearAll: 'Limpar todas',
      settings: 'Configurações',
      pushEnabled: 'Notificações ativadas',
      pushDisabled: 'Notificações desativadas',
      enablePush: 'Ativar notificações',
    },
    errors: {
      generic: 'Algo deu errado',
      network: 'Erro de conexão',
      notFound: 'Não encontrado',
      unauthorized: 'Não autorizado',
      forbidden: 'Acesso negado',
      serverError: 'Erro no servidor',
      timeout: 'Tempo esgotado',
      validation: 'Erro de validação',
      tryAgain: 'Tentar novamente',
      contactSupport: 'Entre em contato com o suporte',
    },
    empty: {
      noData: 'Nenhum dado disponível',
      noResults: 'Nenhum resultado encontrado',
      noItems: 'Nenhum item',
      getStarted: 'Começar',
    },
    time: {
      now: 'Agora',
      minutesAgo: 'minutos atrás',
      hoursAgo: 'horas atrás',
      daysAgo: 'dias atrás',
      weeksAgo: 'semanas atrás',
      monthsAgo: 'meses atrás',
      yearsAgo: 'anos atrás',
      remaining: 'restantes',
      expired: 'Expirado',
      daysLeft: 'dias restantes',
      hoursLeft: 'horas restantes',
    },
  },
  'en-US': {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      noResults: 'No results found',
      viewAll: 'View all',
      close: 'Close',
      submit: 'Submit',
      retry: 'Retry',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password',
      resetPassword: 'Reset password',
      confirmPassword: 'Confirm password',
      displayName: 'Display name',
      welcomeBack: 'Welcome back!',
      createAccount: 'Create account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      loginSuccess: 'Login successful!',
      signupSuccess: 'Account created successfully!',
      logoutSuccess: 'Logout successful!',
      invalidCredentials: 'Invalid credentials',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordRequirements: 'Password must contain uppercase, lowercase, numbers and special characters',
    },
    navigation: {
      dashboard: 'Dashboard',
      profile: 'Profile',
      achievements: 'Achievements',
      goals: 'Goals',
      leagues: 'Leagues',
      trails: 'Learning Trails',
      quiz: 'Quiz',
      shop: 'Shop',
      socialFeed: 'Social Feed',
      announcements: 'Announcements',
      settings: 'Settings',
      admin: 'Admin',
      help: 'Help',
      duels: 'Duels',
      statistics: 'Statistics',
      mentorship: 'Mentorship',
      checkins: 'Check-ins',
      surveys: 'Surveys',
      attendance: 'Attendance',
      feedback: 'Feedback',
    },
    dashboard: {
      welcome: 'Welcome',
      totalXp: 'Total XP',
      currentStreak: 'Current Streak',
      ranking: 'Ranking',
      questsCompleted: 'Quests Completed',
      level: 'Level',
      coins: 'Coins',
      weeklyProgress: 'Weekly Progress',
      recentActivity: 'Recent Activity',
      teamFeed: 'Team Feed',
      leaderboard: 'Leaderboard',
      quickActions: 'Quick Actions',
      newQuest: 'New Quest',
      challenge: 'Challenge',
      event: 'Event',
    },
    achievements: {
      title: 'Achievements',
      unlocked: 'Unlocked',
      locked: 'Locked',
      progress: 'Progress',
      rarity: 'Rarity',
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
      category: 'Category',
      reward: 'Reward',
      xpReward: 'XP reward',
      coinReward: 'Coin reward',
      viewDetails: 'View details',
      newAchievement: 'New achievement!',
      congratulations: 'Congratulations!',
    },
    goals: {
      title: 'Goals',
      createGoal: 'Create goal',
      editGoal: 'Edit goal',
      deleteGoal: 'Delete goal',
      myGoals: 'My goals',
      teamGoals: 'Team goals',
      completed: 'Completed',
      inProgress: 'In progress',
      notStarted: 'Not started',
      overdue: 'Overdue',
      dueDate: 'Due date',
      priority: 'Priority',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      description: 'Description',
      keyResults: 'Key results',
      addKeyResult: 'Add key result',
      updateProgress: 'Update progress',
    },
    leagues: {
      title: 'Leagues',
      currentLeague: 'Current league',
      weeklyXp: 'Weekly XP',
      position: 'Position',
      promotionZone: 'Promotion zone',
      demotionZone: 'Demotion zone',
      xpBonus: 'XP bonus',
      rankingsUpdate: 'Rankings update every Monday',
      viewHistory: 'View history',
      noLeague: "You're not in a league yet",
      completeActivities: 'Complete activities to join the competition!',
      top: 'Top',
      last: 'Last',
    },
    trails: {
      title: 'Learning Trails',
      myTrails: 'My trails',
      recommended: 'Recommended',
      inProgress: 'In progress',
      completed: 'Completed',
      notStarted: 'Not started',
      modules: 'Modules',
      duration: 'Duration',
      difficulty: 'Difficulty',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert',
      startTrail: 'Start trail',
      continueTrail: 'Continue trail',
      viewCertificate: 'View certificate',
      progress: 'Progress',
    },
    quiz: {
      title: 'Quiz',
      dailyQuiz: 'Daily Quiz',
      startQuiz: 'Start quiz',
      question: 'Question',
      answer: 'Answer',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      score: 'Score',
      streak: 'Streak',
      leaderboard: 'Leaderboard',
      categories: 'Categories',
      difficulty: 'Difficulty',
      timeLeft: 'Time left',
      nextQuestion: 'Next question',
      results: 'Results',
      tryAgain: 'Try again',
    },
    shop: {
      title: 'Shop',
      myCoins: 'My coins',
      buy: 'Buy',
      price: 'Price',
      sold: 'Sold',
      outOfStock: 'Out of stock',
      categories: 'Categories',
      featured: 'Featured',
      new: 'New',
      sale: 'Sale',
      purchaseSuccess: 'Purchase successful!',
      insufficientCoins: 'Insufficient coins',
      confirmPurchase: 'Confirm purchase',
    },
    notifications: {
      title: 'Notifications',
      markAllRead: 'Mark all as read',
      noNotifications: 'No notifications',
      newNotification: 'New notification',
      clearAll: 'Clear all',
      settings: 'Settings',
      pushEnabled: 'Notifications enabled',
      pushDisabled: 'Notifications disabled',
      enablePush: 'Enable notifications',
    },
    errors: {
      generic: 'Something went wrong',
      network: 'Connection error',
      notFound: 'Not found',
      unauthorized: 'Unauthorized',
      forbidden: 'Access denied',
      serverError: 'Server error',
      timeout: 'Timeout',
      validation: 'Validation error',
      tryAgain: 'Try again',
      contactSupport: 'Contact support',
    },
    empty: {
      noData: 'No data available',
      noResults: 'No results found',
      noItems: 'No items',
      getStarted: 'Get started',
    },
    time: {
      now: 'Now',
      minutesAgo: 'minutes ago',
      hoursAgo: 'hours ago',
      daysAgo: 'days ago',
      weeksAgo: 'weeks ago',
      monthsAgo: 'months ago',
      yearsAgo: 'years ago',
      remaining: 'remaining',
      expired: 'Expired',
      daysLeft: 'days left',
      hoursLeft: 'hours left',
    },
  },
  'es-ES': {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      search: 'Buscar',
      filter: 'Filtrar',
      noResults: 'No se encontraron resultados',
      viewAll: 'Ver todo',
      close: 'Cerrar',
      submit: 'Enviar',
      retry: 'Reintentar',
    },
    auth: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      signup: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: 'Olvidé mi contraseña',
      resetPassword: 'Restablecer contraseña',
      confirmPassword: 'Confirmar contraseña',
      displayName: 'Nombre de usuario',
      welcomeBack: '¡Bienvenido de nuevo!',
      createAccount: 'Crear cuenta',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      dontHaveAccount: '¿No tienes una cuenta?',
      loginSuccess: '¡Inicio de sesión exitoso!',
      signupSuccess: '¡Cuenta creada exitosamente!',
      logoutSuccess: '¡Cierre de sesión exitoso!',
      invalidCredentials: 'Credenciales inválidas',
      emailRequired: 'El correo es obligatorio',
      passwordRequired: 'La contraseña es obligatoria',
      passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
      passwordRequirements: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    },
    navigation: {
      dashboard: 'Panel',
      profile: 'Perfil',
      achievements: 'Logros',
      goals: 'Metas',
      leagues: 'Ligas',
      trails: 'Rutas de aprendizaje',
      quiz: 'Quiz',
      shop: 'Tienda',
      socialFeed: 'Feed social',
      announcements: 'Anuncios',
      settings: 'Configuración',
      admin: 'Administración',
      help: 'Ayuda',
      duels: 'Duelos',
      statistics: 'Estadísticas',
      mentorship: 'Mentoría',
      checkins: 'Check-ins',
      surveys: 'Encuestas',
      attendance: 'Asistencia',
      feedback: 'Feedback',
    },
    dashboard: {
      welcome: 'Bienvenido',
      totalXp: 'XP Total',
      currentStreak: 'Racha actual',
      ranking: 'Ranking',
      questsCompleted: 'Misiones completadas',
      level: 'Nivel',
      coins: 'Monedas',
      weeklyProgress: 'Progreso semanal',
      recentActivity: 'Actividad reciente',
      teamFeed: 'Feed del equipo',
      leaderboard: 'Clasificación',
      quickActions: 'Acciones rápidas',
      newQuest: 'Nueva misión',
      challenge: 'Desafío',
      event: 'Evento',
    },
    achievements: {
      title: 'Logros',
      unlocked: 'Desbloqueado',
      locked: 'Bloqueado',
      progress: 'Progreso',
      rarity: 'Rareza',
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
      category: 'Categoría',
      reward: 'Recompensa',
      xpReward: 'XP de recompensa',
      coinReward: 'Monedas de recompensa',
      viewDetails: 'Ver detalles',
      newAchievement: '¡Nuevo logro!',
      congratulations: '¡Felicitaciones!',
    },
    goals: {
      title: 'Metas',
      createGoal: 'Crear meta',
      editGoal: 'Editar meta',
      deleteGoal: 'Eliminar meta',
      myGoals: 'Mis metas',
      teamGoals: 'Metas del equipo',
      completed: 'Completada',
      inProgress: 'En progreso',
      notStarted: 'No iniciada',
      overdue: 'Atrasada',
      dueDate: 'Fecha límite',
      priority: 'Prioridad',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
      description: 'Descripción',
      keyResults: 'Resultados clave',
      addKeyResult: 'Agregar resultado clave',
      updateProgress: 'Actualizar progreso',
    },
    leagues: {
      title: 'Ligas',
      currentLeague: 'Liga actual',
      weeklyXp: 'XP semanal',
      position: 'Posición',
      promotionZone: 'Zona de ascenso',
      demotionZone: 'Zona de descenso',
      xpBonus: 'Bono de XP',
      rankingsUpdate: 'Los rankings se actualizan cada lunes',
      viewHistory: 'Ver historial',
      noLeague: 'Aún no estás en una liga',
      completeActivities: '¡Completa actividades para unirte a la competencia!',
      top: 'Top',
      last: 'Últimos',
    },
    trails: {
      title: 'Rutas de Aprendizaje',
      myTrails: 'Mis rutas',
      recommended: 'Recomendadas',
      inProgress: 'En progreso',
      completed: 'Completada',
      notStarted: 'No iniciada',
      modules: 'Módulos',
      duration: 'Duración',
      difficulty: 'Dificultad',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
      startTrail: 'Iniciar ruta',
      continueTrail: 'Continuar ruta',
      viewCertificate: 'Ver certificado',
      progress: 'Progreso',
    },
    quiz: {
      title: 'Quiz',
      dailyQuiz: 'Quiz Diario',
      startQuiz: 'Iniciar quiz',
      question: 'Pregunta',
      answer: 'Respuesta',
      correct: '¡Correcto!',
      incorrect: 'Incorrecto',
      score: 'Puntuación',
      streak: 'Racha',
      leaderboard: 'Clasificación',
      categories: 'Categorías',
      difficulty: 'Dificultad',
      timeLeft: 'Tiempo restante',
      nextQuestion: 'Siguiente pregunta',
      results: 'Resultados',
      tryAgain: 'Intentar de nuevo',
    },
    shop: {
      title: 'Tienda',
      myCoins: 'Mis monedas',
      buy: 'Comprar',
      price: 'Precio',
      sold: 'Vendido',
      outOfStock: 'Agotado',
      categories: 'Categorías',
      featured: 'Destacado',
      new: 'Nuevo',
      sale: 'Oferta',
      purchaseSuccess: '¡Compra exitosa!',
      insufficientCoins: 'Monedas insuficientes',
      confirmPurchase: 'Confirmar compra',
    },
    notifications: {
      title: 'Notificaciones',
      markAllRead: 'Marcar todas como leídas',
      noNotifications: 'Sin notificaciones',
      newNotification: 'Nueva notificación',
      clearAll: 'Limpiar todas',
      settings: 'Configuración',
      pushEnabled: 'Notificaciones activadas',
      pushDisabled: 'Notificaciones desactivadas',
      enablePush: 'Activar notificaciones',
    },
    errors: {
      generic: 'Algo salió mal',
      network: 'Error de conexión',
      notFound: 'No encontrado',
      unauthorized: 'No autorizado',
      forbidden: 'Acceso denegado',
      serverError: 'Error del servidor',
      timeout: 'Tiempo agotado',
      validation: 'Error de validación',
      tryAgain: 'Intentar de nuevo',
      contactSupport: 'Contactar soporte',
    },
    empty: {
      noData: 'Sin datos disponibles',
      noResults: 'No se encontraron resultados',
      noItems: 'Sin elementos',
      getStarted: 'Comenzar',
    },
    time: {
      now: 'Ahora',
      minutesAgo: 'minutos atrás',
      hoursAgo: 'horas atrás',
      daysAgo: 'días atrás',
      weeksAgo: 'semanas atrás',
      monthsAgo: 'meses atrás',
      yearsAgo: 'años atrás',
      remaining: 'restantes',
      expired: 'Expirado',
      daysLeft: 'días restantes',
      hoursLeft: 'horas restantes',
    },
  },
};

export const defaultLocale: SupportedLocale = 'pt-BR';
