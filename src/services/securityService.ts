import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type BlockedIP = Tables<"blocked_ips">;
export type BlockedIPInsert = TablesInsert<"blocked_ips">;
export type RateLimitRule = Tables<"rate_limit_rules">;
export type RateLimitRuleInsert = TablesInsert<"rate_limit_rules">;
export type RateLimitRuleUpdate = TablesUpdate<"rate_limit_rules">;

export const securityService = {
  async getBlockedIPs(): Promise<BlockedIP[]> {
    const { data, error } = await supabase
      .from("blocked_ips")
      .select("*")
      .order("blocked_at", { ascending: false });
    if (error) throw error;
    return (data as BlockedIP[]) ?? [];
  },

  async unblockIP(id: string): Promise<void> {
    const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
    if (error) throw error;
  },

  async blockIP(params: BlockedIPInsert): Promise<void> {
    const { error } = await supabase.from("blocked_ips").insert(params);
    if (error) throw error;
  },

  async getRateLimitRules(): Promise<RateLimitRule[]> {
    const { data, error } = await supabase
      .from("rate_limit_rules")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data as RateLimitRule[]) ?? [];
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
