 import { memo, ReactNode, useEffect, useCallback } from "react";
 import { Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalBreadcrumbs } from "./GlobalBreadcrumbs";
import { DesktopBackButton } from "./DesktopBackButton";
import { MobileHeader } from "../MobileHeader";
import { PageTransition } from "./PageTransition";
import { TopLoadingBar } from "./TopLoadingBar";
import { cn } from "@/lib/utils";
import { useScrollRestoration } from "@/hooks/useNavigationHelpers";
 import { PullToRefresh } from "../mobile/PullToRefresh";
 import { useQueryClient } from "@tanstack/react-query";
 import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface PageShellProps {
  children: ReactNode;
  /** Page title displayed in header and for accessibility */
  title: string;
  /** Subtitle displayed under the title */
  subtitle?: string;
  /** Icon displayed next to title in header */
  icon?: React.ReactNode;
  /** Additional class for the content wrapper */
  className?: string;
  /** Override fallback path for back button */
  backFallback?: string;
  /** Path for back button */
  backPath?: string;
  /** Hide the back button */
  hideBackButton?: boolean;
  /** Hide breadcrumbs */
  hideBreadcrumbs?: boolean;
  /** Hide the entire header section */
  hideHeader?: boolean;
  /** Custom header background gradient */
  headerGradient?: string;
}

/**
 * PageShell - Consistent page wrapper for all level 2+ pages
 * 
 * Provides:
 * - Desktop back button (auto-hidden on root)
 * - Breadcrumbs navigation
 * - Focus management on mount
 * - Consistent padding
 */
export const PageShell = memo(function PageShell({
  children,
   title = "Página",
   subtitle,
   icon,
   className,
   backFallback = "/",
   backPath,
   hideBackButton = false,
   hideBreadcrumbs = false,
   hideHeader = false,
   headerGradient,
 }: PageShellProps) {
  const isMobile = useIsMobile();

  // Apply scroll restoration to all pages using PageShell
  useScrollRestoration();

  // Focus management: scroll to top on mount for level 2+ pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

   const queryClient = useQueryClient();
   const haptic = useHapticFeedback();
 
   const handleRefresh = useCallback(async () => {
     haptic.trigger("light");
     // Invalida todas as queries para recarregar os dados da página
     await queryClient.invalidateQueries();
     haptic.trigger("success");
   }, [queryClient, haptic]);
 
   const content = (
     <div className={cn("min-h-screen", className)}>
       <TopLoadingBar />
       
       {isMobile && !hideHeader && <MobileHeader title={title} />}
 
         {!hideHeader && (
          <header className={cn(
            "px-6 md:px-12 pt-8 pb-8 border-b border-border/30 mb-8 sticky top-0 z-20 transition-all duration-500 shadow-xl shadow-black/5",
            headerGradient || "bg-background/60 backdrop-blur-2xl"
          )}>
            <div className="max-w-7xl mx-auto w-full">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {!isMobile && !hideBackButton && (
                    <DesktopBackButton fallbackPath={backPath || backFallback} />
                  )}
                  <div className="flex flex-col">
                    {!isMobile && !hideBreadcrumbs && <GlobalBreadcrumbs className="mb-3 opacity-70" />}
                    {isMobile && !hideBreadcrumbs && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-black mb-1.5 ml-0.5">
                        Visualizando {title}
                      </span>
                    )}
                    <div className="flex items-center gap-4">
                      {icon && (
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-glow-sm ring-1 ring-primary/30 backdrop-blur-md">
                          {icon}
                        </div>
                      )}
                      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-none drop-shadow-sm">
                        {title}
                      </h1>
                    </div>
                    {subtitle && (
                      <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-3xl leading-relaxed opacity-90 font-medium">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-3 bg-primary/5 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-primary/20 shadow-glow-sm shrink-0">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/90">
                    Protocolo de Treinamento Elite
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}
 
       {/* Content */}
       <main className="focus:outline-none" tabIndex={-1}>
         {children}
       </main>
     </div>
   );
 
   return (
     <PageTransition>
       {isMobile ? (
         <PullToRefresh onRefresh={handleRefresh}>
           {content}
         </PullToRefresh>
       ) : (
         content
       )}
     </PageTransition>
   );
});
