 import { supabase } from "@/integrations/supabase/client";
 import { logger } from "./loggingService";

export interface AutoChallenge {
  id: string;
  type: "feedback" | "learning" | "checkin" | "kudos" | "goal" | "streak" | "pdi";
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  xp_reward: number;
  coin_reward: number;
  expires_at: string;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
}

// Challenge templates that rotate weekly
const CHALLENGE_TEMPLATES: Omit<AutoChallenge, "id" | "current" | "expires_at" | "is_active">[] = [
  // Feedback challenges
  {
    type: "feedback",
    title: "Semana do Feedback",
    description: "Envie 3 feedbacks construtivos para colegas",
    icon: "💬",
    target: 3,
    xp_reward: 50,
    coin_reward: 25,
    difficulty: "easy",
  },
  {
    type: "feedback",
    title: "Mestre do Feedback",
    description: "Envie 5 feedbacks para diferentes pessoas",
    icon: "🎯",
    target: 5,
    xp_reward: 100,
    coin_reward: 50,
    difficulty: "medium",
  },
  
  // Learning challenges
  {
    type: "learning",
    title: "Aprendiz Dedicado",
    description: "Complete 2 módulos de trilhas de aprendizado",
    icon: "📚",
    target: 2,
    xp_reward: 75,
    coin_reward: 30,
    difficulty: "easy",
  },
  {
    type: "learning",
    title: "Maratona do Conhecimento",
    description: "Complete 5 módulos de trilhas",
    icon: "🧠",
    target: 5,
    xp_reward: 150,
    coin_reward: 75,
    difficulty: "hard",
  },
  
  // Check-in challenges
  {
    type: "checkin",
    title: "Presente & Pontual",
    description: "Faça check-in pontual 5 dias seguidos",
    icon: "⏰",
    target: 5,
    xp_reward: 80,
    coin_reward: 40,
    difficulty: "medium",
  },
  
  // Kudos challenges
  {
    type: "kudos",
    title: "Reconhecedor",
    description: "Dê 3 kudos para colegas",
    icon: "⭐",
    target: 3,
    xp_reward: 45,
    coin_reward: 20,
    difficulty: "easy",
  },
  {
    type: "kudos",
    title: "Embaixador da Gratidão",
    description: "Dê 7 kudos durante a semana",
    icon: "🌟",
    target: 7,
    xp_reward: 120,
    coin_reward: 60,
    difficulty: "hard",
  },
  
  // Goal challenges
  {
    type: "goal",
    title: "Foco nos Resultados",
    description: "Atualize o progresso de 2 OKRs",
    icon: "🎯",
    target: 2,
    xp_reward: 60,
    coin_reward: 30,
    difficulty: "easy",
  },
  
  // Streak challenges
  {
    type: "streak",
    title: "Fogo Ardente",
    description: "Mantenha um streak de 7 dias",
    icon: "🔥",
    target: 7,
    xp_reward: 100,
    coin_reward: 50,
    difficulty: "medium",
  },
  
  // PDI challenges
  {
    type: "pdi",
    title: "Desenvolvedor Pessoal",
    description: "Complete 1 ação do seu PDI",
    icon: "📈",
    target: 1,
    xp_reward: 70,
    coin_reward: 35,
    difficulty: "medium",
  },
];

