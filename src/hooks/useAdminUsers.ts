import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type AppRole } from "./useRBAC";

export const adminUsersKeys = {
  all: ["admin-users"] as const,
  roles: () => [...adminUsersKeys.all, "roles"] as const,
  teamMembers: () => [...adminUsersKeys.all, "team-members"] as const,
};

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  department_id: string;
  is_manager: boolean;
  joined_at: string;
}

// Fetch all user roles (admin only)
export function useAllUserRoles() {
  return useQuery({
    queryKey: adminUsersKeys.roles(),
    queryFn: async (): Promise<UserRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserRole[];
    },
    staleTime: 30000,
  });
}

// Fetch all team members (admin only)
export function useAllTeamMembers() {
  return useQuery({
    queryKey: adminUsersKeys.teamMembers(),
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("joined_at", { ascending: false });

      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    staleTime: 30000,
  });
}

// Assign role to user
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Check if role already exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role)
        .maybeSingle();

      if (existing) {
        throw new Error("Usuário já possui este role");
      }

      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to assign role');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

// Remove role from user
export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

// Assign user to department
export function useAssignDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, departmentId, isManager = false }: { 
      userId: string; 
      departmentId: string;
      isManager?: boolean;
    }) => {
      // Check if already member
      const { data: existing } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", userId)
        .eq("department_id", departmentId)
        .maybeSingle();

      if (existing) {
        throw new Error("Usuário já é membro deste departamento");
      }

      const { data, error } = await supabase
        .from("team_members")
        .insert({ 
          user_id: userId, 
          department_id: departmentId,
          is_manager: isManager,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to assign department');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.teamMembers() });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

// Remove user from department
export function useRemoveDepartmentMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.teamMembers() });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

// Set/unset department manager
export function useSetDepartmentManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, isManager }: { memberId: string; isManager: boolean }) => {
      const { data, error } = await supabase
        .from("team_members")
        .update({ is_manager: isManager })
        .eq("id", memberId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Team member not found');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.teamMembers() });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

// ============ BULK ACTIONS ============

// Bulk assign role to multiple users
export function useBulkAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: AppRole }) => {
      const results = await Promise.allSettled(
        userIds.map(async (userId) => {
          // Check if role already exists
          const { data: existing } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", userId)
            .eq("role", role)
            .maybeSingle();

          if (existing) {
            return { userId, skipped: true };
          }

          const { data, error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role })
            .select()
            .maybeSingle();

          if (error) throw error;
          return { userId, data };
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: userIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

// Bulk remove role from multiple users
export function useBulkRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: AppRole }) => {
      const results = await Promise.allSettled(
        userIds.map(async (userId) => {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", role);

          if (error) throw error;
          return { userId };
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: userIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

// Bulk assign users to department
export function useBulkAssignDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, departmentId }: { userIds: string[]; departmentId: string }) => {
      const results = await Promise.allSettled(
        userIds.map(async (userId) => {
          // Check if already member
          const { data: existing } = await supabase
            .from("team_members")
            .select("id")
            .eq("user_id", userId)
            .eq("department_id", departmentId)
            .maybeSingle();

          if (existing) {
            return { userId, skipped: true };
          }

          const { data, error } = await supabase
            .from("team_members")
            .insert({ user_id: userId, department_id: departmentId, is_manager: false })
            .select()
            .maybeSingle();

          if (error) throw error;
          return { userId, data };
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: userIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.teamMembers() });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

// Bulk remove users from all departments
export function useBulkRemoveFromDepartments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map(async (userId) => {
          const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("user_id", userId);

          if (error) throw error;
          return { userId };
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: userIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.teamMembers() });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
