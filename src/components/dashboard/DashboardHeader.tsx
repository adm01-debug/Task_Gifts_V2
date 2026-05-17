// Core & Libs
import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Icons
import { Menu, LogOut, User } from "lucide-react";

// Components (UI)
import { ThemeToggle } from "@/components/ThemeToggle";
import { AICoachDialog } from "@/components/AICoachDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ComboIndicator } from "@/components/ComboIndicator";
import { RankingBadge } from "@/components/RankingBadge";
import { MiniStreakTracker } from "@/components/ui/streak-tracker";
import { CommandTrigger } from "@/components/ui/command-trigger";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useUserRank } from "@/hooks/useUserRank";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useHiddenHeader } from "@/hooks/useScrollDirection";
import { useIsMobile } from "@/hooks/use-mobile";

// Utils
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

/**
 * DashboardHeader - Main dashboard header with navigation and user menu
 * Includes: Menu toggle, search, notifications, theme, user dropdown
 */
export const DashboardHeader = memo(function DashboardHeader({ 
  onMenuClick 
}: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: rankData } = useUserRank();
  const isScrolled = useScrollHeader(10);
  const isHidden = useHiddenHeader(15);
  const isMobile = useIsMobile();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Jogador";

  // Close menu when clicking outside
  const closeUserMenu = useCallback(() => setShowUserMenu(false), []);
  const userMenuRef = useClickOutside<HTMLDivElement>(closeUserMenu, showUserMenu);

  const handleSignOut = useCallback(async () => {
    await signOut();
    toast.success("Até logo! 👋");
    navigate("/auth");
  }, [signOut, navigate]);

  const handleToggleUserMenu = useCallback(() => setShowUserMenu(prev => !prev), []);
  
  const handleNavigateToProfile = useCallback(() => {
    setShowUserMenu(false);
    navigate("/profile");
  }, [navigate]);

  // Simplified mobile header
  if (isMobile) {
    return (
      <motion.header 
        initial={{ y: 0 }}
        animate={{ y: isHidden ? "-100%" : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className={cn(
          "sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50",
          isScrolled && "shadow-sm"
        )}
        role="banner"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu + Greeting */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
            
             <div className="flex flex-col">
               <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-1">
                 Dashboard Principal
               </h2>
               <h1 className="text-base font-bold truncate max-w-[140px] leading-tight">
                 Olá, {displayName.split(" ")[0]}! 👋
               </h1>
             </div>
          </div>

          {/* Right: Essential actions only */}
          <div className="flex items-center gap-2">
            <ComboIndicator variant="compact" />
            <NotificationCenter />
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNavigateToProfile}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-xs text-primary-foreground"
              aria-label="Meu perfil"
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.button>
          </div>
        </div>
      </motion.header>
    );
  }

  // Desktop header
  return (
    <motion.header 
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      className={cn(
        "header-sticky border-b border-border",
        isScrolled && "scrolled"
      )}
      role="banner"
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Abrir menu de navegação"
            title="Menu"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </motion.button>
          
          <div>
            <h1 className="text-lg md:text-xl font-bold">Olá, {displayName}! 👋</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {rankData?.rank ? (
                <>Você está no <span className="text-primary font-semibold">#{rankData.rank}</span> lugar. Continue assim!</>
              ) : (
                <>Complete atividades para subir no ranking!</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <MiniStreakTracker streak={7} />
          <CommandTrigger variant="compact" />
          <GlobalSearch />
          <ThemeToggle />
          <NotificationCenter />
          <ComboIndicator variant="compact" />
          <AICoachDialog />

          {/* User Menu with Click Outside */}
          <div className="relative flex items-center gap-2" ref={userMenuRef} data-tour="user-menu">
            {rankData?.rank && (
              <RankingBadge rank={rankData.rank} size="sm" />
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleUserMenu}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-sm"
              aria-label="Menu do usuário"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              title={`Menu de ${displayName}`}
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold text-sm">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleNavigateToProfile}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                      role="menuitem"
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      Meu Perfil
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-sm"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
});
