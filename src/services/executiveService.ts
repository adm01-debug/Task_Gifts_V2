import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface ExecutiveMetrics {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  level5Plus: number;
  totalXpEarned: number;
  totalQuestsCompleted: number;
  totalKudos: number;
  punctualCheckins: number;
  totalCheckins: number;
  completedTrails: number;
  totalEnrollments: number;
  avgTrainingHours: number;
  dau: number;
  wau: number;
  punctualityRate: number;
  trainingCompletionRate: number;
  level5PlusRate: number;
}

export interface MonthlyTrend {
  month: string;
  monthFull: string;
  totalUsers: number;
  totalXp: number;
  punctualityRate: number;
  trainingRate: number;
  adoption: number;
}

export interface DepartmentMetric {
  id: string;
  name: string;
  color: string;
  employeeCount: number;
  totalXp: number;
  avgLevel: number;
  punctualityRate: number;
  questsCompleted: number;
  score: number;
}

export const executiveService = {
  async getMetrics(): Promise<ExecutiveMetrics> {
    const { data, error } = await supabase.rpc('get_executive_metrics');
    
    if (error) {
      logger.apiError("Error fetching executive metrics", error, "executiveService");
      throw error;
    }
    
    return data as unknown as ExecutiveMetrics;
  },

  async getMonthlyTrends(): Promise<MonthlyTrend[]> {
    const { data, error } = await supabase.rpc('get_monthly_trends');
    
    if (error) {
      logger.apiError("Error fetching monthly trends", error, "executiveService");
      throw error;
    }
    
    return (data as unknown as MonthlyTrend[]) || [];
  },

  async getDepartmentMetrics(): Promise<DepartmentMetric[]> {
    const { data, error } = await supabase.rpc('get_department_metrics');
    
    if (error) {
      logger.apiError("Error fetching department metrics", error, "executiveService");
      throw error;
    }
    
    return (data as unknown as DepartmentMetric[]) || [];
  }
};
