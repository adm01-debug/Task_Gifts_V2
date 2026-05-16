import { memo } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
 import { useSmartBack } from "@/hooks/useNavigationHelpers";
 import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

interface DesktopBackButtonProps {
  className?: string;
  /** Override the fallback path when no history exists */
  fallbackPath?: string;
  /** Label shown next to the arrow */
  label?: string;
}

/**
 * DesktopBackButton - Contextual back navigation for desktop pages
 * Only renders on pages that are not the root dashboard
 */
export const DesktopBackButton = memo(function DesktopBackButton({
  className,
  fallbackPath = "/",
  label = "Voltar",
}: DesktopBackButtonProps) {
  const location = useLocation();
   const { goBack } = useSmartBack(fallbackPath);
   const haptic = useHapticFeedback();
 
   const handleClick = () => {
     haptic.buttonPress();
     goBack();
   };

  // Don't show on root/dashboard
  if (location.pathname === "/") {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
       onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
        "text-sm font-medium text-muted-foreground",
        "hover:text-foreground hover:bg-muted/60",
        "active:bg-muted/80 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </motion.button>
  );
});
