import { memo, useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Target, Trophy, User, BookOpen, MoreHorizontal, Gamepad2, BarChart3, MessageSquare, Sparkles, Settings, Bell, HelpCircle } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  color?: string;
}

const mainNavItems: NavItem[] = [
   { icon: Home, label: "Dashboard", path: "/" },
  { icon: Target, label: "Metas", path: "/goals" },
  { icon: Trophy, label: "Ligas", path: "/leagues" },
  { icon: BookOpen, label: "Trilhas", path: "/trails" },
];

const moreNavItems: NavItem[] = [
   { icon: Gamepad2, label: "Quiz Diário", path: "/quiz", color: "text-orange-500" },
   { icon: BarChart3, label: "Estatísticas", path: "/estatisticas", color: "text-blue-500" },
   { icon: MessageSquare, label: "Feed Social", path: "/feed", color: "text-green-500" },
  { icon: User, label: "Perfil", path: "/profile", color: "text-purple-500" },
   { icon: Sparkles, label: "Conquistas", path: "/conquistas", color: "text-amber-500" },
  { icon: Bell, label: "Avisos", path: "/announcements", color: "text-pink-500" },
   { icon: Settings, label: "Painel Admin", path: "/admin", color: "text-slate-500" },
   { icon: HelpCircle, label: "Pesquisas", path: "/surveys", color: "text-cyan-500" },
];

interface MobileBottomNavProps {
  className?: string;
}

export const MobileBottomNav = memo(function MobileBottomNav({ className }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const haptic = useHapticFeedback();
  const [showMore, setShowMore] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Close more menu when route changes
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  const handleNavClick = useCallback((path: string) => {
    haptic.buttonPress();
    navigate(path);
    setShowMore(false);
  }, [navigate, haptic]);

  const toggleMore = useCallback(() => {
    haptic.buttonPress();
    setShowMore(prev => !prev);
  }, [haptic]);

  const isActive = useCallback((path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const isMoreActive = moreNavItems.some(item => isActive(item.path));

  return (
    <>
      {/* More menu - draggable bottom sheet */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setShowMore(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[28px] shadow-2xl touch-none"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
            >
              {/* Drag handle with animation */}
               <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
                 <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
               </div>

              {/* Title */}
              <div className="px-5 pb-4">
                <h3 className="text-base font-semibold text-foreground">Menu rápido</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Acesse suas funcionalidades favoritas</p>
              </div>
              
              {/* Quick access grid */}
              <div className="px-4 pb-6">
                <div className="grid grid-cols-4 gap-2.5">
                  {moreNavItems.map((item, index) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.path}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                        onClick={() => handleNavClick(item.path)}
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ y: -2 }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all",
                          active 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                            : "bg-muted/40 text-foreground active:bg-muted"
                        )}
                      >
                        <motion.div 
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            active 
                              ? "bg-primary-foreground/20" 
                              : "bg-background/80 shadow-sm border border-border/30"
                          )}
                          whileTap={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            active ? "text-primary-foreground" : item.color || "text-foreground"
                          )} />
                        </motion.div>
                        <span className={cn(
                          "text-[10px] font-medium leading-tight",
                          active && "font-semibold"
                        )}>
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main bottom nav with floating pill style */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30",
          "transition-all duration-300",
          showMore && "pointer-events-none translate-y-full",
          className
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
      >
        <div className="mx-3 mb-2">
          <div className={cn(
            "flex items-center justify-around h-[62px] px-2",
            "bg-card/95 backdrop-blur-xl",
            "rounded-2xl",
            "border border-border/50",
            "shadow-lg shadow-black/10"
          )}>
            {mainNavItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  whileTap={{ scale: 0.88, y: 2 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "w-[58px] h-[50px] rounded-xl",
                    "transition-colors duration-200",
                    "active:bg-muted/50"
                  )}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-1 bg-primary/12 rounded-lg"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <motion.div 
                    className="relative z-10"
                    animate={{ 
                      scale: active ? 1.1 : 1,
                      y: active ? -1 : 0
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon className={cn(
                      "w-[21px] h-[21px] transition-colors duration-200",
                      active ? "text-primary" : "text-muted-foreground"
                    )} />
                  </motion.div>
                  <motion.span 
                    className={cn(
                      "relative z-10 text-[10px] mt-0.5 transition-all duration-200",
                      active ? "text-primary font-semibold" : "text-muted-foreground font-medium"
                    )}
                    animate={{ opacity: active ? 1 : 0.75 }}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}

            {/* More button with dot indicator */}
            <motion.button
              onClick={toggleMore}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "w-[58px] h-[50px] rounded-xl",
                "transition-colors duration-200"
              )}
              aria-label="Mais opções"
              aria-expanded={showMore}
            >
              {isMoreActive && (
                <motion.div
                  className="absolute inset-0 bg-primary/15 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div 
                className="relative z-10"
                animate={{ 
                  scale: isMoreActive ? 1.15 : 1,
                  rotate: showMore ? 45 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <MoreHorizontal className={cn(
                  "w-[22px] h-[22px] transition-colors duration-200",
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                )} />
                {/* Notification dot */}
                <motion.div 
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                />
              </motion.div>
              <motion.span 
                className={cn(
                  "relative z-10 text-[10px] font-medium mt-1 transition-colors duration-200",
                  isMoreActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                Mais
              </motion.span>
            </motion.button>
          </div>
        </div>
      </nav>
    </>
  );
});