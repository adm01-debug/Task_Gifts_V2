import { supabase } from "@/integrations/supabase/client";

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  block_type: string;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  violation_count: number;
}

export interface RateLimitRule {
  id: string;
  path: string;
  max_requests: number;
  window_seconds: number;
  is_active: boolean;
  created_at: string;
}

export const securityService = {
  async getBlockedIPs(): Promise<BlockedIP[]> {
    const { data, error } = await supabase
      .from("blocked_ips")
      .select("*")
      .order("blocked_at", { ascending: false });
    if (error) throw error;
    return data as BlockedIP[];
  },

  async unblockIP(id: string): Promise<void> {
    const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
    if (error) throw error;
  },

  async blockIP(params: {
    ip_address: string;
    reason: string;
    block_type: string;
    is_permanent: boolean;
    expires_at: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("blocked_ips").insert(params);
    if (error) throw error;
  },

  async getRateLimitRules(): Promise<RateLimitRule[]> {
    const { data, error } = await supabase
      .from("rate_limit_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as RateLimitRule[];
  },

  async addRateLimitRule(rule: Omit<RateLimitRule, "id" | "created_at">): Promise<void> {
    const { error } = await supabase.from("rate_limit_rules").insert(rule);
    if (error) throw error;
  },

  async deleteRateLimitRule(id: string): Promise<void> {
    const { error } = await supabase.from("rate_limit_rules").delete().eq("id", id);
    if (error) throw error;
  },
};
