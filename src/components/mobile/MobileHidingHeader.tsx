import { memo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileHidingHeaderProps {
  children: ReactNode;
  className?: string;
  /** Always show header (disable hiding behavior) */
  alwaysShow?: boolean;
  /** Threshold in pixels before direction change triggers */
  threshold?: number;
}

/**
 * MobileHidingHeader - Header that hides on scroll down, shows on scroll up
 * 
 * Features:
 * - Smooth animation with framer-motion
 * - Always visible when at top of page
 * - Respects reduced motion preferences
 * - Safe area support for notched devices
 */
export const MobileHidingHeader = memo(function MobileHidingHeader({
  children,
  className,
  alwaysShow = false,
  threshold = 15,
}: MobileHidingHeaderProps) {
  const { direction, isAtTop } = useScrollDirection({ threshold });
  const isMobile = useIsMobile();

  // On desktop, always show
  if (!isMobile) {
    return (
      <header className={cn("sticky top-0 z-40", className)}>
        {children}
      </header>
    );
  }

  // Calculate visibility
  const isVisible = alwaysShow || isAtTop || direction === "up";

  return (
    <AnimatePresence>
      <motion.header
        initial={{ y: 0 }}
        animate={{ 
          y: isVisible ? 0 : "-100%",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 0.8,
        }}
        className={cn(
          "sticky top-0 z-40",
          "bg-background/95 backdrop-blur-xl",
          "border-b border-border/50",
          "safe-area-top",
          className
        )}
      >
        {children}
      </motion.header>
    </AnimatePresence>
  );
});
