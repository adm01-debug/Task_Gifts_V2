import { ReactNode } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC, type AccessCheckOptions } from "@/hooks/useRBAC";
import { Loader2, ShieldX } from "lucide-react";

interface ProtectedRouteProps extends Partial<AccessCheckOptions> {
  children: ReactNode;
  redirectTo?: string;
  accessDeniedMessage?: string;
}

/**
 * ProtectedRoute - Protege rotas com verificação de autenticação e RBAC
 * 
 * @example
 * // Apenas autenticado
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Requer role admin
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @example
 * // Requer permissão específica
 * <ProtectedRoute requiredPermission="reports.view">
 *   <ReportsPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Requer nível mínimo 60
 * <ProtectedRoute minLevel={60}>
 *   <HRManagerPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  minLevel,
  requireAll = false,
  redirectTo = "/auth",
  accessDeniedMessage,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { canAccess, isLoading: rbacLoading } = useRBAC();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    const currentPath = window.location.pathname + window.location.search;
    return <Navigate to={`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Determinar se precisa verificar RBAC
  const needsRBACCheck = !!(
    requiredRole || 
    requiredRoles?.length || 
    requiredPermission || 
    requiredPermissions?.length ||
    minLevel !== undefined
  );

  // Se não precisa de verificação RBAC, apenas autenticação
  if (!needsRBACCheck) {
    return <>{children}</>;
  }

  // Show loading while checking roles/permissions
  if (rbacLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Build access check options
  const accessOptions: AccessCheckOptions = {
    requiredRole,
    requiredRoles,
    requiredPermission,
    requiredPermissions,
    minLevel,
    requireAll,
  };

  // Check if user has required access
  const hasAccess = canAccess(accessOptions);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            {accessDeniedMessage || 
              "Você não tem permissão para acessar esta página."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
