 import { BehavioralBadge } from "./types";
 
 export const BEHAVIORAL_BADGES: BehavioralBadge[] = [
   // === FEEDBACK CHAMPION ===
   {
     key: "feedback_champion_bronze",
     name: "Feedback Champion Bronze",
     description: "Deu 10 feedbacks construtivos",
     icon: "MessageSquare",
     category: "feedback",
     rarity: "common",
     xpReward: 50,
     coinReward: 25,
     condition: (m) => m.feedbacksGiven >= 10
   },
   {
     key: "feedback_champion_silver",
     name: "Feedback Champion Prata",
     description: "Deu 50 feedbacks construtivos",
     icon: "MessageSquare",
     category: "feedback",
     rarity: "rare",
     xpReward: 150,
     coinReward: 75,
     condition: (m) => m.feedbacksGiven >= 50
   },
   {
     key: "feedback_champion_gold",
     name: "Feedback Champion Ouro",
     description: "Deu 100 feedbacks construtivos",
     icon: "MessageSquare",
     category: "feedback",
     rarity: "epic",
     xpReward: 300,
     coinReward: 150,
     condition: (m) => m.feedbacksGiven >= 100
   },
   // === CHECKIN MASTER ===
   {
     key: "checkin_regular",
     name: "Check-in Regular",
     description: "Completou 4 semanas seguidas de check-ins",
     icon: "CalendarCheck",
     category: "engagement",
     rarity: "common",
     xpReward: 75,
     coinReward: 40,
     condition: (m) => m.consecutiveCheckinsWeeks >= 4
   },
   {
     key: "checkin_dedicated",
     name: "Check-in Dedicado",
     description: "Completou 12 semanas seguidas de check-ins",
     icon: "CalendarCheck",
     category: "engagement",
     rarity: "rare",
     xpReward: 200,
     coinReward: 100,
     condition: (m) => m.consecutiveCheckinsWeeks >= 12
   },
   {
     key: "checkin_master",
     name: "Mestre do Check-in",
     description: "Completou 52 semanas seguidas de check-ins (1 ano!)",
     icon: "CalendarCheck",
     category: "engagement",
     rarity: "legendary",
     xpReward: 1000,
     coinReward: 500,
     condition: (m) => m.consecutiveCheckinsWeeks >= 52
   },
   // === PULSE RESPONDER ===
   {
     key: "pulse_voice",
     name: "Voz Ativa",
     description: "Respondeu 20 pulses de sentimento",
     icon: "Heart",
     category: "engagement",
     rarity: "common",
     xpReward: 50,
     coinReward: 25,
     condition: (m) => m.pulsesResponded >= 20
   },
   {
     key: "pulse_consistent",
     name: "Pulso Constante",
     description: "Respondeu pulses por 8 semanas seguidas",
     icon: "Activity",
     category: "engagement",
     rarity: "rare",
     xpReward: 150,
     coinReward: 75,
     condition: (m) => m.consecutivePulsesWeeks >= 8
   },
   // === 1-ON-1 CHAMPION ===
   {
     key: "one_on_one_starter",
     name: "Comunicador Iniciante",
     description: "Participou de 5 reuniões 1-on-1",
     icon: "Users",
     category: "communication",
     rarity: "common",
     xpReward: 50,
     coinReward: 25,
     condition: (m) => m.oneOnOnesAttended >= 5
   },
   {
     key: "one_on_one_pro",
     name: "Comunicador Pro",
     description: "Participou de 25 reuniões 1-on-1",
     icon: "Users",
     category: "communication",
     rarity: "rare",
     xpReward: 200,
     coinReward: 100,
     condition: (m) => m.oneOnOnesAttended >= 25
   },
   {
     key: "one_on_one_master",
     name: "Mestre da Comunicação",
     description: "Participou de 100 reuniões 1-on-1",
     icon: "Users",
     category: "communication",
     rarity: "epic",
     xpReward: 400,
     coinReward: 200,
     condition: (m) => m.oneOnOnesAttended >= 100
   },
   // === GOAL CRUSHER ===
   {
     key: "goal_first",
     name: "Primeiro Objetivo",
     description: "Completou seu primeiro objetivo",
     icon: "Target",
     category: "performance",
     rarity: "common",
     xpReward: 50,
     coinReward: 25,
     condition: (m) => m.goalsCompleted >= 1
   },
   {
     key: "goal_crusher",
     name: "Destruidor de Metas",
     description: "Completou 10 objetivos",
     icon: "Target",
     category: "performance",
     rarity: "rare",
     xpReward: 250,
     coinReward: 125,
     condition: (m) => m.goalsCompleted >= 10
   },
   {
     key: "goal_perfectionist",
     name: "Perfeccionista",
     description: "Manteve 100% dos objetivos em dia por 30 dias",
     icon: "Award",
     category: "performance",
     rarity: "epic",
     xpReward: 500,
     coinReward: 250,
     condition: (m) => m.totalGoals > 0 && m.goalsOnTrack === m.totalGoals
   },
   // === LIFELONG LEARNER ===
   {
     key: "learner_curious",
     name: "Curioso",
     description: "Completou 3 cursos",
     icon: "BookOpen",
     category: "learning",
     rarity: "common",
     xpReward: 75,
     coinReward: 40,
     condition: (m) => m.coursesCompleted >= 3
   },
   {
     key: "learner_dedicated",
     name: "Estudante Dedicado",
     description: "Completou 10 cursos",
     icon: "GraduationCap",
     category: "learning",
     rarity: "rare",
     xpReward: 200,
     coinReward: 100,
     condition: (m) => m.coursesCompleted >= 10
   },
   {
     key: "learner_master",
     name: "Mestre do Conhecimento",
     description: "Completou 25 cursos",
     icon: "Trophy",
     category: "learning",
     rarity: "epic",
     xpReward: 500,
     coinReward: 250,
     condition: (m) => m.coursesCompleted >= 25
   },
   // === PDI CHAMPION ===
   {
     key: "pdi_starter",
     name: "Desenvolvedor Iniciante",
     description: "Completou 3 ações do PDI",
     icon: "TrendingUp",
     category: "development",
     rarity: "common",
     xpReward: 75,
     coinReward: 40,
     condition: (m) => m.pdiActionsCompleted >= 3
   },
   {
     key: "pdi_dedicated",
     name: "Desenvolvedor Dedicado",
     description: "Completou 10 ações do PDI",
     icon: "TrendingUp",
     category: "development",
     rarity: "rare",
     xpReward: 200,
     coinReward: 100,
     condition: (m) => m.pdiActionsCompleted >= 10
   },
   {
     key: "pdi_transformed",
     name: "Transformação Pessoal",
     description: "Completou 25 ações do PDI",
     icon: "Sparkles",
     category: "development",
     rarity: "epic",
     xpReward: 400,
     coinReward: 200,
     condition: (m) => m.pdiActionsCompleted >= 25
   },
   // === SOCIAL BUTTERFLY ===
   {
     key: "social_starter",
     name: "Social Iniciante",
     description: "Criou 5 posts no feed social",
     icon: "Share2",
     category: "social",
     rarity: "common",
     xpReward: 50,
     coinReward: 25,
     condition: (m) => m.socialPostsCreated >= 5
   },
   {
     key: "social_influencer",
     name: "Influenciador",
     description: "Criou 25 posts e deu 100 reações",
     icon: "Star",
     category: "social",
     rarity: "rare",
     xpReward: 200,
     coinReward: 100,
     condition: (m) => m.socialPostsCreated >= 25 && m.socialReactionsGiven >= 100
   },
   // === EARLY BIRD ===
   {
     key: "early_bird",
     name: "Madrugador",
     description: "Fez check-in antes das 8h por 10 dias",
     icon: "Sunrise",
     category: "lifestyle",
     rarity: "rare",
     xpReward: 150,
     coinReward: 75,
     condition: (m) => m.earlyCheckins >= 10
   },
   // === NIGHT OWL ===
   {
     key: "night_owl",
     name: "Coruja Noturna",
     description: "Atividade após as 22h por 10 dias",
     icon: "Moon",
     category: "lifestyle",
     rarity: "rare",
     xpReward: 100,
     coinReward: 50,
     condition: (m) => m.lateNightActivity >= 10
   },
   // === MENTOR ===
   {
     key: "mentor_starter",
     name: "Mentor Iniciante",
     description: "Conduziu 3 sessões de mentoria",
     icon: "Lightbulb",
     category: "mentorship",
     rarity: "rare",
     xpReward: 200,
     coinReward: 100,
     condition: (m) => m.mentorSessions >= 3
   },
   {
     key: "mentor_master",
     name: "Mentor Master",
     description: "Conduziu 20 sessões de mentoria",
     icon: "Crown",
     category: "mentorship",
     rarity: "legendary",
     xpReward: 750,
     coinReward: 375,
     condition: (m) => m.mentorSessions >= 20
   },
   // === HELPER ===
   {
     key: "helpful_hand",
     name: "Mão Amiga",
     description: "Fez 20 comentários construtivos",
     icon: "HandHeart",
     category: "social",
     rarity: "common",
     xpReward: 75,
     coinReward: 40,
     condition: (m) => m.helpfulComments >= 20
   },
    },
    // === AI COACH APPRENTICE ===
    {
      key: "ai_coach_apprentice",
      name: "Aprendiz de IA",
      description: "Interagiu 10 vezes com o AI Coach",
      icon: "Sparkles",
      category: "learning",
      rarity: "common",
      xpReward: 100,
      coinReward: 50,
      condition: (m) => (m as any).aiCoachInteractions >= 10
    },
    {
      key: "ai_coach_enthusiast",
      name: "Entusiasta de IA",
      description: "Interagiu 50 vezes com o AI Coach",
      icon: "Sparkles",
      category: "learning",
      rarity: "rare",
      xpReward: 300,
      coinReward: 150,
      condition: (m) => (m as any).aiCoachInteractions >= 50
    },
  ];