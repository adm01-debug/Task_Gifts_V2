import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkPendingIndicator } from "@/hooks/useNetworkStatus";

interface NetworkStatusBarProps {
  className?: string;
  /** Position of the bar */
  position?: "top" | "bottom";
}

/**
 * NetworkStatusBar - Shows network status and pending requests
 */
export const NetworkStatusBar = memo(function NetworkStatusBar({
  className,
  position = "top",
}: NetworkStatusBarProps) {
  const { isPending, isSlow, isOnline, shouldShow } = useNetworkPendingIndicator();

  const getMessage = () => {
    if (!isOnline) return { icon: WifiOff, text: "Sem conexão", color: "bg-destructive" };
    if (isSlow) return { icon: Wifi, text: "Conexão lenta", color: "bg-warning" };
    if (isPending) return { icon: Loader2, text: "Carregando...", color: "bg-primary" };
    return null;
  };

  const status = getMessage();

  return (
    <AnimatePresence>
      {shouldShow && status && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -20 : 20 }}
          className={cn(
            "fixed left-0 right-0 z-[100] flex justify-center pointer-events-none",
            position === "top" ? "top-0 pt-safe-top" : "bottom-0 pb-safe-bottom",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              "text-white text-sm font-medium shadow-lg",
              "m-2",
              status.color
            )}
          >
            <status.icon 
              className={cn(
                "w-4 h-4",
                isPending && isOnline && "animate-spin"
              )} 
            />
            <span>{status.text}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
