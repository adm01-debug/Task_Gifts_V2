import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { subDays, subMonths } from "date-fns";

export const adminService = {
  async getAttendanceStats(days = 30) {
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("check_in, is_punctual, user_id")
        .gte("check_in", subDays(new Date(), days).toISOString())
        .order("check_in", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.apiError("getAttendanceStats", error, "AdminService");
      throw error;
    }
  },

  async getQuizActivity(days = 30) {
    try {
      const { data, error } = await supabase
        .from("quiz_scores")
        .select("played_at, score, user_id")
        .gte("played_at", subDays(new Date(), days).toISOString())
        .order("played_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.apiError("getQuizActivity", error, "AdminService");
      throw error;
    }
  },

  async getTrailEnrollments() {
    try {
      const { data, error } = await supabase
        .from("trail_enrollments")
        .select("started_at, completed_at, user_id")
        .order("started_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.apiError("getTrailEnrollments", error, "AdminService");
      throw error;
    }
  },

  async getUserSignups(months = 6) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", subMonths(new Date(), months).toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.apiError("getUserSignups", error, "AdminService");
      throw error;
    }
  }
};
