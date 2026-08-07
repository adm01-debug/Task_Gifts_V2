import { supabase } from "@/integrations/supabase/client";
import { PROFILE_SAFE_COLUMNS } from "@/services/profilesService";

export interface OneOnOneContext {
  employee: {
    id: string;
    name: string;
    avatar_url?: string;
    level?: number;
    xp?: number;
    department?: string;
    position?: string;
  };
  lastCheckin: {
    date: string;
    mood: number;
    notes?: string;
    actionItems: { text: string; completed: boolean }[];
  } | null;
  recentPulses: {
    date: string;
    mood: number;
    comment?: string;
  }[];
  goals: {
    title: string;
    progress: number;
    status: string;
  }[];
  pdiProgress: {
    planTitle: string;
    completedActions: number;
    totalActions: number;
    overdueActions: number;
  } | null;
  recentKudos: {
    message: string;
    from: string;
    date: string;
  }[];
  nineBoxPosition?: {
    performance: number;
    potential: number;
    quadrant: string;
  };
  competencyGaps: string[];
  churnRisk?: {
    score: number;
    factors: string[];
  };
}

export interface SuggestedAgenda {
  priority: 'high' | 'medium' | 'low';
  topic: string;
  duration: number;
  reason: string;
  questions: string[];
}

export interface OneOnOnePreparation {
  context: OneOnOneContext;
  suggestedAgenda: SuggestedAgenda[];
  talkingPoints: string[];
  warningFlags: string[];
  positiveHighlights: string[];
  followUpFromLast: string[];
}

interface ProfileWithRelations {
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  department_id?: string | null;
  position_id?: string | null;
}

interface GoalRecord {
  title: string;
  progress_percent: number | null;
  status: string;
  is_active?: boolean;
}

interface PlanActionRecord {
  competency_id: string | null;
  title: string | null;
  status: string;
  due_date: string | null;
}

interface KudosRecord {
  message: string;
  created_at: string;
}

interface MoodEntry {
  created_at: string;
  mood_score: number;
  note: string | null;
}

