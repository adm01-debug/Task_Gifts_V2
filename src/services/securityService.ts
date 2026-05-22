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
  name: string;
  endpoint_pattern: string;
  requests_per_minute: number;
  requests_per_hour: number;
  block_duration_minutes: number;
  is_active: boolean;
  applies_to_authenticated: boolean;
  applies_to_anonymous: boolean;
  created_at?: string;
  updated_at?: string;
}

export const securityService = {
  async getBlockedIPs(): Promise<BlockedIP[]> {
    const { data, error } = await supabase
      .from("blocked_ips")
      .select("*")
      .order("blocked_at", { ascending: false });
    if (error) throw error;
    return (data as any) as BlockedIP[];
  },

  async unblockIP(id: string): Promise<void> {
    const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
    if (error) throw error;
  },

  async blockIP(params: any): Promise<void> {
    const { error } = await supabase.from("blocked_ips").insert(params);
    if (error) throw error;
  },

  async getRateLimitRules(): Promise<RateLimitRule[]> {
    const { data, error } = await supabase
      .from("rate_limit_rules")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data as any) as RateLimitRule[];
  },

  async saveRateLimitRule(rule: any): Promise<void> {
    if (rule.id) {
      const { id, ...updates } = rule;
      const { error } = await supabase
        .from("rate_limit_rules")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("rate_limit_rules").insert(rule);
      if (error) throw error;
    }
  },

  async deleteRateLimitRule(id: string): Promise<void> {
    const { error } = await supabase.from("rate_limit_rules").delete().eq("id", id);
    if (error) throw error;
  },
  
  async toggleRateLimitRule(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from("rate_limit_rules")
      .update({ is_active } as any)
      .eq("id", id);
    if (error) throw error;
  }
};
