import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronRight, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNext: number;
  questsCompleted: number;
  questsTotal: number;
  streak: number;
  lastActive: string;
  trend: "up" | "down" | "same";
  riskLevel: "low" | "medium" | "high";
  department: string;
}

export const StatCard = ({ icon: Icon, label, value, change, changeType, color, delay }: {
  icon: React.ElementType; label: string; value: string; change?: string; changeType?: "positive" | "negative" | "neutral"; color: string; delay: number;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}><Icon className="w-5 h-5" style={{ color }} /></div>
        {change && <div className={`flex items-center gap-1 text-xs ${changeType === "positive" ? "text-green-400" : changeType === "negative" ? "text-red-400" : "text-muted-foreground"}`}>
          {changeType === "positive" ? <TrendingUp className="w-3 h-3" /> : changeType === "negative" ? <TrendingDown className="w-3 h-3" /> : null}{change}
        </div>}
      </div>
      <div className="mt-3"><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </Card>
  </motion.div>
);

export const TeamMemberRow = ({ member, index }: { member: TeamMember; index: number }) => {
  const progressPercent = (member.questsCompleted / member.questsTotal) * 100;
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1, duration: 0.3 }} whileHover={{ scale: 1.01, x: 4 }} className="group">
      <Card className="p-4 bg-card/30 backdrop-blur-sm border-border/30 hover:border-primary/40 hover:bg-card/50 transition-all duration-300 cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">{member.avatar}</div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${member.riskLevel === "low" ? "bg-green-500" : member.riskLevel === "medium" ? "bg-yellow-500" : "bg-red-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{member.name}</h4>
              <Badge variant="outline" className="text-xs">Lv.{member.level}</Badge>
              {member.trend === "up" && <TrendingUp className="w-4 h-4 text-green-400" />}
              {member.trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
            <p className="text-xs text-muted-foreground">{member.department} • Ativo: {member.lastActive}</p>
            <div className="mt-2 flex items-center gap-2"><Progress value={progressPercent} className="h-1.5 flex-1" /><span className="text-xs text-muted-foreground whitespace-nowrap">{member.questsCompleted}/{member.questsTotal}</span></div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center"><div className="flex items-center gap-1 text-amber-400"><Flame className="w-4 h-4" /><span className="font-bold">{member.streak}</span></div><p className="text-xs text-muted-foreground">Streak</p></div>
            <div className="text-center"><p className="font-bold text-foreground">{member.xp.toLocaleString()}</p><p className="text-xs text-muted-foreground">XP Total</p></div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Card>
    </motion.div>
  );
};

export const DepartmentCard = ({ department, members, index }: { department: { id: string; name: string; color: string | null }; members: TeamMember[]; index: number }) => {
  const deptMembers = members.filter(m => m.department === department.name);
  const avgProgress = deptMembers.length > 0 ? Math.round(deptMembers.reduce((acc, m) => acc + (m.questsCompleted / Math.max(m.questsTotal, 1)) * 100, 0) / deptMembers.length) : 0;
  const completionRate = deptMembers.length > 0 ? Math.round(deptMembers.filter(m => m.riskLevel === "low").length / deptMembers.length * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.3 }} whileHover={{ scale: 1.02, y: -2 }}>
      <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all duration-300 cursor-pointer" style={{ borderLeftColor: department.color || "#6366f1", borderLeftWidth: 3 }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">{department.name}</h4>
          <Badge variant="secondary" className="text-xs" style={{ backgroundColor: `${department.color || "#6366f1"}20`, color: department.color || "#6366f1" }}>{deptMembers.length} membros</Badge>
        </div>
        <div className="space-y-3">
          <div><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Progresso Médio</span><span className="text-foreground font-medium">{avgProgress}%</span></div><Progress value={avgProgress} className="h-2" /></div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30"><span className="text-xs text-muted-foreground">Taxa de Conclusão</span><span className="text-sm font-bold" style={{ color: department.color || "#6366f1" }}>{completionRate}%</span></div>
        </div>
      </Card>
    </motion.div>
  );
};

export const AtRiskAlert = ({ members }: { members: TeamMember[] }) => {
  const atRiskMembers = members.filter(m => m.riskLevel === "high");
  if (atRiskMembers.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="p-4 bg-red-500/10 border-red-500/30 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/20"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-400">Atenção Necessária</h4>
            <p className="text-sm text-muted-foreground mt-1">{atRiskMembers.length} membro{atRiskMembers.length > 1 ? "s" : ""} com baixo engajamento nos últimos 7 dias</p>
            <div className="flex flex-wrap gap-2 mt-2">{atRiskMembers.map(member => <Badge key={member.id} variant="outline" className="border-red-500/30 text-red-400">{member.name}</Badge>)}</div>
          </div>
          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">Ver Detalhes</Button>
        </div>
      </Card>
    </motion.div>
  );
};

export const calculateXpToNext = (level: number): number => level * 500 + 500;
export const calculateRiskLevel = (streak: number, updatedAt: string): "low" | "medium" | "high" => {
  const daysSinceActive = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceActive > 7 || streak === 0) return "high";
  if (daysSinceActive > 3 || streak < 3) return "medium";
  return "low";
};
export const calculateTrend = (streak: number, questsCompleted: number): "up" | "down" | "same" => {
  if (streak >= 5 && questsCompleted > 10) return "up";
  if (streak === 0) return "down";
  return "same";
};
