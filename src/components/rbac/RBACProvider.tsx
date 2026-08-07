import { ReactNode, createContext, useContext } from "react";
import { useRBAC, type AppRole, type RoleInfo, type PermissionInfo, type AccessCheckOptions } from "@/hooks/useRBAC";

interface RBACContextValue {
  roles: AppRole[];
  permissions: string[];
  roleInfos: RoleInfo[];
  permissionInfos: PermissionInfo[];
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  highestLevel: number;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasAllRoles: (roles: AppRole[]) => boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  hasMinLevel: (level: number) => boolean;
  canAccess: (options: AccessCheckOptions) => boolean;
}

const RBACContext = createContext<RBACContextValue | null>(null);

/**
 * RBACProvider - Provider para disponibilizar contexto RBAC globalmente
 * Use este provider no nível da aplicação para evitar múltiplas queries
 */
export function RBACProvider({ children }: { children: ReactNode }) {
  const rbacState = useRBAC();

  return (
    <RBACContext.Provider value={rbacState}>
      {children}
    </RBACContext.Provider>
  );
}

/**
 * useRBACContext - Hook para acessar o contexto RBAC
 * Usa o provider se disponível, senão faz as queries diretamente
 */
export function useRBACContext() {
  const context = useContext(RBACContext);
  
  if (!context) {
    throw new Error("useRBACContext must be used within a RBACProvider");
  }
  
  return context;
}
