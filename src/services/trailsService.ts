import { supabase } from "@/integrations/supabase/client";
import { auditService } from "./auditService";
import { missionsService } from "./missionsService";
import { comboService } from "./comboService";
import { profilesService } from "./profilesService";
import { achievementsService } from "./achievementsService";
import { certificationsService } from "./certificationsService";
import { Json } from "@/integrations/supabase/types";
import { logger } from "./loggingService";

export interface LearningTrail {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  department_id: string | null;
  estimated_hours: number;
  xp_reward: number;
  coin_reward: number;
  badge_name: string | null;
  badge_icon: string | null;
  status: "draft" | "published" | "archived";
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TrailModule {
  id: string;
  trail_id: string;
  title: string;
  description: string | null;
  content_type: "video" | "text" | "quiz" | "flashcard" | "infographic" | "simulation" | "checklist";
  content: Json | null;
  video_url: string | null;
  xp_reward: number;
  duration_minutes: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Input types for create operations (without auto-generated fields)
export interface CreateTrailInput {
  title: string;
  description?: string | null;
  icon?: string;
  department_id?: string | null;
  estimated_hours?: number;
  xp_reward?: number;
  coin_reward?: number;
  badge_name?: string | null;
  badge_icon?: string | null;
  status?: "draft" | "published" | "archived";
  order_index?: number;
  created_by: string;
}

export interface CreateModuleInput {
  trail_id: string;
  title: string;
  description?: string | null;
  content_type?: "video" | "text" | "quiz" | "flashcard" | "infographic" | "simulation" | "checklist";
  content?: Json | null;
  video_url?: string | null;
  xp_reward?: number;
  duration_minutes?: number;
  order_index?: number;
}

export interface TrailEnrollment {
  id: string;
  user_id: string;
  trail_id: string;
  started_at: string;
  completed_at: string | null;
  progress_percent: number;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  attempts: number;
}

export interface TrailPrerequisite {
  id: string;
  trail_id: string;
  prerequisite_trail_id: string;
  created_at: string;
}

export interface TrailWithModules extends LearningTrail {
  modules: TrailModule[];
  enrollment?: TrailEnrollment;
  moduleProgress?: ModuleProgress[];
}

export const trailsService = {
  // Get all published trails
  async getPublishedTrails(): Promise<LearningTrail[]> {
    const { data, error } = await supabase
      .from("learning_trails")
      .select("*")
      .eq("status", "published")
      .order("order_index");

    if (error) throw error;
    return (data || []) as LearningTrail[];
  },

  // Get trails by department
  async getTrailsByDepartment(departmentId: string): Promise<LearningTrail[]> {
    const { data, error } = await supabase
      .from("learning_trails")
      .select("*")
      .eq("department_id", departmentId)
      .eq("status", "published")
      .order("order_index");

    if (error) throw error;
    return (data || []) as LearningTrail[];
  },

  // Get trail with modules
  async getTrailWithModules(trailId: string): Promise<TrailWithModules | null> {
    const { data: trail, error: trailError } = await supabase
      .from("learning_trails")
      .select("*")
      .eq("id", trailId)
      .maybeSingle();

    if (trailError) throw trailError;
    if (!trail) return null;

    const { data: modules, error: modulesError } = await supabase
      .from("trail_modules")
      .select("*")
      .eq("trail_id", trailId)
      .order("order_index");

    if (modulesError) throw modulesError;

    return {
      ...(trail as LearningTrail),
      modules: (modules || []) as TrailModule[],
    };
  },

  // Get user enrollments
  async getUserEnrollments(userId: string): Promise<TrailEnrollment[]> {
    const { data, error } = await supabase
      .from("trail_enrollments")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []) as TrailEnrollment[];
  },

  // Enroll user in trail
  async enrollInTrail(userId: string, trailId: string): Promise<TrailEnrollment> {
    const { data, error } = await supabase
      .from("trail_enrollments")
      .insert({ user_id: userId, trail_id: trailId })
      .select()
      .single();

    if (error) throw error;

    await auditService.log({
      user_id: userId,
      action: "quest_assigned",
      entity_type: "trail_enrollment",
      entity_id: data.id,
      new_data: { trail_id: trailId },
      metadata: { type: "learning_trail" },
    });

    return data as TrailEnrollment;
  },

  // Get module progress for user
  async getUserModuleProgress(userId: string, moduleIds: string[]): Promise<ModuleProgress[]> {
    if (moduleIds.length === 0) return [];

    const { data, error } = await supabase
      .from("module_progress")
      .select("*")
      .eq("user_id", userId)
      .in("module_id", moduleIds);

    if (error) throw error;
    return (data || []) as ModuleProgress[];
  },

  // Start module
  async startModule(userId: string, moduleId: string): Promise<ModuleProgress> {
    const { data: existing } = await supabase
      .from("module_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existing) {
      // Update attempts
      const { data, error } = await supabase
        .from("module_progress")
        .update({ attempts: (existing as ModuleProgress).attempts + 1 })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleProgress;
    }

    const { data, error } = await supabase
      .from("module_progress")
      .insert({ user_id: userId, module_id: moduleId, attempts: 1 })
      .select()
      .single();

    if (error) throw error;
    return data as ModuleProgress;
  },

  // Complete module
  async completeModule(userId: string, moduleId: string, score?: number, moduleXpReward: number = 25): Promise<{
    progress: ModuleProgress;
    comboResult: { finalXp: number; bonusXp: number; multiplier: number };
  }> {
    const { data, error } = await supabase
      .from("module_progress")
      .update({
        completed_at: new Date().toISOString(),
        score: score ?? null,
      })
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .select()
      .single();

    if (error) throw error;

    // Apply combo multiplier to module XP reward
    let comboResult = { finalXp: moduleXpReward, bonusXp: 0, multiplier: 1.0 };
    try {
      const result = await comboService.registerAction(userId, moduleXpReward);
      comboResult = {
        finalXp: result.finalXp,
        bonusXp: result.bonusXp,
        multiplier: result.combo?.current_multiplier || 1.0,
      };
      await profilesService.addXp(userId, result.finalXp, 'module_completed');
    } catch (e) {
      logger.apiError("Failed to add XP for module completion", e, "trailsService");
    }

    // Auto-update mission progress for module completion
    try {
      await missionsService.incrementByMetricKey(userId, 'module_completed', 1);
      await missionsService.incrementByMetricKey(userId, 'training_completed', 1);
    } catch (e) {
      logger.apiError("Failed to update module mission progress", e, "trailsService");
    }

    return { progress: data as ModuleProgress, comboResult };
  },

  // Update enrollment progress
  async updateEnrollmentProgress(userId: string, trailId: string, progressPercent: number): Promise<TrailEnrollment> {
    const updates: Partial<TrailEnrollment> = { progress_percent: progressPercent };
    
    if (progressPercent >= 100) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("trail_enrollments")
      .update(updates)
      .eq("user_id", userId)
      .eq("trail_id", trailId)
      .select()
      .single();

    if (error) throw error;

    if (progressPercent >= 100) {
      await auditService.log({
        user_id: userId,
        action: "quest_completed",
        entity_type: "trail_enrollment",
        entity_id: data.id,
        new_data: { trail_id: trailId, progress: 100 },
        metadata: { type: "learning_trail" },
      });

      // Auto-update mission progress for trail completion
      try {
        await missionsService.incrementByMetricKey(userId, 'trail_completed', 1);
      } catch (e) {
        logger.apiError("Failed to update trail mission progress", e, "trailsService");
      }

      // Check for trail achievements
      try {
        await achievementsService.checkTrailAchievements(userId);
      } catch (e) {
        logger.apiError("Failed to check trail achievements", e, "trailsService");
      }

      // Auto-issue certification if trail has linked certification
      try {
        const { data: linkedCert } = await supabase
          .from('certifications')
          .select('id')
          .eq('trail_id', trailId)
          .maybeSingle();

        if (linkedCert) {
          await certificationsService.issueCertification(userId, linkedCert.id);
        }
      } catch (e) {
        logger.apiError("Failed to issue trail certification", e, "trailsService");
      }
    }

    return data as TrailEnrollment;
  },

  // Create trail (for managers/admins)
  async createTrail(trail: CreateTrailInput): Promise<LearningTrail> {
    const { data, error } = await supabase
      .from("learning_trails")
      .insert({
        title: trail.title,
        description: trail.description,
        icon: trail.icon,
        department_id: trail.department_id,
        estimated_hours: trail.estimated_hours,
        xp_reward: trail.xp_reward,
        coin_reward: trail.coin_reward,
        badge_name: trail.badge_name,
        badge_icon: trail.badge_icon,
        status: trail.status,
        order_index: trail.order_index,
        created_by: trail.created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LearningTrail;
  },

  // Create module
  async createModule(module: CreateModuleInput): Promise<TrailModule> {
    const { data, error } = await supabase
      .from("trail_modules")
      .insert({
        trail_id: module.trail_id,
        title: module.title,
        description: module.description,
        content_type: module.content_type,
        content: module.content,
        video_url: module.video_url,
        xp_reward: module.xp_reward,
        duration_minutes: module.duration_minutes,
        order_index: module.order_index,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TrailModule;
  },

  // Update trail
  async updateTrail(id: string, updates: Partial<LearningTrail>): Promise<LearningTrail> {
    const { data, error } = await supabase
      .from("learning_trails")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as LearningTrail;
  },

  // Update module
  async updateModule(id: string, updates: Partial<Omit<TrailModule, 'id' | 'created_at' | 'updated_at'>>): Promise<TrailModule> {
    const { data, error } = await supabase
      .from("trail_modules")
      .update({
        ...(updates.trail_id !== undefined && { trail_id: updates.trail_id }),
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.content_type !== undefined && { content_type: updates.content_type }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.video_url !== undefined && { video_url: updates.video_url }),
        ...(updates.xp_reward !== undefined && { xp_reward: updates.xp_reward }),
        ...(updates.duration_minutes !== undefined && { duration_minutes: updates.duration_minutes }),
        ...(updates.order_index !== undefined && { order_index: updates.order_index }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as TrailModule;
  },

  // Delete module
  async deleteModule(id: string): Promise<void> {
    const { error } = await supabase
      .from("trail_modules")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Persist a batch of order_index changes (drag & drop reordering)
  async reorderModules(changes: { id: string; order_index: number }[]): Promise<void> {
    if (changes.length === 0) return;

    for (const change of changes) {
      const { error } = await supabase
        .from("trail_modules")
        .update({ order_index: change.order_index })
        .eq("id", change.id);

      if (error) throw error;
    }
  },

  // Delete trail
  async deleteTrail(id: string): Promise<void> {
    const { error } = await supabase
      .from("learning_trails")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get all prerequisites
  async getPrerequisites(): Promise<TrailPrerequisite[]> {
    const { data, error } = await supabase
      .from("trail_prerequisites")
      .select("*");

    if (error) throw error;
    return (data || []) as TrailPrerequisite[];
  },

  // Get prerequisites for a specific trail
  async getTrailPrerequisites(trailId: string): Promise<TrailPrerequisite[]> {
    const { data, error } = await supabase
      .from("trail_prerequisites")
      .select("*")
      .eq("trail_id", trailId);

    if (error) throw error;
    return (data || []) as TrailPrerequisite[];
  },

  // Add prerequisite
  async addPrerequisite(trailId: string, prerequisiteTrailId: string): Promise<TrailPrerequisite> {
    const { data, error } = await supabase
      .from("trail_prerequisites")
      .insert({ trail_id: trailId, prerequisite_trail_id: prerequisiteTrailId })
      .select()
      .single();

    if (error) throw error;
    return data as TrailPrerequisite;
  },

  // Remove prerequisite
  async removePrerequisite(trailId: string, prerequisiteTrailId: string): Promise<void> {
    const { error } = await supabase
      .from("trail_prerequisites")
      .delete()
      .eq("trail_id", trailId)
      .eq("prerequisite_trail_id", prerequisiteTrailId);

    if (error) throw error;
  },

  // Check if user has completed all prerequisites for a trail
  async checkPrerequisitesCompleted(userId: string, trailId: string): Promise<{
    completed: boolean;
    missingPrerequisites: string[];
  }> {
    // Get all prerequisites for this trail
    const { data: prerequisites, error: prereqError } = await supabase
      .from("trail_prerequisites")
      .select("prerequisite_trail_id")
      .eq("trail_id", trailId);

    if (prereqError) throw prereqError;
    if (!prerequisites || prerequisites.length === 0) {
      return { completed: true, missingPrerequisites: [] };
    }

    // Get user's completed enrollments
    const { data: completedEnrollments, error: enrollError } = await supabase
      .from("trail_enrollments")
      .select("trail_id")
      .eq("user_id", userId)
      .not("completed_at", "is", null);

    if (enrollError) throw enrollError;

    const completedTrailIds = new Set((completedEnrollments || []).map(e => e.trail_id));
    const missingPrerequisites = prerequisites
      .filter(p => !completedTrailIds.has(p.prerequisite_trail_id))
      .map(p => p.prerequisite_trail_id);

    return {
      completed: missingPrerequisites.length === 0,
      missingPrerequisites,
    };
  },
};
