import { supabase } from "@/integrations/supabase/client";
import { profilesService } from "./profilesService";
import { logger } from "./loggingService";

export interface DepartmentMission {
  id: string;
  department_id: string | null;
  title: string;
  description: string | null;
  frequency: "daily" | "weekly" | "monthly";
  xp_reward: number;
  coin_reward: number;
  target_value: number;
  metric_key: string;
  icon: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface UserMissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  current_value: number;
  completed_at: string | null;
  period_start: string;
  period_end: string;
  claimed: boolean;
  created_at: string;
}

export interface MissionWithProgress extends DepartmentMission {
  progress?: UserMissionProgress;
}

export interface DepartmentRanking {
  id: string;
  department_id: string;
  user_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, number>;
  total_score: number;
  rank_position: number | null;
  created_at: string;
}

// Helper to get period dates
function getPeriodDates(frequency: "daily" | "weekly" | "monthly"): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (frequency === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (frequency === "weekly") {
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export const missionsService = {
  // Get missions for a department (or general missions if departmentId is null)
  async getMissionsByDepartment(departmentId: string | null): Promise<DepartmentMission[]> {
    let query = supabase
      .from("department_missions")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (departmentId) {
      query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
    } else {
      query = query.is("department_id", null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DepartmentMission[];
  },

  // Get all active missions
  async getAllMissions(): Promise<DepartmentMission[]> {
    const { data, error } = await supabase
      .from("department_missions")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (error) throw error;
    return (data || []) as DepartmentMission[];
  },

  // Get user's progress for missions
  async getUserProgress(userId: string, missionIds: string[]): Promise<UserMissionProgress[]> {
    if (missionIds.length === 0) return [];

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .in("mission_id", missionIds)
      .gte("period_end", today);

    if (error) throw error;
    return (data || []) as UserMissionProgress[];
  },

  // Get or create progress for a mission
  async getOrCreateProgress(userId: string, mission: DepartmentMission): Promise<UserMissionProgress> {
    const { start, end } = getPeriodDates(mission.frequency);
    const periodStart = start.toISOString().split("T")[0];
    const periodEnd = end.toISOString().split("T")[0];

    // Try to get existing progress
    const { data: existing } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", mission.id)
      .eq("period_start", periodStart)
      .maybeSingle();

    if (existing) return existing as UserMissionProgress;

    // Create new progress
    const { data, error } = await supabase
      .from("user_mission_progress")
      .insert({
        user_id: userId,
        mission_id: mission.id,
        period_start: periodStart,
        period_end: periodEnd,
        current_value: 0,
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to create mission progress");
    return data as UserMissionProgress;
  },

  // Update mission progress
  async updateProgress(userId: string, missionId: string, increment: number = 1): Promise<UserMissionProgress> {
    // Get mission to check target
    const { data: mission } = await supabase
      .from("department_missions")
      .select("*")
      .eq("id", missionId)
      .maybeSingle();

    if (!mission) throw new Error("Mission not found");

    const progress = await this.getOrCreateProgress(userId, mission as DepartmentMission);

    const newValue = Math.min(progress.current_value + increment, (mission as DepartmentMission).target_value);
    const isCompleted = newValue >= (mission as DepartmentMission).target_value;

    const { data, error } = await supabase
      .from("user_mission_progress")
      .update({
        current_value: newValue,
        completed_at: isCompleted && !progress.completed_at ? new Date().toISOString() : progress.completed_at,
      })
      .eq("id", progress.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to update mission progress");
    return data as UserMissionProgress;
  },

  // Claim mission reward
  async claimReward(userId: string, progressId: string): Promise<{ xp: number; coins: number }> {
    // Get progress with mission
    const { data: progress } = await supabase
      .from("user_mission_progress")
      .select("*, mission:department_missions(*)")
      .eq("id", progressId)
      .maybeSingle();

    if (!progress) throw new Error("Progress not found");
    
    const typedProgress = progress as { claimed?: boolean; completed_at?: string; mission?: DepartmentMission };
    if (typedProgress.claimed) throw new Error("Already claimed");
    if (!typedProgress.completed_at) throw new Error("Mission not completed");

    const mission = typedProgress.mission as DepartmentMission;

    // Mark as claimed
    await supabase
      .from("user_mission_progress")
      .update({ claimed: true })
      .eq("id", progressId);

    // Add rewards
    if (mission.xp_reward > 0) {
      await profilesService.addXp(userId, mission.xp_reward, `mission_${mission.metric_key}`);
    }
    if (mission.coin_reward > 0) {
      await profilesService.addCoins(userId, mission.coin_reward);
    }

    return { xp: mission.xp_reward, coins: mission.coin_reward };
  },

  // Get department rankings
  async getDepartmentRankings(departmentId: string, periodType: "weekly" | "monthly" = "weekly"): Promise<DepartmentRanking[]> {
    const { start } = getPeriodDates(periodType);
    const periodStart = start.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("department_rankings")
      .select("*")
      .eq("department_id", departmentId)
      .eq("period_type", periodType)
      .eq("period_start", periodStart)
      .order("rank_position");

    if (error) throw error;
    return (data || []) as DepartmentRanking[];
  },

  // Get all rankings for current period
  async getAllRankings(periodType: "weekly" | "monthly" = "weekly"): Promise<DepartmentRanking[]> {
    const { start } = getPeriodDates(periodType);
    const periodStart = start.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("department_rankings")
      .select("*")
      .eq("period_type", periodType)
      .eq("period_start", periodStart)
      .order("rank_position");

    if (error) throw error;
    return (data || []) as DepartmentRanking[];
  },

  // Increment progress for all missions matching a metric key
  async incrementByMetricKey(userId: string, metricKey: string, increment: number = 1): Promise<void> {
    try {
      // Get all active missions that match this metric key
      const { data: missions, error } = await supabase
        .from("department_missions")
        .select("*")
        .eq("is_active", true)
        .eq("metric_key", metricKey);

      if (error) throw error;
      if (!missions || missions.length === 0) return;

      // Update progress for each matching mission
      for (const mission of missions) {
        await this.getOrCreateProgress(userId, mission as DepartmentMission);
        await this.updateProgress(userId, mission.id, increment);
      }
    } catch (e) {
      logger.apiError(`Failed to update mission progress for metric ${metricKey}`, e, "missionsService");
    }
  },
};
