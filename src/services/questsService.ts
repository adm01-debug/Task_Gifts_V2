import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { notificationsService } from "./notificationsService";
import { auditService } from "./auditService";
import { missionsService } from "./missionsService";
import { comboService } from "./comboService";
import { profilesService } from "./profilesService";
import { achievementsService } from "./achievementsService";
import { logger } from "./loggingService";

// Define the base table type
type BaseQuest = Tables<"custom_quests">;

// Define the extended type with joined fields
export interface Quest extends BaseQuest {
  quest_steps: { id: string }[];
  quest_assignments: { id: string; completed_at: string | null }[];
}

export type QuestInsert = TablesInsert<"custom_quests">;
export type QuestUpdate = TablesUpdate<"custom_quests">;
export type QuestStep = Tables<"quest_steps">;
export type QuestStepInsert = TablesInsert<"quest_steps">;
export type QuestAssignment = Tables<"quest_assignments">;
export type QuestStatus = Enums<"quest_status">;
export type QuestDifficulty = Enums<"quest_difficulty">;

export interface QuestWithSteps extends Quest {
  quest_steps: QuestStep[];
}

export const questsService = {
  // Quests CRUD
  async getAll(status?: QuestStatus): Promise<Quest[]> {
    let query = supabase.from("custom_quests").select(`*, quest_steps(id), quest_assignments(id, completed_at)`);
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as Quest[]) ?? [];
  },

  async getById(id: string): Promise<QuestWithSteps | null> {
    const { data, error } = await supabase
      .from("custom_quests")
      .select("*, quest_steps(*), quest_assignments(id, completed_at)")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data as unknown as QuestWithSteps;
  },

  async getByCreator(creatorId: string): Promise<Quest[]> {
    const { data, error } = await supabase
      .from("custom_quests")
      .select(`*, quest_steps(id), quest_assignments(id, completed_at)`)
      .eq("created_by", creatorId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data as unknown as Quest[]) ?? [];
  },

  async create(quest: QuestInsert): Promise<Quest> {
    const { data, error } = await supabase
      .from("custom_quests")
      .insert(quest)
      .select(`*, quest_steps(id), quest_assignments(id, completed_at)`)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to create quest");

    // Audit quest creation
    try {
      await auditService.logQuestCreated(quest.created_by, data.id, data.title);
    } catch (e) {
      logger.apiError("Failed to audit quest creation", e, "questsService");
    }

    return data as unknown as Quest;
  },

  async update(id: string, updates: QuestUpdate): Promise<Quest> {
    const { data, error } = await supabase
      .from("custom_quests")
      .update(updates)
      .eq("id", id)
      .select(`*, quest_steps(id), quest_assignments(id, completed_at)`)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Quest not found");
    return data as unknown as Quest;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("custom_quests")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  async archive(id: string): Promise<Quest> {
    return this.update(id, { status: "archived" });
  },

  async activate(id: string): Promise<Quest> {
    return this.update(id, { status: "active" });
  },

  // Quest Steps
  async getSteps(questId: string): Promise<QuestStep[]> {
    const { data, error } = await supabase
      .from("quest_steps")
      .select("*")
      .eq("quest_id", questId)
      .order("order_index", { ascending: true });
    
    if (error) throw error;
    return data ?? [];
  },

  async createStep(step: QuestStepInsert): Promise<QuestStep> {
    const { data, error } = await supabase
      .from("quest_steps")
      .insert(step)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to create quest step");
    return data;
  },

  async createSteps(steps: QuestStepInsert[]): Promise<QuestStep[]> {
    const { data, error } = await supabase
      .from("quest_steps")
      .insert(steps)
      .select();
    
    if (error) throw error;
    return data ?? [];
  },

  async deleteSteps(questId: string): Promise<void> {
    const { error } = await supabase
      .from("quest_steps")
      .delete()
      .eq("quest_id", questId);
    
    if (error) throw error;
  },

  // Quest Assignments
  async getAssignments(questId: string): Promise<QuestAssignment[]> {
    const { data, error } = await supabase
      .from("quest_assignments")
      .select("*")
      .eq("quest_id", questId);
    
    if (error) throw error;
    return data ?? [];
  },

  async getUserAssignments(userId: string): Promise<QuestAssignment[]> {
    const { data, error } = await supabase
      .from("quest_assignments")
      .select("*")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data ?? [];
  },

  async assignQuest(questId: string, userId: string): Promise<QuestAssignment> {
    const { data, error } = await supabase
      .from("quest_assignments")
      .insert({ quest_id: questId, user_id: userId })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to create quest assignment");

    // Get quest details for notification
    try {
      const quest = await this.getById(questId);
      if (quest) {
        await notificationsService.notifyQuestAssigned(userId, quest.title, questId);
      }
    } catch (e) {
      logger.apiError("Failed to create quest assignment notification", e, "questsService");
    }

    return data;
  },

  async updateProgress(assignmentId: string, currentStep: number): Promise<QuestAssignment> {
    const { data, error } = await supabase
      .from("quest_assignments")
      .update({ current_step: currentStep })
      .eq("id", assignmentId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Assignment not found");
    return data;
  },

  async completeQuest(assignmentId: string): Promise<{ 
    assignment: QuestAssignment; 
    quest: Quest | null;
    comboResult: { finalXp: number; bonusXp: number; multiplier: number } | null;
  }> {
    const { data, error } = await supabase
      .from("quest_assignments")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", assignmentId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Assignment not found");

    // Get quest details for notification and audit
    let quest: Quest | null = null;
    let comboResult: { finalXp: number; bonusXp: number; multiplier: number } | null = null;
    
    try {
      quest = await this.getById(data.quest_id);
      if (quest) {
        // Audit quest completion
        await auditService.logQuestCompleted(data.user_id, quest.id, quest.xp_reward, quest.coin_reward);

        // Apply combo multiplier to quest XP reward
        const result = await comboService.registerAction(data.user_id, quest.xp_reward);
        comboResult = {
          finalXp: result.finalXp,
          bonusXp: result.bonusXp,
          multiplier: result.combo?.current_multiplier || 1.0,
        };
        await profilesService.addXp(data.user_id, result.finalXp, `Quest: ${quest.title}`);
        
        // Add coins (no combo multiplier for coins)
        if (quest.coin_reward > 0) {
          await profilesService.addCoins(data.user_id, quest.coin_reward);
        }
        
        // Increment quests completed counter
        await profilesService.incrementQuestsCompleted(data.user_id);

        await notificationsService.create({
          user_id: data.user_id,
          type: "quest_complete",
          title: "🎉 Quest Completada!",
          message: `Você finalizou: ${quest.title}`,
          data: { 
            questId: quest.id, 
            questTitle: quest.title,
            xpReward: result.finalXp,
            bonusXp: result.bonusXp,
            coinReward: quest.coin_reward
          },
        });

        // Auto-update mission progress for quest completion
        try {
          await missionsService.incrementByMetricKey(data.user_id, 'quest_completed', 1);
        } catch (e) {
          logger.apiError("Failed to update quest mission progress", e, "questsService");
        }

        // Check for quest achievements
        try {
          await achievementsService.checkQuestAchievements(data.user_id);
        } catch (e) {
          logger.apiError("Failed to check quest achievements", e, "questsService");
        }
      }
    } catch (e) {
      logger.apiError("Failed to process quest completion", e, "questsService");
    }

    return { assignment: data, quest, comboResult };
  },

  // Stats
  async getQuestStats(questId: string): Promise<{
    totalAssigned: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  }> {
    const assignments = await this.getAssignments(questId);
    const completed = assignments.filter(a => a.completed_at !== null).length;
    const inProgress = assignments.filter(a => a.completed_at === null).length;
    
    return {
      totalAssigned: assignments.length,
      completed,
      inProgress,
      completionRate: assignments.length > 0 ? (completed / assignments.length) * 100 : 0,
    };
  },
};
