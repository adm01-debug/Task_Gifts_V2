import { memo, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
 import { GlobalBreadcrumbs } from "./GlobalBreadcrumbs";
 import { DesktopBackButton } from "./DesktopBackButton";
 import { MobileHeader } from "../MobileHeader";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  /** Page title for accessibility */
  title?: string;
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

  return (
    <div className={cn("min-h-screen", className)}>
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
      {children}
    </div>
  );
});
