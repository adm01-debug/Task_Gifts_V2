import { ReactNode } from "react";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePerformanceTrack } from "@/hooks/usePerformanceTrack";


interface PageWrapperProps {
  children: ReactNode;
  pageName: string;
  className?: string;
}

/**
 * PageWrapper - Provides consistent error handling for all pages
 * 
 * Wraps page content with:
 * - Top-level ErrorBoundary for critical errors (full page recovery)
 * - SectionErrorBoundary for section-level errors (partial recovery)
 */
export function PageWrapper({ children, pageName, className }: PageWrapperProps) {
  usePerformanceTrack(pageName);

  return (
    <ErrorBoundary>
      <SectionErrorBoundary sectionName={pageName}>
        <div className={className}>
          {children}
        </div>
      </SectionErrorBoundary>
    </ErrorBoundary>
  );
}

/**
 * SectionWrapper - Wraps individual sections within a page
 * Use for widgets, cards, and components that can fail independently
 */
interface SectionWrapperProps {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
}

export function SectionWrapper({ children, sectionName, fallback }: SectionWrapperProps) {
  return (
    <SectionErrorBoundary sectionName={sectionName} fallback={fallback}>
      {children}
    </SectionErrorBoundary>
  );
}
