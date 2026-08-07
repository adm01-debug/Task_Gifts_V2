import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsService, type Permission, type Role } from "@/services/permissionsService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const usePermissions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsService.getPermissions(),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionsService.getRoles(),
  });

  const userRolesQuery = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: () => permissionsService.getUserRoles(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.id) {
      permissionsService.getUserPermissions(user.id).then(setUserPermissions);
    }
  }, [user?.id]);

  const assignPermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      permissionsService.assignPermissionToRole(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissão atribuída!');
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      permissionsService.removePermissionFromRole(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissão removida!');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleKey }: { userId: string; roleKey: 'admin' | 'manager' | 'employee' }) =>
      permissionsService.assignRoleToUser(userId, roleKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role atribuída!');
    },
  });

  const hasPermission = (permissionKey: string): boolean => {
    return userPermissions.includes(permissionKey) || userPermissions.includes('admin.full');
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some(key => hasPermission(key));
  };

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every(key => hasPermission(key));
  };

  return {
    permissions: permissionsQuery.data || [],
    roles: rolesQuery.data || [],
    userRoles: userRolesQuery.data || [],
    userPermissions,
    isLoading: permissionsQuery.isLoading,
    assignPermission: assignPermissionMutation.mutate,
    removePermission: removePermissionMutation.mutate,
    assignRole: assignRoleMutation.mutate,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getRolePermissions: permissionsService.getRolePermissions,
  };
};
