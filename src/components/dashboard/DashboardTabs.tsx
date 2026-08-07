import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Target, Trophy, Users, Sparkles, 
  TrendingUp, BookOpen, ShoppingBag 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const tabs: DashboardTab[] = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard, description: "Resumo do seu progresso" },
  { id: "goals", label: "Metas", icon: Target, description: "Seus objetivos e OKRs" },
  { id: "achievements", label: "Conquistas", icon: Trophy, description: "Badges e recompensas" },
  { id: "learning", label: "Aprendizado", icon: BookOpen, description: "Trilhas e cursos" },
  { id: "social", label: "Social", icon: Users, description: "Equipe e colaboração" },
  { id: "challenges", label: "Desafios", icon: Sparkles, description: "Missões e competições" },
  { id: "analytics", label: "Análises", icon: TrendingUp, description: "Estatísticas detalhadas" },
  { id: "rewards", label: "Loja", icon: ShoppingBag, description: "Recompensas e itens" },
];

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const DashboardTabs = memo(function DashboardTabs({ 
  activeTab, 
  onTabChange,
  className 
}: DashboardTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const handleTabClick = useCallback((tabId: string) => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <div className={cn("relative", className)}>
      {/* Desktop Tabs */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-xl backdrop-blur-sm border border-border/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              whileTap={{ scale: 0.98 }}
              aria-selected={isActive}
              role="tab"
            >
              {/* Background highlight */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-primary rounded-lg shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              
              {/* Hover highlight */}
              {isHovered && !isActive && (
                <motion.div
                  layoutId="hoverTabBg"
                  className="absolute inset-0 bg-accent/50 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}

              <Icon className={cn("w-4 h-4 relative z-10", isActive && "text-primary-foreground")} />
              <span className="relative z-10 hidden lg:inline">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile Tabs - Scrollable */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-2 p-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeTab}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="text-xs text-muted-foreground mt-2 text-center md:text-left"
        >
          {tabs.find(t => t.id === activeTab)?.description}
        </motion.p>
      </AnimatePresence>
    </div>
  );
});

export const useDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    // Salvar preferência
    localStorage.setItem("dashboard_active_tab", tabId);
  }, []);

  // Carregar preferência salva
  useState(() => {
    const saved = localStorage.getItem("dashboard_active_tab");
    if (saved && tabs.some(t => t.id === saved)) {
      setActiveTab(saved);
    }
  });

  return { activeTab, handleTabChange, tabs };
};

export { tabs };
export type { DashboardTab };