export const oneOnOnePreparationService = {
  async getEmployeeContext(employeeId: string): Promise<OneOnOneContext> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch employee profile
    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_SAFE_COLUMNS)
      .eq("id", employeeId)
      .maybeSingle();

    // Fetch last completed checkin
    const { data: lastCheckin } = await supabase
      .from("checkins")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch recent mood entries (pulses)
    const { data: pulses } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", employeeId);
    const typedGoals = goalsData as GoalRecord[] | null;
    const goals = (typedGoals || []).filter((g) => g.is_active !== false);

    // Fetch PDI
    const { data: pdiData } = await supabase
      .from("development_plans")
      .select("*")
      .eq("user_id", employeeId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    const pdi = pdiData?.[0];
    let pdiActions: PlanActionRecord[] = [];
    if (pdi) {
      const { data: actions } = await supabase
        .from("development_plan_actions")
        .select("*")
        .eq("plan_id", pdi.id);
      pdiActions = (actions || []) as PlanActionRecord[];
    }

    // Fetch recent kudos
    const { data: kudos } = await supabase
      .from("kudos")
      .select("message, created_at, from_user_id")
      .eq("to_user_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch 9-box evaluation
    const { data: nineBox } = await supabase
      .from("nine_box_evaluations")
      .select("*")
      .eq("user_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get competency gaps from development plan actions
    const competencyGaps: string[] = [];
    pdiActions.forEach((a) => {
      if (a.competency_id && a.status !== 'completed') {
        competencyGaps.push(a.title || "Competência a desenvolver");
      }
    });

    const typedKudos = kudos || [];
    const typedPulses = (pulses || []) as MoodEntry[];

    // Fetch display names for kudos senders
    const kudosWithNames = await Promise.all(
      typedKudos.map(async (k) => {
        let fromName = "Alguém";
        if (k.from_user_id) {
          const { data: fromProfile } = await supabase.from("profiles").select("display_name").eq("id", k.from_user_id).maybeSingle();
          fromName = fromProfile?.display_name || "Alguém";
        }
        return { message: k.message, from: fromName, date: k.created_at };
      })
    );

    // Build context
    const context: OneOnOneContext = {
      employee: {
        id: employeeId,
        name: profile?.display_name || "Colaborador",
        avatar_url: profile?.avatar_url ?? undefined,
        level: profile?.level,
        xp: profile?.xp,
      },
      lastCheckin: lastCheckin ? {
        date: lastCheckin.completed_at || lastCheckin.scheduled_at,
        mood: lastCheckin.mood_rating || 3,
        notes: lastCheckin.notes ?? undefined,
        actionItems: (lastCheckin.action_items as { text: string; completed: boolean }[]) || [],
      } : null,
      recentPulses: typedPulses.map((p) => ({
        date: p.created_at,
        mood: p.mood_score,
        comment: p.note ?? undefined,
      })),
      goals: goals.map((g) => ({
        title: g.title,
        progress: g.progress_percent || 0,
        status: g.status,
      })),
      pdiProgress: pdi ? {
        planTitle: pdi.title,
        completedActions: pdiActions.filter((a) => a.status === 'completed').length,
        totalActions: pdiActions.length,
        overdueActions: pdiActions.filter((a) => 
          a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()
        ).length,
      } : null,
      recentKudos: kudosWithNames,
      nineBoxPosition: nineBox ? {
        performance: nineBox.performance_score,
        potential: nineBox.potential_score,
        quadrant: getQuadrantName(nineBox.performance_score, nineBox.potential_score),
      } : undefined,
      competencyGaps,
    };

    return context;
  },

  generatePreparation(context: OneOnOneContext): OneOnOnePreparation {
    const suggestedAgenda: SuggestedAgenda[] = [];
    const talkingPoints: string[] = [];
    const warningFlags: string[] = [];
    const positiveHighlights: string[] = [];
    const followUpFromLast: string[] = [];

    // Analyze mood trends
    const recentMoods = context.recentPulses.slice(0, 5);
    const avgMood = recentMoods.length > 0 
      ? recentMoods.reduce((acc, p) => acc + p.mood, 0) / recentMoods.length 
      : 3;
    const moodTrend = recentMoods.length >= 2 
      ? recentMoods[0].mood - recentMoods[recentMoods.length - 1].mood 
      : 0;

    // 1. Well-being check (priority if mood is low)
    if (avgMood < 3 || moodTrend < -1) {
      suggestedAgenda.push({
        priority: 'high',
        topic: "Bem-estar e Sentimentos",
        duration: 10,
        reason: `Humor médio recente: ${avgMood.toFixed(1)}/5${moodTrend < -1 ? ' (tendência de queda)' : ''}`,
        questions: [
          "Como você está se sentindo ultimamente?",
          "O que está te preocupando no trabalho?",
          "Há algo que eu possa fazer para ajudar?",
          "Como está seu equilíbrio trabalho-vida pessoal?",
        ],
      });
      warningFlags.push(`⚠️ Humor baixo nas últimas semanas (média: ${avgMood.toFixed(1)}/5)`);

      // Check for concerning comments
      const negativeComments = context.recentPulses.filter(p => p.comment && p.mood <= 2);
      if (negativeComments.length > 0) {
        warningFlags.push(`⚠️ Comentários preocupantes: "${negativeComments[0].comment}"`);
      }
    }

    // 2. Follow up from last checkin
    if (context.lastCheckin) {
      const pendingActions = context.lastCheckin.actionItems.filter(a => !a.completed);
      if (pendingActions.length > 0) {
        suggestedAgenda.push({
          priority: 'medium',
          topic: "Acompanhamento de Ações",
          duration: 5,
          reason: `${pendingActions.length} ação(ões) pendente(s) do último 1:1`,
          questions: pendingActions.map(a => `Como está o progresso em: "${a.text}"?`),
        });
        pendingActions.forEach(a => followUpFromLast.push(a.text));
      }

      // Check time since last checkin
      const daysSinceLastCheckin = Math.floor(
        (new Date().getTime() - new Date(context.lastCheckin.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastCheckin > 14) {
        warningFlags.push(`⚠️ ${daysSinceLastCheckin} dias desde o último 1:1`);
      }
    }

    // 3. Goals/OKRs at risk
    const goalsAtRisk = context.goals.filter(g => {
      const expectedProgress = getExpectedProgress();
      return g.progress < expectedProgress - 20;
    });
    if (goalsAtRisk.length > 0) {
      suggestedAgenda.push({
        priority: 'high',
        topic: "OKRs em Risco",
        duration: 10,
        reason: `${goalsAtRisk.length} meta(s) abaixo do esperado`,
        questions: [
          ...goalsAtRisk.map(g => `"${g.title}" está em ${g.progress}%. Quais são os bloqueios?`),
          "Precisamos ajustar alguma meta?",
          "Que suporte você precisa para atingir?",
        ],
      });
      goalsAtRisk.forEach(g => warningFlags.push(`🎯 Meta em risco: "${g.title}" (${g.progress}%)`));
    }

    // 4. PDI progress
    if (context.pdiProgress) {
      const pdiCompletion = context.pdiProgress.totalActions > 0 
        ? (context.pdiProgress.completedActions / context.pdiProgress.totalActions) * 100 
        : 0;
      
      if (context.pdiProgress.overdueActions > 0) {
        suggestedAgenda.push({
          priority: 'medium',
          topic: "Plano de Desenvolvimento",
          duration: 10,
          reason: `${context.pdiProgress.overdueActions} ação(ões) atrasada(s) no PDI`,
          questions: [
            "Está conseguindo dedicar tempo ao seu desenvolvimento?",
            "Quais ações estão bloqueadas?",
            "Precisamos repriorizar algo?",
          ],
        });
        warningFlags.push(`📚 PDI com ${context.pdiProgress.overdueActions} ação(ões) atrasada(s)`);
      } else if (pdiCompletion >= 80) {
        positiveHighlights.push(`🌟 PDI ${pdiCompletion.toFixed(0)}% concluído!`);
      }
    }

    // 5. Competency gaps
    if (context.competencyGaps.length > 0) {
      suggestedAgenda.push({
        priority: 'low',
        topic: "Desenvolvimento de Competências",
        duration: 5,
        reason: `Gaps identificados: ${context.competencyGaps.slice(0, 3).join(", ")}`,
        questions: [
          "Como você avalia seu progresso nessas competências?",
          "Há treinamentos que gostaria de fazer?",
        ],
      });
      talkingPoints.push(`Gaps a desenvolver: ${context.competencyGaps.join(", ")}`);
    }

    // 6. Recognition and kudos
    if (context.recentKudos.length > 0) {
      positiveHighlights.push(`👏 ${context.recentKudos.length} reconhecimento(s) recente(s)`);
      context.recentKudos.slice(0, 2).forEach(k => {
        positiveHighlights.push(`  - "${k.message}" (por ${k.from})`);
      });
    }

    // 7. Career/Growth conversation (periodic)
    if (!suggestedAgenda.some(a => a.topic.includes("Carreira"))) {
      suggestedAgenda.push({
        priority: 'low',
        topic: "Crescimento e Carreira",
        duration: 10,
        reason: "Conversa periódica sobre desenvolvimento",
        questions: [
          "Como você se vê daqui a 1 ano?",
          "Há projetos que gostaria de participar?",
          "O que te motiva no trabalho?",
        ],
      });
    }

    // 8. 9-Box insights
    if (context.nineBoxPosition) {
      const quadrant = context.nineBoxPosition.quadrant;
      if (quadrant === "Top Talent" || quadrant === "High Potential") {
        positiveHighlights.push(`⭐ Posição 9-Box: ${quadrant}`);
        talkingPoints.push("Discutir oportunidades de crescimento acelerado");
      } else if (quadrant === "Under Performer" || quadrant === "Risk") {
        warningFlags.push(`⚠️ Posição 9-Box: ${quadrant} - considerar PIP ou suporte intensivo`);
      }
    }

    // Sort agenda by priority
    suggestedAgenda.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Generate talking points
    if (avgMood >= 4) {
      talkingPoints.push("Colaborador demonstra bom humor - aproveitar para desafios maiores");
    }
    if (context.goals.filter(g => g.progress >= 100).length > 0) {
      talkingPoints.push("Celebrar metas atingidas!");
    }

    return {
      context,
      suggestedAgenda,
      talkingPoints,
      warningFlags,
      positiveHighlights,
      followUpFromLast,
    };
  },

  async prepareOneOnOne(employeeId: string): Promise<OneOnOnePreparation> {
    const context = await this.getEmployeeContext(employeeId);
    return this.generatePreparation(context);
  },
};

function getQuadrantName(performance: number, potential: number): string {
  if (potential >= 4 && performance >= 4) return "Top Talent";
  if (potential >= 4 && performance >= 2.5) return "High Potential";
  if (potential >= 4 && performance < 2.5) return "Inconsistent Talent";
  if (potential >= 2.5 && performance >= 4) return "High Performer";
  if (potential >= 2.5 && performance >= 2.5) return "Core Player";
  if (potential >= 2.5 && performance < 2.5) return "Dilemma";
  if (potential < 2.5 && performance >= 4) return "Solid Performer";
  if (potential < 2.5 && performance >= 2.5) return "Under Performer";
  return "Risk";
}

function getExpectedProgress(): number {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  const totalDays = (quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24);
  return (elapsedDays / totalDays) * 100;
}
