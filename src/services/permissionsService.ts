import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";

export interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  module: string;
  category: string;
  is_system: boolean;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  level: number;
  is_system: boolean;
  is_active: boolean;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export const permissionsService = {
  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase.from('permissions').select('*').order('module, name');
    if (error) { logger.error('Failed to fetch permissions', 'Permissions', error); throw error; }
    return (data || []) as unknown as Permission[];
  },

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    const { data, error } = await supabase.from('permissions').select('*').eq('module', module).order('name');
    if (error) { logger.error('Failed to fetch permissions', 'Permissions', error); throw error; }
    return (data || []) as unknown as Permission[];
  },

  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase.from('roles').select('*').order('level', { ascending: false });
    if (error) { logger.error('Failed to fetch roles', 'Permissions', error); throw error; }
    return (data || []) as unknown as Role[];
  },

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase.from('role_permissions').select('permission_id').eq('role_id', roleId);
    if (error) { logger.error('Failed to fetch role permissions', 'Permissions', error); throw error; }
    
    const permissionIds = (data || []).map(rp => rp.permission_id);
    if (permissionIds.length === 0) return [];
    
    const { data: permissions } = await supabase.from('permissions').select('*').in('id', permissionIds);
    return (permissions || []) as unknown as Permission[];
  },

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permissionId });
    if (error) { logger.error('Failed to assign permission', 'Permissions', error); throw error; }
  },

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permissionId);
    if (error) { logger.error('Failed to remove permission', 'Permissions', error); throw error; }
  },

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase.from('user_roles').select('*').eq('user_id', userId);
    if (error) { logger.error('Failed to fetch user roles', 'Permissions', error); throw error; }
    return (data || []) as unknown as UserRole[];
  },

  async assignRoleToUser(userId: string, roleKey: 'admin' | 'manager' | 'employee'): Promise<void> {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: roleKey });
    if (error) { logger.error('Failed to assign role', 'Permissions', error); throw error; }
  },

  async removeRoleFromUser(userId: string, roleKey: 'admin' | 'manager' | 'employee'): Promise<void> {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', roleKey);
    if (error) { logger.error('Failed to remove role', 'Permissions', error); throw error; }
  },

  async checkUserPermission(userId: string, permissionKey: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    if (userRoles.length === 0) return false;

    const roles = await this.getRoles();
    const userRoleKeys = userRoles.map(ur => ur.role);
    const matchingRoles = roles.filter(r => userRoleKeys.includes(r.key));

    for (const role of matchingRoles) {
      if (role.key === 'super_admin') return true;
      
      const permissions = await this.getRolePermissions(role.id);
      if (permissions.some(p => p.key === permissionKey || p.key === 'admin.full')) return true;
    }

    return false;
  },

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId);
    if (userRoles.length === 0) return [];

    const roles = await this.getRoles();
    const userRoleKeys = userRoles.map(ur => ur.role);
    const matchingRoles = roles.filter(r => userRoleKeys.includes(r.key));

    const allPermissions = new Set<string>();
    
    for (const role of matchingRoles) {
      if (role.key === 'super_admin') {
        const allPerms = await this.getPermissions();
        allPerms.forEach(p => allPermissions.add(p.key));
        break;
      }
      
      const permissions = await this.getRolePermissions(role.id);
      permissions.forEach(p => allPermissions.add(p.key));
    }

    return Array.from(allPermissions);
  },
};
