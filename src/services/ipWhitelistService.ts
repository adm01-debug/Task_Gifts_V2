import { supabase } from "@/integrations/supabase/client";

export interface IpWhitelistEntry {
  id: string;
  ip_address: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface IpAccessLog {
  id: string;
  ip_address: string;
  user_id: string | null;
  endpoint: string | null;
  was_allowed: boolean;
  reason: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreateIpWhitelistInput {
  ip_address: string;
  description?: string;
  expires_at?: string;
}

export interface UpdateIpWhitelistInput {
  description?: string;
  is_active?: boolean;
  expires_at?: string | null;
}

class IpWhitelistService {
  async getWhitelist(): Promise<IpWhitelistEntry[]> {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as IpWhitelistEntry[];
  }

  async addIp(input: CreateIpWhitelistInput): Promise<IpWhitelistEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('ip_whitelist')
      .insert({
        ip_address: input.ip_address,
        description: input.description || null,
        expires_at: input.expires_at || null,
        created_by: user?.id
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to add IP to whitelist');
    return data as IpWhitelistEntry;
  }

  async updateIp(id: string, input: UpdateIpWhitelistInput): Promise<IpWhitelistEntry> {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .update(input)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('IP not found');
    return data as IpWhitelistEntry;
  }

  async deleteIp(id: string): Promise<void> {
    const { error } = await supabase
      .from('ip_whitelist')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async toggleIpStatus(id: string, isActive: boolean): Promise<IpWhitelistEntry> {
    return this.updateIp(id, { is_active: isActive });
  }

  async getAccessLogs(limit = 100): Promise<IpAccessLog[]> {
    const { data, error } = await supabase
      .from('ip_access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []) as IpAccessLog[];
  }

  async checkIpWhitelisted(ipAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_ip_whitelisted', { p_ip_address: ipAddress });
    
    if (error) throw error;
    return data as boolean;
  }

  async logAccess(
    ipAddress: string,
    userId: string | null,
    endpoint: string,
    wasAllowed: boolean,
    reason: string,
    userAgent: string
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('log_ip_access', {
        p_ip_address: ipAddress,
        p_user_id: (userId || null) as any,
        p_endpoint: endpoint,
        p_was_allowed: wasAllowed,
        p_reason: reason,
        p_user_agent: userAgent
      });
    
    if (error) throw error;
    return data as string;
  }

  // Validate IP address format
  validateIpAddress(ip: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/;
    
    // CIDR notation
    const cidrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip) || cidrPattern.test(ip);
  }
}

export const ipWhitelistService = new IpWhitelistService();
