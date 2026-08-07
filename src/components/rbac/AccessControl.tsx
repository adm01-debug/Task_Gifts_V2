import { ReactNode } from "react";
import { useRBAC, type AccessCheckOptions, type AppRole } from "@/hooks/useRBAC";
import { Loader2, ShieldX } from "lucide-react";

interface AccessControlProps extends AccessCheckOptions {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * AccessControl - Componente wrapper para controle de acesso declarativo
 * 
 * @example
 * // Verificar role
 * <AccessControl requiredRole="admin">
 *   <AdminPanel />
 * </AccessControl>
 * 
 * @example
 * // Verificar permissão
 * <AccessControl requiredPermission="users.edit">
 *   <EditUserButton />
 * </AccessControl>
 * 
 * @example
 * // Verificar múltiplas permissões (qualquer uma)
 * <AccessControl requiredPermissions={["reports.view", "reports.export"]}>
 *   <ReportsSection />
 * </AccessControl>
 * 
 * @example
 * // Verificar nível mínimo
 * <AccessControl minLevel={60}>
 *   <HRManagerTools />
 * </AccessControl>
 * 
 * @example
 * // Combinação com requireAll
 * <AccessControl 
 *   requiredRole="manager" 
 *   requiredPermission="feedback.manage"
 *   requireAll
 * >
 *   <FeedbackManagement />
 * </AccessControl>
 */
export function AccessControl({
  children,
  fallback = null,
  loadingFallback,
  showAccessDenied = false,
  ...accessOptions
}: AccessControlProps) {
  const { canAccess, isLoading } = useRBAC();

  if (isLoading) {
    return loadingFallback !== undefined ? (
      <>{loadingFallback}</>
    ) : (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasAccess = canAccess(accessOptions);

  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar este recurso.
          </p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * RequireRole - Atalho para verificar role específica
 */
export function RequireRole({
  role,
  children,
  fallback,
  showAccessDenied,
}: {
  role: AppRole;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <AccessControl
      requiredRole={role}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </AccessControl>
  );
}

/**
 * RequirePermission - Atalho para verificar permissão específica
 */
export function RequirePermission({
  permission,
  children,
  fallback,
  showAccessDenied,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <AccessControl
      requiredPermission={permission}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </AccessControl>
  );
}

/**
 * RequireAdmin - Atalho para verificar se é admin
 */
export function RequireAdmin({
  children,
  fallback,
  showAccessDenied,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <AccessControl
      requiredRole="admin"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </AccessControl>
  );
}

/**
 * RequireManager - Atalho para verificar se é manager ou admin
 */
export function RequireManager({
  children,
  fallback,
  showAccessDenied,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <AccessControl
      requiredRoles={["admin", "manager"]}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </AccessControl>
  );
}

/**
 * RequireLevel - Atalho para verificar nível mínimo
 */
export function RequireLevel({
  level,
  children,
  fallback,
  showAccessDenied,
}: {
  level: number;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <AccessControl
      minLevel={level}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </AccessControl>
  );
}
