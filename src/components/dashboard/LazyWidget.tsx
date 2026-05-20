import { useState, useEffect, useRef, ReactNode, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LazyWidgetProps {
  children: ReactNode;
  fallbackHeight?: string;
  rootMargin?: string;
  threshold?: number;
  variant?: "list" | "card" | "chart" | "stats";
  className?: string;
}

/**
 * LazyWidget - Renders children only when visible in viewport with high-performance skeletons
 */
export const LazyWidget = memo(function LazyWidget({ 
  children, 
  fallbackHeight = "200px",
  rootMargin = "200px",
  threshold = 0.01,
  variant = "card",
  className
}: LazyWidgetProps) {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasBeenVisible(true);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const renderSkeleton = () => {
    switch (variant) {
      case "list":
        return (
          <div className="space-y-4 p-4 rounded-xl border border-border bg-card/50">
            <Skeleton variant="shimmer" className="h-6 w-1/4 mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton shape="circle" className="h-10 w-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      case "chart":
        return (
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <Skeleton variant="shimmer" className="h-6 w-1/3 mb-6" />
            <div className="flex items-end gap-2 h-32">
              {[60, 40, 80, 50, 90, 70, 45].map((h, i) => (
                <Skeleton 
                  key={i} 
                  variant="glow" 
                  className="flex-1 rounded-t-md" 
                  style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }} 
                />
              ))}
            </div>
          </div>
        );
      case "stats":
        return (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card/50">
                <Skeleton variant="shimmer" className="h-4 w-1/2 mb-2" />
                <Skeleton variant="glow" className="h-8 w-3/4" />
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className={cn("p-4 rounded-xl border border-border bg-card/50 space-y-4", className)}>
            <div className="flex items-center justify-between">
              <Skeleton variant="shimmer" className="h-6 w-1/3" />
              <Skeleton shape="pill" className="h-6 w-12" />
            </div>
            <Skeleton variant="glow" className="h-24 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} style={{ minHeight: fallbackHeight }} className={className}>
      <AnimatePresence mode="wait">
        {!hasBeenVisible ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderSkeleton()}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