// Service for auto-generated challenges
export const autoChallengesService = {
  // Generate weekly challenges for a user
  async generateWeeklyChallenges(userId: string): Promise<AutoChallenge[]> {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay())); // End of week
    weekEnd.setHours(23, 59, 59, 999);

    // Select 3-4 random challenges based on user activity
    const selectedTemplates = this.selectChallengesForUser(CHALLENGE_TEMPLATES);

    return selectedTemplates.map((template, index) => ({
      ...template,
      id: `challenge-${userId}-${Date.now()}-${index}`,
      current: 0,
      expires_at: weekEnd.toISOString(),
      is_active: true,
    }));
  },

  // Select challenges based on user patterns (mix of difficulties)
  selectChallengesForUser(
    templates: typeof CHALLENGE_TEMPLATES
  ): typeof CHALLENGE_TEMPLATES {
    // Ensure variety - 1 easy, 1 medium, 1 hard (or medium if no hard available)
    const easy = templates.filter((t) => t.difficulty === "easy");
    const medium = templates.filter((t) => t.difficulty === "medium");
    const hard = templates.filter((t) => t.difficulty === "hard");

    const selected: typeof CHALLENGE_TEMPLATES = [];

    // Pick 1 easy
    if (easy.length > 0) {
      selected.push(easy[Math.floor(Math.random() * easy.length)]);
    }

    // Pick 1-2 medium
    if (medium.length > 0) {
      selected.push(medium[Math.floor(Math.random() * medium.length)]);
    }

    // Pick 1 hard
    if (hard.length > 0) {
      selected.push(hard[Math.floor(Math.random() * hard.length)]);
    }

    return selected;
  },

   // Get user's current challenges from DB
   async getCurrentChallenges(userId: string): Promise<AutoChallenge[]> {
     const { data, error } = await supabase
       .from("user_challenges")
       .select("*")
       .eq("user_id", userId)
       .eq("is_active", true)
       .gte("expires_at", new Date().toISOString());
 
     if (error) {
       logger.apiError("Error fetching challenges", error, "autoChallengesService");
       return [];
     }
 
     if (data && data.length > 0) {
       return data as AutoChallenge[];
     }
 
     // Generate new challenges if none found or expired
     const newChallenges = await this.generateWeeklyChallenges(userId);
     
     // Clean up old active challenges first
     await supabase
       .from("user_challenges")
       .update({ is_active: false })
       .eq("user_id", userId)
       .eq("is_active", true);
 
     const { data: inserted, error: insertError } = await supabase
       .from("user_challenges")
       .insert(newChallenges.map(c => ({
         ...c,
         user_id: userId,
         id: undefined // Let DB generate UUID if applicable or keep custom ID
       })))
       .select();
 
     if (insertError) {
       logger.apiError("Error inserting new challenges", insertError, "autoChallengesService");
       return newChallenges; // Fallback to memory for session
     }
 
     return inserted as AutoChallenge[];
   },
 
   // Update challenge progress
   async updateChallengeProgress(
     userId: string,
     challengeType: AutoChallenge["type"],
     increment: number = 1
   ): Promise<{ challenge: AutoChallenge | null; completed: boolean }> {
     const { data: challenges, error } = await supabase
       .from("user_challenges")
       .select("*")
       .eq("user_id", userId)
       .eq("type", challengeType)
       .eq("is_active", true);
 
     const activeChallenge = (challenges || []).find(c => c.current < c.target);
 
     if (!activeChallenge) {
       return { challenge: null, completed: false };
     }
 
     const newCurrent = Math.min(activeChallenge.current + increment, activeChallenge.target);
     const completed = newCurrent >= activeChallenge.target;
 
     const { data: updated, error: updateError } = await supabase
       .from("user_challenges")
       .update({
         current: newCurrent,
         is_active: !completed,
         completed_at: completed ? new Date().toISOString() : null
       })
       .eq("id", activeChallenge.id)
       .select()
       .single();
 
     if (updateError) {
       logger.apiError("Error updating challenge progress", updateError, "autoChallengesService");
       return { challenge: null, completed: false };
     }
 
     return { challenge: updated as AutoChallenge, completed };
   },

  // Get challenge progress stats
  getChallengeStats(challenges: AutoChallenge[]): {
    total: number;
    completed: number;
    inProgress: number;
    totalXpPossible: number;
    earnedXp: number;
  } {
    const completed = challenges.filter((c) => c.current >= c.target);
    const inProgress = challenges.filter(
      (c) => c.current < c.target && c.is_active
    );

    return {
      total: challenges.length,
      completed: completed.length,
      inProgress: inProgress.length,
      totalXpPossible: challenges.reduce((acc, c) => acc + c.xp_reward, 0),
      earnedXp: completed.reduce((acc, c) => acc + c.xp_reward, 0),
    };
  },

   // Reset challenges (for testing)
   async resetChallenges(userId: string): Promise<void> {
     await supabase
       .from("user_challenges")
       .update({ is_active: false })
       .eq("user_id", userId);
   },
};
