import { useState, useEffect, useRef, ReactNode, memo } from "react";
import { Skeleton, SkeletonList, SkeletonChart, SkeletonStatCard, SkeletonWidget } from "@/components/ui/skeleton";
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
        return <SkeletonList items={3} className={cn("p-4 rounded-xl border border-border bg-card/50", className)} />;
      case "chart":
        return <SkeletonChart className={cn("p-4 rounded-xl border border-border bg-card/50", className)} />;
      case "stats":
        return (
          <div className="grid grid-cols-2 gap-4">
            <SkeletonStatCard className="bg-card/50" />
            <SkeletonStatCard className="bg-card/50" />
          </div>
        );
      default:
        return <SkeletonWidget items={3} className={cn("bg-card/50", className)} />;
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
