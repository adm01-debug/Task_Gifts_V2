import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, X } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OfflineIndicator() {
  const { isOffline, wasOffline, isOnline, resetWasOffline } = useOnlineStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when coming online
  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  // Show toast when connection status changes
  useEffect(() => {
    if (isOffline) {
      toast.warning("Você está offline. Alguns recursos podem estar limitados.", {
        duration: 5000,
        id: "offline-toast",
      });
    } else if (wasOffline && isOnline) {
      toast.success("Conexão restaurada!", {
        duration: 3000,
        id: "online-toast",
      });
      resetWasOffline();
    }
  }, [isOffline, wasOffline, isOnline, resetWasOffline]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    
    // Try to fetch a small resource to check connectivity
    try {
      await fetch("/favicon.ico", { cache: "no-store" });
      // If successful, the online event will trigger automatically
    } catch {
      toast.error("Ainda sem conexão. Tente novamente.", { duration: 3000 });
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const showBanner = isOffline && !isDismissed;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100]"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="bg-gradient-to-r from-warning/95 via-warning to-warning/95 backdrop-blur-md border-b border-warning-foreground/20 shadow-lg">
            <div className="container max-w-7xl mx-auto py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                {/* Icon and Message */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning-foreground/15 flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-warning-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-warning-foreground">
                      Modo Offline
                    </span>
                    <span className="text-xs text-warning-foreground/80 truncate">
                      Dados em cache disponíveis
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="h-9 px-3 bg-warning-foreground/10 hover:bg-warning-foreground/20 text-warning-foreground border-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline ml-1">Reconectar</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDismiss}
                    className="h-9 w-9 bg-warning-foreground/10 hover:bg-warning-foreground/20 text-warning-foreground border-0"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
