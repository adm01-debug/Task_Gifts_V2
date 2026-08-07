import { useState, useCallback } from "react";
 import { Menu, Gift, Bell, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
 import { useNavigate, useLocation } from "react-router-dom";
import { MobileDrawer } from "./MobileDrawer";
 import { MobileBackButton } from "./navigation/MobileBackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  showTitle?: boolean;
  showNotifications?: boolean;
   forceShowBackButton?: boolean;
  className?: string;
}

export function MobileHeader({ 
  title, 
  showTitle = true, 
  showNotifications = true,
   forceShowBackButton = false,
  className 
}: MobileHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
   const location = useLocation();

   // Show back button if forced or if we're not on a root/tab page
   const shouldShowBack = forceShowBackButton || (
     location.pathname !== "/" && 
     location.pathname !== "/goals" && 
     location.pathname !== "/leagues" && 
     location.pathname !== "/trails"
   );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (!isMobile) return null;

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 w-full",
        "bg-background/80 backdrop-blur-xl",
        "border-b border-border/30",
        "shadow-sm",
        className
      )}>
        <div className="flex h-14 items-center justify-between px-4">
           {shouldShowBack ? (
             <MobileBackButton />
           ) : (
             <motion.button
               whileTap={{ scale: 0.9 }}
               onClick={openDrawer}
               className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted active:bg-muted/80 transition-colors"
               aria-label="Abrir menu"
             >
               <Menu className="h-5 w-5" />
             </motion.button>
           )}

          {showTitle && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <Gift className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">
                {title || "Task Gifts"}
              </span>
            </motion.div>
          )}

          {showNotifications ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/profile")}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </motion.button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  );
}
