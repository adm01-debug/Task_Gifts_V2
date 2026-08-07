import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMemo, useCallback } from "react";

export type AppRole = "admin" | "manager" | "employee";

export interface RoleInfo {
  id: string;
  key: string;
  name: string;
  description: string | null;
  level: number;
}

export interface PermissionInfo {
  id: string;
  key: string;
  name: string;
  module: string;
  category: string | null;
}

interface UserRoleData {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface RBACState {
  roles: AppRole[];
  permissions: string[];
  roleInfos: RoleInfo[];
  permissionInfos: PermissionInfo[];
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  highestLevel: number;
}

// Fetch user roles from user_roles table
async function fetchUserRoles(userId: string): Promise<UserRoleData[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []) as UserRoleData[];
}

// Fetch detailed role info from roles table
async function fetchRoleInfos(roleKeys: AppRole[]): Promise<RoleInfo[]> {
  if (roleKeys.length === 0) return [];
  
  const { data, error } = await supabase
    .from("roles")
    .select("id, key, name, description, level")
    .in("key", roleKeys);

  if (error) throw error;
  return (data || []) as RoleInfo[];
}

// Fetch permissions for given role IDs
async function fetchRolePermissions(roleIds: string[]): Promise<PermissionInfo[]> {
  if (roleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("role_permissions")
    .select(`
      permission_id,
      permissions:permission_id (
        id,
        key,
        name,
        module,
        category
      )
    `)
    .in("role_id", roleIds);

  if (error) throw error;
  
  // Extract unique permissions
  const permissionsMap = new Map<string, PermissionInfo>();
  (data || []).forEach((rp: { permissions: PermissionInfo | null }) => {
    if (rp.permissions) {
      permissionsMap.set(rp.permissions.id, rp.permissions);
    }
  });
  
  return Array.from(permissionsMap.values());
}

export function useRBAC(): RBACState & {
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasAllRoles: (roles: AppRole[]) => boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  hasMinLevel: (level: number) => boolean;
  canAccess: (options: AccessCheckOptions) => boolean;
} {
  const { user } = useAuth();

  // Fetch user's roles
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["rbac-user-roles", user?.id],
    queryFn: () => fetchUserRoles(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const roleKeys = useMemo(() => 
    userRoles.map(r => r.role), 
    [userRoles]
  );

  // Fetch detailed role info
  const { data: roleInfos = [], isLoading: roleInfosLoading } = useQuery({
    queryKey: ["rbac-role-infos", roleKeys],
    queryFn: () => fetchRoleInfos(roleKeys),
    enabled: roleKeys.length > 0,
    staleTime: 300000, // 5 minutes
  });

  const roleIds = useMemo(() => 
    roleInfos.map(r => r.id), 
    [roleInfos]
  );

  // Fetch permissions for user's roles
  const { data: permissionInfos = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["rbac-permissions", roleIds],
    queryFn: () => fetchRolePermissions(roleIds),
    enabled: roleIds.length > 0,
    staleTime: 300000, // 5 minutes
  });

  const permissions = useMemo(() => 
    permissionInfos.map(p => p.key), 
    [permissionInfos]
  );

  const highestLevel = useMemo(() => 
    roleInfos.length > 0 ? Math.max(...roleInfos.map(r => r.level)) : 0,
    [roleInfos]
  );

  const isAdmin = useMemo(() => 
    roleKeys.includes("admin") || permissions.includes("admin.full"),
    [roleKeys, permissions]
  );

  const isSuperAdmin = useMemo(() => 
    roleInfos.some(r => r.key === "super_admin") || highestLevel >= 100,
    [roleInfos, highestLevel]
  );

  const isManager = useMemo(() => 
    roleKeys.includes("admin") || roleKeys.includes("manager") || highestLevel >= 40,
    [roleKeys, highestLevel]
  );

  const isLoading = rolesLoading || roleInfosLoading || permissionsLoading;

  // Helper functions
  const hasRole = useCallback((role: AppRole): boolean => {
    return roleKeys.includes(role);
  }, [roleKeys]);

  const hasAnyRole = useCallback((roles: AppRole[]): boolean => {
    return roles.some(role => roleKeys.includes(role));
  }, [roleKeys]);

  const hasAllRoles = useCallback((roles: AppRole[]): boolean => {
    return roles.every(role => roleKeys.includes(role));
  }, [roleKeys]);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    // Super admin bypass
    if (permissions.includes("admin.full")) return true;
    return permissions.includes(permissionKey);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionKeys: string[]): boolean => {
    if (permissions.includes("admin.full")) return true;
    return permissionKeys.some(key => permissions.includes(key));
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionKeys: string[]): boolean => {
    if (permissions.includes("admin.full")) return true;
    return permissionKeys.every(key => permissions.includes(key));
  }, [permissions]);

  const hasMinLevel = useCallback((level: number): boolean => {
    return highestLevel >= level;
  }, [highestLevel]);

  const canAccess = useCallback((options: AccessCheckOptions): boolean => {
    // Super admin always has access
    if (permissions.includes("admin.full")) return true;

    const { 
      requiredRole, 
      requiredRoles, 
      requiredPermission, 
      requiredPermissions,
      minLevel,
      requireAll = false 
    } = options;

    const checks: boolean[] = [];

    if (requiredRole) {
      checks.push(hasRole(requiredRole));
    }

    if (requiredRoles && requiredRoles.length > 0) {
      checks.push(requireAll ? hasAllRoles(requiredRoles) : hasAnyRole(requiredRoles));
    }

    if (requiredPermission) {
      checks.push(hasPermission(requiredPermission));
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      checks.push(requireAll ? hasAllPermissions(requiredPermissions) : hasAnyPermission(requiredPermissions));
    }

    if (minLevel !== undefined) {
      checks.push(hasMinLevel(minLevel));
    }

    // If no checks specified, deny access
    if (checks.length === 0) return false;

    // If requireAll, all checks must pass; otherwise any check passing is enough
    return requireAll ? checks.every(Boolean) : checks.some(Boolean);
  }, [hasRole, hasAllRoles, hasAnyRole, hasPermission, hasAllPermissions, hasAnyPermission, hasMinLevel, permissions]);

  return {
    roles: roleKeys,
    permissions,
    roleInfos,
    permissionInfos,
    isLoading,
    isAdmin,
    isManager,
    isSuperAdmin,
    highestLevel,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinLevel,
    canAccess,
  };
}

export interface AccessCheckOptions {
  requiredRole?: AppRole;
  requiredRoles?: AppRole[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  minLevel?: number;
  requireAll?: boolean;
}

// Convenience hooks
export function useHasPermission(permissionKey: string) {
  const { hasPermission, isLoading } = useRBAC();
  return { hasPermission: hasPermission(permissionKey), isLoading };
}

export function useCanAccess(options: AccessCheckOptions) {
  const { canAccess, isLoading } = useRBAC();
  return { canAccess: canAccess(options), isLoading };
}
