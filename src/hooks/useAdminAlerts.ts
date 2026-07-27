import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminAlert {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  affectedUsers?: number;
  data?: Record<string, unknown>;
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async (): Promise<AdminAlert[]> => {
      const { data, error } = await invokeEdgeSafe<{ alerts?: AdminAlert[] }>("admin-alerts");

      if (error) throw new Error(error.message);
      return data?.alerts ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}
