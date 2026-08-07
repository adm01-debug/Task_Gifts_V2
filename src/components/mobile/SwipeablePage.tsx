import { memo, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft } from "lucide-react";

interface SwipeablePageProps {
  children: ReactNode;
  className?: string;
  /** Disable swipe back gesture */
  disableSwipe?: boolean;
  /** Show visual indicator on edge */
  showIndicator?: boolean;
}

/**
 * SwipeablePage - Wrapper component that enables iOS-like swipe back navigation
 * 
 * Usage:
 * <SwipeablePage>
 *   <YourPageContent />
 * </SwipeablePage>
 */
export const SwipeablePage = memo(function SwipeablePage({
  children,
  className,
  disableSwipe = false,
  showIndicator = true,
}: SwipeablePageProps) {
  const isMobile = useIsMobile();
  const { containerRef, isSwiping, progress } = useSwipeBack({
    disabled: disableSwipe || !isMobile,
  });

  // On desktop, just render children
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative min-h-screen", className)}
    >
      {/* Edge Indicator */}
      {showIndicator && isSwiping && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: progress,
            x: Math.min(progress * 40, 30),
            scale: 0.8 + progress * 0.2,
          }}
          className={cn(
            "fixed left-0 top-1/2 -translate-y-1/2 z-50",
            "w-10 h-10 rounded-full",
            "bg-primary/90 backdrop-blur-sm",
            "flex items-center justify-center",
            "shadow-lg shadow-primary/30",
          )}
        >
          <ChevronLeft className={cn(
            "w-5 h-5 text-primary-foreground",
            progress >= 1 && "animate-pulse"
          )} />
        </motion.div>
      )}

      {/* Page content with transform during swipe */}
      <motion.div
        animate={{
          x: isSwiping ? progress * 30 : 0,
          scale: isSwiping ? 1 - progress * 0.02 : 1,
        }}
        transition={{ type: "tween", duration: 0.1 }}
        className="min-h-full"
      >
        {children}
      </motion.div>

      {/* Overlay during swipe */}
      {isSwiping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: progress * 0.3 }}
          className="fixed inset-0 bg-black pointer-events-none z-40"
        />
      )}
    </div>
  );
});
