import { motion } from "framer-motion";
import { 
  Home, Target, Trophy, TrendingUp, Clock, BookOpen, 
  Gamepad2, ShoppingBag, Swords, Heart, Award, 
  ClipboardCheck, BarChart3, Megaphone, MessageSquare,
  LayoutDashboard, GraduationCap, Users, Sparkles
} from "lucide-react";
import { memo } from "react";
import { SidebarNavGroup, SidebarUserStats, SidebarLogo, SidebarFooter } from "@/components/sidebar";

// Navigation structure with categories
const navCategories = [
  {
    title: "Meu Progresso",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { icon: Home, label: "Dashboard", path: "/" },
      { icon: TrendingUp, label: "Estatísticas", path: "/estatisticas" },
      { icon: Trophy, label: "Conquistas", path: "/conquistas" },
    ],
  },
  {
    title: "Objetivos",
    icon: Target,
    defaultOpen: true,
    items: [
      { icon: Target, label: "Metas & OKRs", path: "/goals" },
      { icon: ClipboardCheck, label: "Check-ins 1:1", path: "/checkins" },
      { icon: Clock, label: "Ponto", path: "/ponto" },
    ],
  },
  {
    title: "Aprendizado",
    icon: GraduationCap,
    defaultOpen: false,
    items: [
      { icon: BookOpen, label: "Trilhas", path: "/trails" },
      { icon: Gamepad2, label: "Quiz Diário", path: "/quiz" },
      { icon: Heart, label: "Mentoria", path: "/mentoria" },
    ],
  },
  {
    title: "Competição",
    icon: Sparkles,
    defaultOpen: false,
    items: [
      { icon: Award, label: "Ligas", path: "/leagues" },
      { icon: Swords, label: "Duelos", path: "/duelos" },
    ],
  },
  {
    title: "Comunicação",
    icon: Users,
    defaultOpen: false,
    items: [
      { icon: BarChart3, label: "Pulse Surveys", path: "/surveys" },
      { icon: MessageSquare, label: "Feedback 360°", path: "/feedback" },
      { icon: Megaphone, label: "Anúncios", path: "/announcements" },
    ],
  },
  {
    title: "Recompensas",
    icon: ShoppingBag,
    defaultOpen: false,
    items: [
      { icon: ShoppingBag, label: "Loja", path: "/loja", badge: 2 },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = memo(function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <motion.aside
      data-tour="sidebar"
      id="main-nav"
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="h-screen bg-sidebar/70 backdrop-blur-2xl border-r border-sidebar-border/30 flex flex-col overflow-hidden shadow-[10px_0_50px_rgba(0,0,0,0.1)] relative z-50"
      role="navigation"
      aria-label="Menu lateral principal"
    >
      {/* Logo */}
      <SidebarLogo collapsed={collapsed} />

      {/* User Stats */}
      <SidebarUserStats collapsed={collapsed} />

      {/* Navigation with Categories */}
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin" aria-label="Navegação principal">
        {navCategories.map((category) => (
          <SidebarNavGroup
            key={category.title}
            title={category.title}
            icon={category.icon}
            items={category.items}
            collapsed={collapsed}
            defaultOpen={category.defaultOpen}
          />
        ))}
      </nav>

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />
    </motion.aside>
  );
});
