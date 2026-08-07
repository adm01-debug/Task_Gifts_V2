import { supabase } from "@/integrations/supabase/client";
import { auditService } from "./auditService";
import { profilesService } from "./profilesService";
import { notificationsService } from "./notificationsService";
import { missionsService } from "./missionsService";
import { comboService } from "./comboService";
import { achievementsService } from "./achievementsService";
import { logger } from "./loggingService";

export interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  is_punctual: boolean;
  late_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface AttendanceSettings {
  id: string;
  department_id: string | null;
  work_start_time: string;
  work_end_time: string;
  tolerance_minutes: number;
  xp_punctual_checkin: number;
  xp_streak_bonus: number;
  streak_milestone: number;
}

export interface AttendanceStreak {
  id: string;
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_punctual_date: string | null;
  total_punctual_days: number;
  updated_at: string;
}

export interface CheckInResult {
  record: AttendanceRecord;
  isPunctual: boolean;
  lateMinutes: number;
  xpEarned: number;
  bonusXp: number;
  streakUpdated: boolean;
  newStreak: number;
  streakMilestoneReached: boolean;
  comboMultiplier: number;
}

export const attendanceService = {
  async getSettings(departmentId?: string): Promise<AttendanceSettings> {
    let query = supabase
      .from('attendance_settings')
      .select('*');
    
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    } else {
      query = query.is('department_id', null);
    }

    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    
    // Return default settings if none found
    if (!data) {
      return {
        id: '',
        department_id: null,
        work_start_time: '08:00:00',
        work_end_time: '18:00:00',
        tolerance_minutes: 10,
        xp_punctual_checkin: 15,
        xp_streak_bonus: 50,
        streak_milestone: 5
      };
    }
    
    return data as AttendanceSettings;
  },

  async getUserStreak(userId: string): Promise<AttendanceStreak | null> {
    const { data, error } = await supabase
      .from('attendance_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as AttendanceStreak | null;
  },

  async getOrCreateStreak(userId: string): Promise<AttendanceStreak> {
    const existing = await this.getUserStreak(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('attendance_streaks')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as AttendanceStreak;
  },

  async getTodayRecord(userId: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in', `${today}T00:00:00`)
      .lte('check_in', `${today}T23:59:59`)
      .order('check_in', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data as AttendanceRecord | null;
  },

  async getRecentRecords(userId: string, days: number = 7): Promise<AttendanceRecord[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in', startDate.toISOString())
      .order('check_in', { ascending: false });

    if (error) throw error;
    return (data || []) as AttendanceRecord[];
  },

  async checkIn(userId: string): Promise<CheckInResult> {
    const settings = await this.getSettings();
    const now = new Date();
    
    // Parse work start time
    const [startHour, startMinute] = settings.work_start_time.split(':').map(Number);
    const workStart = new Date(now);
    workStart.setHours(startHour, startMinute, 0, 0);
    
    // Add tolerance
    const toleranceEnd = new Date(workStart);
    toleranceEnd.setMinutes(toleranceEnd.getMinutes() + settings.tolerance_minutes);
    
    const isPunctual = now <= toleranceEnd;
    const lateMinutes = isPunctual ? 0 : Math.floor((now.getTime() - toleranceEnd.getTime()) / 60000);

    // Create attendance record
    const { data: record, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: userId,
        check_in: now.toISOString(),
        is_punctual: isPunctual,
        late_minutes: lateMinutes
      })
      .select()
      .single();

    if (error) throw error;

    let xpEarned = 0;
    let bonusXp = 0;
    let comboMultiplier = 1.0;
    let streakUpdated = false;
    let newStreak = 0;
    let streakMilestoneReached = false;

    // Update streak if punctual
    const streak = await this.getOrCreateStreak(userId);
    const today = now.toISOString().split('T')[0];
    const lastDate = streak.last_punctual_date;
    
    if (isPunctual) {
      // Check if this is a consecutive day
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newCurrentStreak = streak.current_streak;
      
      if (lastDate === yesterdayStr) {
        // Consecutive day - increment streak
        newCurrentStreak = streak.current_streak + 1;
      } else if (lastDate !== today) {
        // Not consecutive - reset to 1
        newCurrentStreak = 1;
      }

      const newBestStreak = Math.max(streak.best_streak, newCurrentStreak);
      
      // Check for milestone
      streakMilestoneReached = newCurrentStreak > 0 && 
        newCurrentStreak % settings.streak_milestone === 0 &&
        newCurrentStreak > streak.current_streak;

      await supabase
        .from('attendance_streaks')
        .update({
          current_streak: newCurrentStreak,
          best_streak: newBestStreak,
          last_punctual_date: today,
          total_punctual_days: streak.total_punctual_days + 1,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

      streakUpdated = true;
      newStreak = newCurrentStreak;

      // Award XP for punctual check-in
      let baseXp = settings.xp_punctual_checkin;
      
      // Bonus XP for milestone
      if (streakMilestoneReached) {
        baseXp += settings.xp_streak_bonus;
      }

      // Apply combo multiplier
      if (baseXp > 0) {
        const comboResult = await comboService.registerAction(userId, baseXp);
        xpEarned = comboResult.finalXp;
        bonusXp = comboResult.bonusXp;
        comboMultiplier = comboResult.combo?.current_multiplier || 1.0;
        
        await profilesService.addXp(userId, xpEarned, 'punctual_checkin');
      }

      // Auto-update mission progress for punctual check-in
      await missionsService.incrementByMetricKey(userId, 'punctual_checkin', 1);
      await missionsService.incrementByMetricKey(userId, 'daily_checkin', 1);

      // Check for streak achievements
      try {
        await achievementsService.checkStreakAchievements(userId, newStreak);
      } catch (e) {
        logger.apiError("Failed to check streak achievements", e, "attendanceService");
      }

      // Send notification for milestone
      if (streakMilestoneReached) {
        await notificationsService.create({
          user_id: userId,
          title: '🔥 Streak de Pontualidade!',
          message: `Incrível! Você atingiu ${newStreak} dias consecutivos de pontualidade!`,
          type: 'achievement',
          data: { streak: newStreak, xp_earned: xpEarned }
        });
      }
    } else {
      // Reset streak if late
      if (streak.current_streak > 0) {
        await supabase
          .from('attendance_streaks')
          .update({
            current_streak: 0,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);
      }
    }

    // Log audit
    await auditService.log({
      user_id: userId,
      action: 'profile_update',
      entity_type: 'attendance',
      entity_id: record.id,
      new_data: { 
        is_punctual: isPunctual, 
        late_minutes: lateMinutes,
        xp_earned: xpEarned,
        streak: newStreak
      }
    });

    return {
      record: record as AttendanceRecord,
      isPunctual,
      lateMinutes,
      xpEarned,
      bonusXp,
      streakUpdated,
      newStreak,
      streakMilestoneReached,
      comboMultiplier
    };
  },

  async checkOut(userId: string): Promise<AttendanceRecord | null> {
    const todayRecord = await this.getTodayRecord(userId);
    if (!todayRecord || todayRecord.check_out) return null;

    const { data, error } = await supabase
      .from('attendance_records')
      .update({ check_out: new Date().toISOString() })
      .eq('id', todayRecord.id)
      .select()
      .single();

    if (error) throw error;

    return data as AttendanceRecord;
  },

  async getTeamAttendance(date?: string): Promise<{
    records: (AttendanceRecord & { profile?: { display_name: string; avatar_url: string | null } })[];
    punctualRate: number;
    totalCheckins: number;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        profiles:user_id (display_name, avatar_url)
      `)
      .gte('check_in', `${targetDate}T00:00:00`)
      .lte('check_in', `${targetDate}T23:59:59`)
      .order('check_in', { ascending: true });

    if (error) throw error;

    const records = (data || []) as (AttendanceRecord & { profile?: { display_name: string; avatar_url: string | null } })[];
    const punctualCount = records.filter(r => r.is_punctual).length;
    
    return {
      records,
      punctualRate: records.length > 0 ? (punctualCount / records.length) * 100 : 0,
      totalCheckins: records.length
    };
  },

  async getStreakLeaderboard(limit: number = 10): Promise<AttendanceStreak[]> {
    const { data, error } = await supabase
      .from('attendance_streaks')
      .select('*')
      .order('current_streak', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AttendanceStreak[];
  }
};
