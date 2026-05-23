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
import { Badge } from "@/components/ui/badge";
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
        <div className="flex items-center justify-between px-5 py-4">
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
            
             <div className="flex flex-col -space-y-0.5">
               <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-primary/30 text-primary font-black uppercase tracking-tighter bg-primary/5">
                      Elite
                    </Badge>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                 <h2 className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 font-black leading-none">
                   Dashboard
                 </h2>
               </div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg font-black tracking-tight truncate max-w-[150px] leading-tight">
                    Olá, {displayName.split(" ")[0]}!
                  </h1>
                  <span className="text-[10px] font-black text-success animate-pulse">●</span>
                </div>
             </div>
          </div>

          {/* Right: Essential actions only */}
          <div className="flex items-center gap-2">
            <ComboIndicator variant="compact" />
            <NotificationCenter />
            
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNavigateToProfile}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center font-black text-sm text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-background"
                aria-label="Meu perfil"
              >
                {displayName.charAt(0).toUpperCase()}
              </motion.button>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background" />
            </div>
          </div>
        </div>
      </motion.header>
    );
  }

  // Desktop header
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        isScrolled 
          ? "bg-background/70 backdrop-blur-2xl border-b border-border/40 py-2 shadow-xl shadow-black/5" 
          : "bg-transparent py-4"
      )}
      role="banner"
    >
      <div className="max-w-[1920px] mx-auto flex items-center justify-between px-8 md:px-12">
        <div className="flex items-center gap-8">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--muted))", borderColor: "hsl(var(--primary)/0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="flex items-center justify-center w-12 h-12 rounded-[1.25rem] bg-card/40 backdrop-blur-md border border-border/40 transition-all shadow-sm"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </motion.button>
          
            <div className="flex flex-col relative">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-1"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-glow-sm backdrop-blur-sm">
                  Tactical Intelligence Hub
                </span>
                <div className="h-px w-12 bg-gradient-to-r from-primary/50 to-transparent" />
              </motion.div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter flex items-center gap-4 italic">
              <span className="text-muted-foreground/20">SYSTEM://</span>
              {displayName.toUpperCase()}
              <span className="text-primary animate-pulse">_</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground/80 font-medium">
              {rankData?.rank ? (
                <>Você é o <span className="text-primary font-bold">#{rankData.rank}º</span> no ranking global</>
              ) : (
                <>Mantenha seu foco e conquiste o topo!</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 bg-muted/30 backdrop-blur-md p-1.5 rounded-3xl border border-border/40">
          <div className="hidden xl:flex items-center gap-2 px-2 border-r border-border/50">
            <MiniStreakTracker streak={7} />
          </div>
          
          <div className="flex items-center gap-1.5">
            <CommandTrigger variant="compact" />
            <GlobalSearch />
            <ThemeToggle />
            <NotificationCenter />
            <div className="hidden sm:block">
              <AICoachDialog />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border/50 mx-1 hidden sm:block" />

          {/* User Menu with Click Outside */}
          <div className="relative flex items-center gap-3 pr-1" ref={userMenuRef} data-tour="user-menu">
            <div className="hidden lg:flex flex-col items-end mr-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Status</span>
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 0 4px rgba(var(--primary), 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleUserMenu}
              className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center font-black text-sm text-primary-foreground shadow-lg shadow-primary/20 border-2 border-background"
              aria-label="Menu do usuário"
            >
              {displayName.charAt(0).toUpperCase()}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background shadow-sm" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute right-0 top-[120%] w-64 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                  role="menu"
                >
                  <div className="p-4 mb-2 bg-muted/50 rounded-xl border border-border/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <p className="font-black text-sm truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    {rankData?.rank && (
                      <div className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-lg border border-border/30">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ranking</span>
                        <RankingBadge rank={rankData.rank} size="sm" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={handleNavigateToProfile}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-sm font-bold group"
                      role="menuitem"
                    >
                      <User className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Meu Perfil
                    </button>
                    <div className="h-[1px] bg-border/40 mx-2 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-all text-sm font-bold group"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      Encerrar Sessão
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
