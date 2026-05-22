 import { supabase } from "@/integrations/supabase/client";
 import { achievementsService } from "../achievementsService";
 import { logger } from "../loggingService";
 import { BEHAVIORAL_BADGES } from "./badges";
 import { BehaviorMetrics, BehavioralBadge } from "./types";
 
 export const behavioralBadgesService = {
   async getUserMetrics(userId: string): Promise<BehaviorMetrics> {
     const [
       feedbacksGiven,
       feedbacksReceived,
       checkinsData,
       pulsesData,
       oneOnOnesData,
       goalsData,
       coursesData,
       pdiData,
       socialData,
       attendanceData,
       mentorData,
       commentsData,
     ] = await Promise.all([
       supabase.from("kudos").select("*", { count: "exact", head: true }).eq("from_user_id", userId),
       supabase.from("kudos").select("*", { count: "exact", head: true }).eq("to_user_id", userId),
       supabase.from("checkins").select("completed_at").eq("employee_id", userId).not("completed_at", "is", null).order("completed_at", { ascending: false }),
       supabase.from("mood_entries").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }),
       supabase.from("checkins").select("*", { count: "exact", head: true }).or(`employee_id.eq.${userId},manager_id.eq.${userId}`).eq("status", "completed"),
       supabase.from("goals").select("status").eq("user_id", userId),
       supabase.from("trail_enrollments").select("*", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null),
       supabase.from("development_plan_actions").select("status, plan:development_plans!inner(user_id)").eq("development_plans.user_id", userId),
       Promise.all([
         supabase.from("announcements").select("*", { count: "exact", head: true }).eq("author_id", userId),
         supabase.from("activity_reactions").select("*", { count: "exact", head: true }).eq("user_id", userId),
       ]),
       supabase.from("attendance_records").select("check_in").eq("user_id", userId),
       supabase.from("mentorship_pairs").select("*", { count: "exact", head: true }).eq("mentor_id", userId).eq("status", "active"),
        supabase.from("activity_comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
  
      // Error checking for each result
      const results = [
        feedbacksGiven, feedbacksReceived, checkinsData, pulsesData, 
        oneOnOnesData, goalsData, coursesData, pdiData, 
        socialData, attendanceData, mentorData, commentsData
      ];
      
      results.forEach((res, index) => {
        if (res instanceof Array) {
            res.forEach((r, i) => {
                if (r.error) {
                    logger.apiError(`getUserMetrics[${index}][${i}]`, r.error, "behavioralBadges");
                }
            });
        } else if (res.error) {
          logger.apiError(`getUserMetrics[${index}]`, res.error, "behavioralBadges");
        }
      });
 
     const checkins = checkinsData.data || [];
     let consecutiveCheckinsWeeks = 0;
     if (checkins.length > 0) {
       const now = new Date();
       let currentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
       for (let i = 0; i < 52; i++) {
         const weekStart = new Date(currentWeek);
         weekStart.setDate(weekStart.getDate() - (i * 7));
         const weekEnd = new Date(weekStart);
         weekEnd.setDate(weekEnd.getDate() + 7);
         const hasCheckinInWeek = (checkins as any[]).some(c => {
           const date = new Date(c.completed_at);
           return date >= weekStart && date < weekEnd;
         });
         if (hasCheckinInWeek) consecutiveCheckinsWeeks++;
         else break;
       }
     }
 
     const pulses = pulsesData.data || [];
     let consecutivePulsesWeeks = 0;
     if (pulses.length > 0) {
       const now = new Date();
       let currentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
       for (let i = 0; i < 52; i++) {
         const weekStart = new Date(currentWeek);
         weekStart.setDate(weekStart.getDate() - (i * 7));
         const weekEnd = new Date(weekStart);
         weekEnd.setDate(weekEnd.getDate() + 7);
         const hasPulseInWeek = (pulses as any[]).some(p => {
           const date = new Date(p.created_at);
           return date >= weekStart && date < weekEnd;
         });
         if (hasPulseInWeek) consecutivePulsesWeeks++;
         else break;
       }
     }
 
     const goals = (goalsData.data || []) as any[];
     const goalsCompleted = goals.filter(g => g.status === "completed").length;
     const goalsOnTrack = goals.filter(g => g.status === "on_track" || g.status === "completed").length;
     const pdiActions = (pdiData.data || []) as any[];
     const pdiActionsCompleted = pdiActions.filter(a => a.status === "completed").length;
     const attendance = (attendanceData.data || []) as any[];
     const earlyCheckins = attendance.filter(a => new Date(a.check_in).getHours() < 8).length;
     const lateNightActivity = attendance.filter(a => new Date(a.check_in).getHours() >= 22).length;
 
     return {
       userId,
       feedbacksGiven: (feedbacksGiven as any).count || 0,
       feedbacksReceived: (feedbacksReceived as any).count || 0,
       checkinsCompleted: (checkins as any[]).length,
       consecutiveCheckinsWeeks,
       pulsesResponded: (pulses as any[]).length,
       consecutivePulsesWeeks,
       oneOnOnesAttended: (oneOnOnesData as any).count || 0,
       goalsCompleted,
       goalsOnTrack,
       totalGoals: (goals as any[]).length,
       coursesCompleted: (coursesData as any).count || 0,
       pdiActionsCompleted,
       socialPostsCreated: ((socialData as any)[0]).count || 0,
       socialReactionsGiven: ((socialData as any)[1]).count || 0,
       earlyCheckins,
       lateNightActivity,
       weekendActivity: 0,
       helpfulComments: (commentsData as any).count || 0,
       mentorSessions: (mentorData as any).count || 0,
      };
    },

    // Singleton instance of GamificationContext safe methods
    _getGamification() {
      return (window as any).__GAMIFICATION_CONTEXT__;
    },

   async checkAndAwardBadges(userId: string): Promise<string[]> {
     try {
       const metrics = await this.getUserMetrics(userId);
       const awardedBadges: string[] = [];
       for (const badge of BEHAVIORAL_BADGES) {
         if (badge.condition(metrics)) {
          const result = await achievementsService.unlockAchievement(userId, badge.key);
          if (result.success) {
            awardedBadges.push(badge.key);
            logger.info(`Badge desbloqueado: ${badge.name} para usuário ${userId}`, "behavioralBadges");
            
            // Try to trigger UI toast if context was exposed
            const gamification = this._getGamification();
            if (gamification) {
              gamification.unlockAchievement(badge.name, badge.description);
            }
          }
         }
       }
       return awardedBadges;
     } catch (error) {
       logger.apiError('checkAndAwardBadges', error, 'behavioralBadges');
       return [];
     }
   },
 
  async syncBadgesToDatabase(): Promise<void> {
    try {
      for (const badge of BEHAVIORAL_BADGES) {
       const { data: existing } = await supabase.from("achievements").select("id").eq("key", badge.key).maybeSingle();
       if (!existing) {
         await supabase.from("achievements").insert({
           key: badge.key,
           name: badge.name,
           description: badge.description,
           icon: badge.icon,
           category: badge.category,
           rarity: badge.rarity,
           xp_reward: badge.xpReward,
           coin_reward: badge.coinReward,
         });
         logger.info(`Badge criado no banco: ${badge.name}`, "behavioralBadges");
        }
      }
    } catch (error) {
      logger.apiError('syncBadgesToDatabase', error, 'behavioralBadges');
    }
  },
 
   getBadgesByCategory(): Record<string, BehavioralBadge[]> {
     const categories: Record<string, BehavioralBadge[]> = {};
     for (const badge of BEHAVIORAL_BADGES) {
       if (!categories[badge.category]) categories[badge.category] = [];
       categories[badge.category].push(badge);
     }
     return categories;
   },
 };