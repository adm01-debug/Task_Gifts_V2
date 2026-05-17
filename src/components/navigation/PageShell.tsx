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
  title,
  className,
  backFallback = "/",
  hideBackButton = false,
  hideBreadcrumbs = false,
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
       {isMobile ? (
         <MobileHeader title={title} />
       ) : (
         <div className="px-4 md:px-6 pt-4 flex items-center gap-3">
           {!hideBackButton && <DesktopBackButton fallbackPath={backFallback} />}
           {!hideBreadcrumbs && <GlobalBreadcrumbs className="mb-0" />}
         </div>
       )}
 
       {/* Page title (sr-only if using breadcrumbs) */}
       {title && <h1 className="sr-only">{title}</h1>}
 
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
