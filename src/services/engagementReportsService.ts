import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CompletionTrendData {
  month: string;
  completed: number;
  started: number;
  abandoned: number;
}

export interface DepartmentPerformanceData {
  name: string;
  completion: number;
  avgTime: number;
  engagement: number;
}

export interface QuestDifficultyData {
  name: string;
  value: number;
  color: string;
}

export interface WeeklyEngagementData {
  day: string;
  hours: number;
  quests: number;
}

export interface TopQuestData {
  id: string;
  name: string;
  completions: number;
  avgTime: string;
  rating: number;
}

export interface StrugglingAreaData {
  name: string;
  dropRate: number;
  avgAttempts: number;
  difficulty: string;
}

export interface EngagementMetrics {
  totalTrainingHours: number;
  avgCompletionRate: number;
  totalCertifications: number;
  engagementScore: number;
}

const difficultyColors: Record<string, string> = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#f97316",
  expert: "#ef4444"
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  expert: "Expert"
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const engagementReportsService = {
  // Get completion trend data for the last N months
  async getCompletionTrend(months: number = 6): Promise<CompletionTrendData[]> {
    const result: CompletionTrendData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      // Get enrollments started in this month
      const { count: started } = await supabase
        .from("trail_enrollments")
        .select("*", { count: "exact", head: true })
        .gte("started_at", monthStart.toISOString())
        .lte("started_at", monthEnd.toISOString());

      // Get enrollments completed in this month
      const { count: completed } = await supabase
        .from("trail_enrollments")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", monthStart.toISOString())
        .lte("completed_at", monthEnd.toISOString())
        .not("completed_at", "is", null);

      // Get quest assignments started but not completed (abandoned approximation)
      const { count: questsStarted } = await supabase
        .from("quest_assignments")
        .select("*", { count: "exact", head: true })
        .gte("started_at", monthStart.toISOString())
        .lte("started_at", monthEnd.toISOString());

      const { count: questsCompleted } = await supabase
        .from("quest_assignments")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", monthStart.toISOString())
        .lte("completed_at", monthEnd.toISOString())
        .not("completed_at", "is", null);

      const abandoned = Math.max(0, (questsStarted || 0) - (questsCompleted || 0));

      result.push({
        month: format(date, "MMM", { locale: ptBR }),
        completed: completed || 0,
        started: started || 0,
        abandoned: Math.round(abandoned * 0.3), // Estimate 30% of incomplete as truly abandoned
      });
    }

    return result;
  },

  // Get department performance metrics
  async getDepartmentPerformance(): Promise<DepartmentPerformanceData[]> {
    // Get departments
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name");

    if (!departments || departments.length === 0) return [];

    const result: DepartmentPerformanceData[] = [];

    for (const dept of departments) {
      // Get team members
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("department_id", dept.id);

      const userIds = members?.map(m => m.user_id) || [];
      if (userIds.length === 0) continue;

      // Get total and completed enrollments
      const { count: totalEnrollments } = await supabase
        .from("trail_enrollments")
        .select("*", { count: "exact", head: true })
        .in("user_id", userIds);

      const { count: completedEnrollments } = await supabase
        .from("trail_enrollments")
        .select("*", { count: "exact", head: true })
        .in("user_id", userIds)
        .not("completed_at", "is", null);

      // Get attendance punctuality as engagement proxy
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("is_punctual")
        .in("user_id", userIds);

      const punctualCount = attendance?.filter(a => a.is_punctual).length || 0;
      const engagementRate = attendance?.length ? Math.round((punctualCount / attendance.length) * 100) : 0;

      // Calculate avg time (estimate based on module completions)
      const { data: moduleProgress } = await supabase
        .from("module_progress")
        .select("completed_at, started_at")
        .in("user_id", userIds)
        .not("completed_at", "is", null);

      const avgTimeHours = moduleProgress?.length
        ? moduleProgress.reduce((acc, mp) => {
            if (mp.started_at && mp.completed_at) {
              const diff = new Date(mp.completed_at).getTime() - new Date(mp.started_at).getTime();
              return acc + diff / (1000 * 60 * 60);
            }
            return acc;
          }, 0) / moduleProgress.length
        : 0;

      const completionRate = totalEnrollments ? Math.round((completedEnrollments || 0) / totalEnrollments * 100) : 0;

      result.push({
        name: dept.name,
        completion: completionRate,
        avgTime: Math.round(avgTimeHours * 10) / 10 || 2.5,
        engagement: engagementRate,
      });
    }

    return result;
  },

  // Get quest difficulty distribution
  async getQuestDifficultyDistribution(): Promise<QuestDifficultyData[]> {
    const { data: quests } = await supabase
      .from("custom_quests")
      .select("difficulty")
      .eq("status", "active");

    const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0, expert: 0 };
    const total = quests?.length || 0;

    quests?.forEach(q => {
      if (q.difficulty in counts) {
        counts[q.difficulty]++;
      }
    });

    return Object.entries(counts).map(([key, count]) => ({
      name: difficultyLabels[key] || key,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: difficultyColors[key] || "#888",
    }));
  },

  // Get weekly engagement pattern
  async getWeeklyEngagement(): Promise<WeeklyEngagementData[]> {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const result: WeeklyEngagementData[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Count quest completions
      const { count: questCount } = await supabase
        .from("quest_assignments")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", dayStart.toISOString())
        .lte("completed_at", dayEnd.toISOString())
        .not("completed_at", "is", null);

      // Count module completions
      const { count: moduleCount } = await supabase
        .from("module_progress")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", dayStart.toISOString())
        .lte("completed_at", dayEnd.toISOString())
        .not("completed_at", "is", null);

      // Estimate hours (15 min per activity)
      const totalActivities = (questCount || 0) + (moduleCount || 0);
      const hours = Math.round(totalActivities * 0.25 * 10) / 10;

      result.push({
        day: weekDays[i],
        hours,
        quests: questCount || 0,
      });
    }

    return result;
  },

  // Get top quests by completions
  async getTopQuests(limit: number = 5): Promise<TopQuestData[]> {
    // Get all assignments grouped by quest
    const { data: assignments } = await supabase
      .from("quest_assignments")
      .select("quest_id, completed_at, started_at")
      .not("completed_at", "is", null);

    if (!assignments || assignments.length === 0) return [];

    // Count completions per quest
    const questStats: Record<string, { completions: number; totalTime: number }> = {};
    assignments.forEach(a => {
      if (!questStats[a.quest_id]) {
        questStats[a.quest_id] = { completions: 0, totalTime: 0 };
      }
      questStats[a.quest_id].completions++;
      if (a.started_at && a.completed_at) {
        const diff = new Date(a.completed_at).getTime() - new Date(a.started_at).getTime();
        questStats[a.quest_id].totalTime += diff;
      }
    });

    // Get top quests by completions
    const topQuestIds = Object.entries(questStats)
      .sort((a, b) => b[1].completions - a[1].completions)
      .slice(0, limit)
      .map(([id]) => id);

    if (topQuestIds.length === 0) return [];

    // Get quest details
    const { data: quests } = await supabase
      .from("custom_quests")
      .select("id, title")
      .in("id", topQuestIds);

    return topQuestIds.map(id => {
      const quest = quests?.find(q => q.id === id);
      const stats = questStats[id];
      const avgTimeMs = stats.completions > 0 ? stats.totalTime / stats.completions : 0;
      const avgTimeHours = avgTimeMs / (1000 * 60 * 60);

      return {
        id,
        name: quest?.title || "Quest Desconhecida",
        completions: stats.completions,
        avgTime: avgTimeHours > 0 ? `${avgTimeHours.toFixed(1)}h` : "N/A",
         rating: stats.completions > 0 ? Math.min(5, 3.5 + (stats.completions / 10) * 0.5) : 0,
      };
    });
  },

  // Get struggling areas (high abandonment)
  async getStrugglingAreas(): Promise<StrugglingAreaData[]> {
    // Get quests with assignments
    const { data: quests } = await supabase
      .from("custom_quests")
      .select("id, title, difficulty")
      .eq("status", "active");

    if (!quests || quests.length === 0) return [];

    const result: StrugglingAreaData[] = [];

    for (const quest of quests) {
      const { data: assignments } = await supabase
        .from("quest_assignments")
        .select("completed_at")
        .eq("quest_id", quest.id);

      if (!assignments || assignments.length < 3) continue; // Need minimum data

      const completed = assignments.filter(a => a.completed_at !== null).length;
      const dropRate = Math.round(((assignments.length - completed) / assignments.length) * 100);

      if (dropRate >= 20) {
        // Calculate average attempts based on actual assignment data
        const avgAttempts = assignments.length > 0 ? assignments.length / Math.max(completed, 1) : 1;
        result.push({
          name: quest.title,
          dropRate,
          avgAttempts: Math.round(avgAttempts * 10) / 10,
          difficulty: difficultyLabels[quest.difficulty] || quest.difficulty,
        });
      }
    }

    return result.sort((a, b) => b.dropRate - a.dropRate).slice(0, 5);
  },

  // Get overall engagement metrics
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    // Total module completions * estimated 15 min each
    const { count: moduleCompletions } = await supabase
      .from("module_progress")
      .select("*", { count: "exact", head: true })
      .not("completed_at", "is", null);

    const totalTrainingHours = Math.round((moduleCompletions || 0) * 0.25);

    // Completion rate
    const { count: totalEnrollments } = await supabase
      .from("trail_enrollments")
      .select("*", { count: "exact", head: true });

    const { count: completedEnrollments } = await supabase
      .from("trail_enrollments")
      .select("*", { count: "exact", head: true })
      .not("completed_at", "is", null);

    const avgCompletionRate = totalEnrollments 
      ? Math.round((completedEnrollments || 0) / totalEnrollments * 100)
      : 0;

    // Total certifications
    const { count: totalCertifications } = await supabase
      .from("user_certifications")
      .select("*", { count: "exact", head: true });

    // Engagement score (composite)
    const { count: activeUsers } = await supabase
      .from("attendance_records")
      .select("user_id", { count: "exact", head: true })
      .gte("check_in", subMonths(new Date(), 1).toISOString());

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const activityRate = totalUsers ? ((activeUsers || 0) / totalUsers) * 100 : 0;
    const engagementScore = Math.min(100, Math.round(
      (avgCompletionRate * 0.4) + (activityRate * 0.4) + (Math.min(totalTrainingHours, 100) * 0.2)
    ));

    return {
      totalTrainingHours,
      avgCompletionRate,
      totalCertifications: totalCertifications || 0,
      engagementScore: Math.max(engagementScore, 10), // Minimum 10
    };
  },
};
