import { supabase } from "@/integrations/supabase/client";

export interface PasswordResetRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'completed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  expires_at: string;
  reset_token: string | null;
  reset_token_expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    display_name: string;
    email: string;
  };
  reviewer?: {
    display_name: string;
  };
}

export const passwordResetService = {
  /**
   * Solicitar reset de senha (usuário)
   */
  async requestPasswordReset(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase.rpc('request_password_reset', {
      p_user_id: user.id
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Buscar minhas solicitações de reset
   */
  async getMyRequests(): Promise<PasswordResetRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("password_reset_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Fetch reviewer names separately
    const requests = data || [];
    for (const req of requests) {
      if (req.reviewed_by) {
        const { data: reviewer } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", req.reviewed_by)
          .maybeSingle();
        // Extend request with reviewer data dynamically
        Object.assign(req, { reviewer });
      }
    }
    
    return requests as unknown as PasswordResetRequest[];
  },

  /**
   * Buscar solicitações pendentes da equipe (gestor)
   */
  async getPendingTeamRequests(): Promise<PasswordResetRequest[]> {
    const { data, error } = await supabase
      .from("password_reset_requests")
      .select("*")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    
    // Fetch user profiles separately
    const requests = data || [];
    for (const req of requests) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", req.user_id)
        .maybeSingle();
      // Extend request with profile data dynamically
      Object.assign(req, { profiles: profile });
    }
    
    return requests as unknown as PasswordResetRequest[];
  },

  /**
   * Buscar todas as solicitações (admin/gestor)
   */
  async getAllRequests(status?: string): Promise<PasswordResetRequest[]> {
    let query = supabase
      .from("password_reset_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Fetch profiles and reviewers separately
    const requests = data || [];
    for (const req of requests) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", req.user_id)
        .maybeSingle();
      // Extend request with profile data dynamically
      Object.assign(req, { profiles: profile });
      
      if (req.reviewed_by) {
        const { data: reviewer } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", req.reviewed_by)
          .maybeSingle();
        // Extend request with reviewer data dynamically
        Object.assign(req, { reviewer });
      }
    }
    
    return requests as unknown as PasswordResetRequest[];
  },

  /**
   * Aprovar solicitação de reset (gestor)
   */
  async approveRequest(requestId: string, notes?: string): Promise<{ success: boolean; reset_token?: string; error?: string }> {
    const { data, error } = await supabase.rpc('approve_password_reset', {
      p_request_id: requestId,
      p_notes: (notes || null) as any
    });

    if (error) throw error;
    return data as { success: boolean; reset_token?: string; error?: string };
  },

  /**
   * Rejeitar solicitação de reset (gestor)
   */
  async rejectRequest(requestId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('reject_password_reset', {
      p_request_id: requestId,
      p_notes: (notes || null) as any
    });

    if (error) throw error;
    return data as { success: boolean; error?: string };
  },

  /**
   * Verificar se usuário tem solicitação pendente
   */
  async hasPendingRequest(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("password_reset_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (error) return false;
    return (data?.length || 0) > 0;
  },

  /**
   * Buscar contagem de pendentes para badge
   */
  async getPendingCount(): Promise<number> {
    const { count, error } = await supabase
      .from("password_reset_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    if (error) return 0;
    return count || 0;
  },
};
