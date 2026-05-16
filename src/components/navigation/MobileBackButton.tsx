import { memo } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSmartBack } from "@/hooks/useNavigationHelpers";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

interface MobileBackButtonProps {
  className?: string;
  fallbackPath?: string;
  label?: string;
}

/**
 * MobileBackButton - Contextual back navigation optimized for touch
 */
export const MobileBackButton = memo(function MobileBackButton({
  className,
  fallbackPath = "/",
  label = "Voltar",
}: MobileBackButtonProps) {
  const { goBack } = useSmartBack(fallbackPath);
  const haptic = useHapticFeedback();

   const handleClick = () => {
     haptic.trigger("light");
     goBack();
   };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl",
        "bg-muted/60 hover:bg-muted active:bg-muted/80 transition-colors",
        className
      )}
      aria-label={label}
    >
      <ChevronLeft className="h-6 w-6" />
    </motion.button>
  );
});
