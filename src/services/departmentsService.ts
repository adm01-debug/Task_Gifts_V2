import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Department = Tables<"departments">;
export type DepartmentInsert = TablesInsert<"departments">;
export type DepartmentUpdate = TablesUpdate<"departments">;
export type TeamMember = Tables<"team_members">;

export interface DepartmentWithMembers extends Department {
  team_members: TeamMember[];
}

export const departmentsService = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getWithMembers(id: string): Promise<DepartmentWithMembers | null> {
    const { data, error } = await supabase
      .from("departments")
      .select("*, team_members(*)")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async create(department: DepartmentInsert): Promise<Department> {
    const { data, error } = await supabase
      .from("departments")
      .insert(department)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: DepartmentUpdate): Promise<Department> {
    const { data, error } = await supabase
      .from("departments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // Team Members
  async getTeamMembers(departmentId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("department_id", departmentId);
    
    if (error) throw error;
    return data ?? [];
  },

  async addTeamMember(departmentId: string, userId: string, isManager = false): Promise<TeamMember> {
    const { data, error } = await supabase
      .from("team_members")
      .insert({ 
        department_id: departmentId, 
        user_id: userId, 
        is_manager: isManager 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeTeamMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);
    
    if (error) throw error;
  },

  async setManager(memberId: string, isManager: boolean): Promise<TeamMember> {
    const { data, error } = await supabase
      .from("team_members")
      .update({ is_manager: isManager })
      .eq("id", memberId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};
