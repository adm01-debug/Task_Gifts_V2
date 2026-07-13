import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useHapticFeedback } from "@/hooks/useHaptics";

interface ScrollToTopFABProps {
  className?: string;
  /** Scroll position threshold to show button (default: 400) */
  threshold?: number;
}

export const ScrollToTopFAB = memo(function ScrollToTopFAB({
  className,
  threshold = 400,
}: ScrollToTopFABProps) {
  const { scrollY } = useScrollDirection();
  const haptic = useHapticFeedback();
  
  const isVisible = scrollY > threshold;

  const scrollToTop = () => {
    haptic.buttonPress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className={cn(
            "fixed right-4 z-40",
            "w-12 h-12 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-lg shadow-primary/30",
            "flex items-center justify-center",
            "touch-manipulation",
            "bottom-[calc(5rem+env(safe-area-inset-bottom))]", // Above bottom nav
            className
          )}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
});
