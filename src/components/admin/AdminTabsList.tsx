import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, TrendingUp, Users, Building2, AlertTriangle, History,
  Trophy, Target, BarChart3, MessageSquare, Megaphone, PartyPopper,
  Heart, Briefcase, Grid3X3, FileText, Gauge, Globe, Shield, Key, Palette,
} from "lucide-react";

const tabs = [
  { value: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { value: "metrics", label: "Métricas", icon: TrendingUp },
  { value: "users", label: "Usuários", icon: Users },
  { value: "departments", label: "Departamentos", icon: Building2 },
  { value: "organization", label: "Organização", icon: Palette },
  { value: "alerts", label: "Alertas Sistema", icon: AlertTriangle },
  { value: "pdi-alerts", label: "Alertas PDI", icon: AlertTriangle },
  { value: "history", label: "Histórico", icon: History },
  { value: "leagues", label: "Ligas", icon: Trophy },
  { value: "goals", label: "Goals", icon: Target },
  { value: "surveys", label: "Surveys", icon: BarChart3 },
  { value: "feedback", label: "Feedback", icon: MessageSquare },
  { value: "announcements", label: "Anúncios", icon: Megaphone },
  { value: "celebrations", label: "Celebrações", icon: PartyPopper },
  { value: "mood", label: "Mood", icon: Heart },
  { value: "positions", label: "Cargos", icon: Briefcase },
  { value: "ninebox", label: "9-Box", icon: Grid3X3 },
  { value: "pdi", label: "PDI", icon: FileText },
  { value: "enps", label: "eNPS", icon: Gauge },
  { value: "ip-whitelist", label: "IP Whitelist", icon: Globe },
  { value: "rbac", label: "RBAC", icon: Shield },
  { value: "password-reset", label: "Reset Senha", icon: Key },
] as const;

export function AdminTabsList() {
  return (
    <TabsList className="bg-muted/50 mb-6">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
