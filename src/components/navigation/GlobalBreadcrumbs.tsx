import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Home,
  User,
  Trophy,
  Target,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  Shield,
  Gift,
  Calendar,
  MessageCircle,
  Zap,
  Award,
  TrendingUp,
  FileText,
  Bell,
  Swords,
  Brain,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Route configuration with labels and icons
interface RouteConfig {
  label: string;
  icon?: LucideIcon;
  parent?: string;
  group?: string;
}

const routeConfig: Record<string, RouteConfig> = {
  // Dashboard Principal
  "/": { label: "Dashboard", icon: Home, group: "principal" },
  
  // Perfil e Usuário
  "/profile": { label: "Perfil", icon: User, parent: "/", group: "usuario" },
  "/estatisticas": { label: "Estatísticas", icon: BarChart3, parent: "/", group: "usuario" },
  
  // Gamificação
  "/conquistas": { label: "Conquistas", icon: Trophy, parent: "/", group: "gamificacao" },
  "/leagues": { label: "Ligas", icon: Award, parent: "/", group: "gamificacao" },
  "/duelos": { label: "Duelos", icon: Swords, parent: "/", group: "gamificacao" },
   "/loja": { label: "Marketplace", icon: Gift, parent: "/", group: "gamificacao" },
   "/loja/admin": { label: "Administrar Loja", icon: Settings, parent: "/loja", group: "gamificacao" },
  
  // Desenvolvimento
  "/goals": { label: "Metas", icon: Target, parent: "/", group: "desenvolvimento" },
   "/trails": { label: "Trilhas", icon: BookOpen, parent: "/", group: "desenvolvimento" },
   "/mentoria": { label: "Mentoria", icon: Users, parent: "/", group: "desenvolvimento" },
  "/quiz": { label: "Quiz Diário", icon: Brain, parent: "/", group: "desenvolvimento" },
  "/quiz/admin": { label: "Administrar Quiz", icon: Settings, parent: "/quiz", group: "desenvolvimento" },
  
   // Engajamento
   "/feed": { label: "Social", icon: MessageCircle, parent: "/", group: "engajamento" },
  "/announcements": { label: "Anúncios", icon: Bell, parent: "/", group: "engajamento" },
  "/feedback": { label: "Feedback", icon: FileText, parent: "/", group: "engajamento" },
  "/surveys": { label: "Pesquisas", icon: FileText, parent: "/", group: "engajamento" },
  "/checkins": { label: "Check-ins", icon: Calendar, parent: "/", group: "engajamento" },
  "/engajamento": { label: "Engajamento", icon: TrendingUp, parent: "/", group: "engajamento" },
  "/engajamento/diagnostico": { label: "Diagnóstico de Clima", icon: BarChart3, parent: "/engajamento", group: "engajamento" },
  
   // Operações
   "/ponto": { label: "Registro de Ponto", icon: Calendar, parent: "/", group: "operacoes" },
  
  // Analytics & BI
  "/analytics": { label: "Analytics", icon: TrendingUp, parent: "/", group: "analytics" },
  "/reports": { label: "Relatórios", icon: BarChart3, parent: "/", group: "analytics" },
  "/bi": { label: "Business Intelligence", icon: TrendingUp, parent: "/", group: "analytics" },
  "/executivo": { label: "Dashboard Executivo", icon: BarChart3, parent: "/", group: "analytics" },
  
  // Administração
  "/admin": { label: "Painel Admin", icon: Settings, parent: "/", group: "admin" },
  "/admin/permissions": { label: "Permissões", icon: Shield, parent: "/admin", group: "admin" },
  "/manager": { label: "Painel Gestor", icon: Building2, parent: "/", group: "admin" },
  "/quest-builder": { label: "Criar Quest", icon: Zap, parent: "/manager", group: "admin" },
  "/audit": { label: "Logs de Auditoria", icon: FileText, parent: "/admin", group: "admin" },
  "/security": { label: "Segurança", icon: Shield, parent: "/", group: "admin" },
  "/bitrix24": { label: "Bitrix24 CRM", icon: Building2, parent: "/admin", group: "admin" },
};

// Group labels for organization
const groupLabels: Record<string, string> = {
  principal: "Principal",
  usuario: "Usuário",
  gamificacao: "Gamificação",
  desenvolvimento: "Desenvolvimento",
  engajamento: "Engajamento",
  operacoes: "Operações",
  analytics: "Analytics",
  admin: "Administração",
};

interface GlobalBreadcrumbsProps {
  className?: string;
  showHome?: boolean;
  showGroup?: boolean;
}

export function GlobalBreadcrumbs({ 
  className, 
  showHome = true,
  showGroup = false 
}: GlobalBreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    const items: { path: string; label: string; icon?: LucideIcon; isLast: boolean }[] = [];
    
    // Handle dynamic routes (e.g., /trails/:id, /eventos/:eventId)
    const pathSegments = path.split("/").filter(Boolean);
    let currentPath = "";
    
    // Check for exact match first
    const exactConfig = routeConfig[path];
    
    if (exactConfig) {
      // Build breadcrumb chain from parent references
      let configPath = path;
      const chain: string[] = [];
      
      while (configPath && routeConfig[configPath]) {
        chain.unshift(configPath);
        configPath = routeConfig[configPath].parent || "";
      }
      
      // If showHome and root isn't in chain, add it
      if (showHome && chain[0] !== "/") {
        chain.unshift("/");
      }
      
      chain.forEach((p, index) => {
        const config = routeConfig[p];
        if (config) {
          items.push({
            path: p,
            label: config.label,
            icon: config.icon,
            isLast: index === chain.length - 1,
          });
        }
      });
    } else {
      // Handle dynamic routes - build path progressively
      if (showHome) {
        items.push({
          path: "/",
          label: "Dashboard",
          icon: Home,
          isLast: pathSegments.length === 0,
        });
      }
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const config = routeConfig[currentPath];
        
        if (config) {
          items.push({
            path: currentPath,
            label: config.label,
            icon: config.icon,
            isLast: index === pathSegments.length - 1,
          });
        } else if (index === pathSegments.length - 1) {
          // Last segment might be a dynamic ID
          const parentPath = "/" + pathSegments.slice(0, -1).join("/");
          const parentConfig = routeConfig[parentPath];
          
          if (parentConfig) {
            // Check if segment looks like an ID (UUID or number)
            const isId = /^[0-9a-f-]{36}$|^\d+$/.test(segment);
            items.push({
              path: currentPath,
              label: isId ? "Detalhes" : segment,
              isLast: true,
            });
          }
        }
      });
    }
    
    return items;
  }, [location.pathname, showHome]);

  // Don't render if only home or empty
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const currentConfig = routeConfig[location.pathname];
  const groupLabel = currentConfig?.group ? groupLabels[currentConfig.group] : null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("mb-4", className)}
    >
      <Breadcrumb>
        <BreadcrumbList>
          {showGroup && groupLabel && (
            <>
              <BreadcrumbItem>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {groupLabel}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem key={item.path}>
              {item.isLast ? (
                <BreadcrumbPage className="flex items-center gap-1.5">
                  {item.icon && <item.icon className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link 
                      to={item.path} 
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.nav>
  );
}

// Hook to get current route info
export function useCurrentRoute() {
  const location = useLocation();
  
  return useMemo(() => {
    const config = routeConfig[location.pathname];
    return {
      path: location.pathname,
      label: config?.label || "Página",
      icon: config?.icon,
      group: config?.group,
      groupLabel: config?.group ? groupLabels[config.group] : undefined,
    };
  }, [location.pathname]);
}

// Export route config for external use
export { routeConfig, groupLabels };
