import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { AppRole } from "@/hooks/useRBAC";

export interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  module: string;
  category: string | null;
  is_system: boolean;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description: string | null;
  level: number;
  is_system: boolean;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserRoleWithProfile extends UserRole {
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export const rbacService = {
  // ===== PERMISSIONS =====
  
  async getPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Permission[];
    } catch (error) {
      logger.apiError("getPermissions", error, "RBACService");
      return [];
    }
  },

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .eq("module", module)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Permission[];
  },

  async createPermission(permission: Omit<Permission, "id">): Promise<Permission> {
    const { data, error } = await supabase
      .from("permissions")
      .insert(permission)
      .select()
      .single();

    if (error) throw error;
    return data as Permission;
  },

  async updatePermission(id: string, updates: Partial<Permission>): Promise<Permission> {
    const { data, error } = await supabase
      .from("permissions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Permission;
  },

  async deletePermission(id: string): Promise<void> {
    const { error } = await supabase
      .from("permissions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ===== ROLES =====
  
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("level", { ascending: false });

    if (error) throw error;
    return data as Role[];
  },

  async getRoleByKey(key: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    return data as Role | null;
  },

  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const { data, error } = await supabase
      .from("roles")
      .insert(role)
      .select()
      .single();

    if (error) throw error;
    return data as Role;
  },

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const { data, error } = await supabase
      .from("roles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Role;
  },

  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ===== ROLE PERMISSIONS =====
  
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from("role_permissions")
      .select(`
        permission_id,
        permissions:permission_id (*)
      `)
      .eq("role_id", roleId);

    if (error) throw error;
     return (data || []).map((rp) => (rp as any).permissions).filter(Boolean) as Permission[];
  },

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from("role_permissions")
      .insert({ role_id: roleId, permission_id: permissionId });

    if (error) throw error;
  },

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_id", permissionId);

    if (error) throw error;
  },

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Remove all existing permissions
    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId);

    if (deleteError) throw deleteError;

    // Add new permissions
    if (permissionIds.length > 0) {
      const { error: insertError } = await supabase
        .from("role_permissions")
        .insert(permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
        })));

      if (insertError) throw insertError;
    }
  },

  // ===== USER ROLES =====
  
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data as UserRole[];
  },

  async getAllUserRoles(): Promise<UserRoleWithProfile[]> {
    // Get user roles first
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) throw rolesError;

    // Get profile data separately
    const userIds = [...new Set(userRoles?.map(r => r.user_id) || [])];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    // Map profiles to roles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    return (userRoles || []).map(role => ({
      ...role,
      profiles: profileMap.get(role.user_id) || null,
    })) as UserRoleWithProfile[];
  },

  async assignRoleToUser(userId: string, role: AppRole): Promise<UserRole> {
    const { data, error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role })
      .select()
      .single();

    if (error) throw error;
    return data as UserRole;
  },

  async removeRoleFromUser(userId: string, role: AppRole): Promise<void> {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw error;
  },

  async setUserRoles(userId: string, roles: AppRole[]): Promise<void> {
    // Remove all existing roles
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Add new roles
    if (roles.length > 0) {
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(roles.map(role => ({
          user_id: userId,
          role,
        })));

      if (insertError) throw insertError;
    }
  },

  // ===== USER PERMISSIONS (computed) =====
  
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Get user's roles
      const userRoles = await this.getUserRoles(userId);
      const roleKeys = userRoles.map(r => r.role);

      if (roleKeys.length === 0) return [];

      // Get role IDs from roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id")
        .in("key", roleKeys);

      if (rolesError) throw rolesError;
      const roleIds = (rolesData || []).map(r => r.id);

      if (roleIds.length === 0) return [];

      // Get permissions for those roles
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("role_permissions")
        .select(`
          permissions:permission_id (key)
        `)
        .in("role_id", roleIds);

      if (permissionsError) throw permissionsError;

      // Extract unique permission keys
      interface PermissionWithKey { permissions: { key: string } | null }
      const permissionKeys = new Set<string>();
      (permissionsData || []).forEach((rp: any) => {
        if (rp.permissions?.key) {
          permissionKeys.add(rp.permissions.key);
        }
      });

      return Array.from(permissionKeys);
    } catch (error) {
      logger.apiError("getUserPermissions", error, "RBACService");
      return [];
    }
  },

  async checkUserPermission(userId: string, permissionKey: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes("admin.full") || permissions.includes(permissionKey);
  },
};
