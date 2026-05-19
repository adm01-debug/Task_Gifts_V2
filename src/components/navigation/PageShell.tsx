 import { memo, ReactNode, useEffect, useCallback } from "react";
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
  /** Hide the back button */
  hideBackButton?: boolean;
  /** Hide breadcrumbs */
  hideBreadcrumbs?: boolean;
  /** Hide the entire header section */
  hideHeader?: boolean;
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
   hideBackButton = false,
   hideBreadcrumbs = false,
   hideHeader = false,
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
          <header className="px-4 md:px-6 pt-6 pb-6 border-b border-border/50 mb-6 bg-background/80 backdrop-blur-md sticky top-0 z-20 transition-all duration-300">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {!isMobile && !hideBackButton && <DesktopBackButton fallbackPath={backFallback} />}
                  <div className="flex flex-col">
                     {!isMobile && !hideBreadcrumbs && <GlobalBreadcrumbs className="mb-2" />}
                     {isMobile && !hideBreadcrumbs && (
                       <span className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-1 ml-0.5">
                         Visualizando {title}
                       </span>
                     )}
                    <div className="flex items-center gap-2">
                       {icon && <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">{icon}</div>}
                       <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground leading-none">{title}</h1>
                    </div>
                     {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed opacity-80 font-medium">{subtitle}</p>}
                  </div>
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
