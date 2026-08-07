/**
 * useSEO Hook
 * Provides SEO utilities and page-specific configurations
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface PageSEOConfig {
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * SEO configurations for each route
 */
const routeSEOConfig: Record<string, PageSEOConfig> = {
  '/': {
    title: 'Dashboard',
    description: 'Acompanhe seu progresso, conquistas e ranking na plataforma de gamificação corporativa.',
    keywords: ['dashboard', 'progresso', 'gamificação', 'XP', 'nível'],
  },
  '/conquistas': {
    title: 'Conquistas',
    description: 'Veja todas as suas conquistas desbloqueadas e descubra novas metas para alcançar.',
    keywords: ['conquistas', 'achievements', 'badges', 'medalhas', 'recompensas'],
  },
  '/metas': {
    title: 'Metas',
    description: 'Gerencie suas metas individuais e acompanhe o progresso dos resultados-chave.',
    keywords: ['metas', 'OKR', 'objetivos', 'resultados-chave', 'goals'],
  },
  '/ligas': {
    title: 'Ligas',
    description: 'Compete nas ligas semanais e suba no ranking para ganhar bônus de XP.',
    keywords: ['ligas', 'competição', 'ranking', 'semanal', 'XP bonus'],
  },
  '/trails': {
    title: 'Trilhas de Aprendizado',
    description: 'Explore trilhas de aprendizado e desenvolva novas habilidades com gamificação.',
    keywords: ['trilhas', 'aprendizado', 'cursos', 'módulos', 'certificações'],
  },
  '/quiz': {
    title: 'Quiz Diário',
    description: 'Teste seus conhecimentos no quiz diário e ganhe XP e moedas.',
    keywords: ['quiz', 'perguntas', 'conhecimento', 'diário', 'XP'],
  },
  '/loja': {
    title: 'Loja',
    description: 'Troque suas moedas por itens exclusivos e recompensas na loja virtual.',
    keywords: ['loja', 'shop', 'moedas', 'recompensas', 'itens'],
  },
  '/perfil': {
    title: 'Perfil',
    description: 'Visualize e edite seu perfil, avatar e configurações pessoais.',
    keywords: ['perfil', 'avatar', 'configurações', 'conta'],
  },
  '/duelos': {
    title: 'Duelos',
    description: 'Desafie colegas para duelos de XP e prove quem é o melhor.',
    keywords: ['duelos', 'desafios', 'versus', 'competição', 'XP'],
  },
  '/estatisticas': {
    title: 'Estatísticas',
    description: 'Analise suas estatísticas detalhadas e histórico de performance.',
    keywords: ['estatísticas', 'analytics', 'performance', 'histórico', 'dados'],
  },
  '/feed': {
    title: 'Feed Social',
    description: 'Acompanhe as atividades e conquistas da sua equipe em tempo real.',
    keywords: ['feed', 'social', 'equipe', 'atividades', 'comunidade'],
  },
  '/comunicados': {
    title: 'Comunicados',
    description: 'Leia os comunicados e novidades importantes da empresa.',
    keywords: ['comunicados', 'anúncios', 'notícias', 'empresa'],
  },
  '/mentoria': {
    title: 'Mentoria',
    description: 'Conecte-se com mentores e mentorados para desenvolvimento profissional.',
    keywords: ['mentoria', 'mentoring', 'desenvolvimento', 'carreira'],
  },
  '/checkins': {
    title: 'Check-ins',
    description: 'Realize check-ins 1:1 com seu gestor para alinhamento e feedback.',
    keywords: ['checkins', '1:1', 'feedback', 'gestor', 'alinhamento'],
  },
  '/pesquisas': {
    title: 'Pesquisas',
    description: 'Responda pesquisas de clima e eNPS para melhorar o ambiente de trabalho.',
    keywords: ['pesquisas', 'clima', 'eNPS', 'feedback', 'satisfação'],
  },
  '/ponto': {
    title: 'Ponto',
    description: 'Registre seu ponto e acompanhe sua assiduidade e pontualidade.',
    keywords: ['ponto', 'frequência', 'pontualidade', 'streak', 'assiduidade'],
  },
  '/auth': {
    title: 'Login',
    description: 'Acesse sua conta na plataforma de gamificação corporativa Task Gifts.',
    keywords: ['login', 'entrar', 'acessar', 'conta'],
  },
  '/admin': {
    title: 'Administração',
    description: 'Painel administrativo para gestão da plataforma de gamificação.',
    keywords: ['admin', 'administração', 'gestão', 'configurações'],
  },
};

/**
 * Hook to get SEO configuration for current page
 */
export function useSEO() {
  const location = useLocation();

  const config = useMemo(() => {
    // Try exact match first
    if (routeSEOConfig[location.pathname]) {
      return routeSEOConfig[location.pathname];
    }

    // Try to match base path (e.g., /trails/123 -> /trails)
    const basePath = '/' + location.pathname.split('/')[1];
    if (routeSEOConfig[basePath]) {
      return routeSEOConfig[basePath];
    }

    // Default config
    return {
      title: 'Task Gifts',
      description: 'Plataforma de gamificação e treinamento corporativo.',
      keywords: ['gamificação', 'treinamento', 'corporativo'],
    };
  }, [location.pathname]);

  return config;
}

/**
 * Generate canonical URL for current page
 */
export function useCanonicalUrl(baseUrl = 'https://taskgifts.app') {
  const location = useLocation();
  return useMemo(() => `${baseUrl}${location.pathname}`, [baseUrl, location.pathname]);
}

/**
 * Check if current page should be indexed
 */
export function useShouldIndex() {
  const location = useLocation();
  
  // Pages that should not be indexed
  const noIndexPaths = ['/admin', '/auth'];
  
  return useMemo(() => {
    return !noIndexPaths.some(path => location.pathname.startsWith(path));
  }, [location.pathname]);
}
