import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, Medal, Crown, Users, TrendingUp, 
  Star, ChevronRight, BarChart3, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useDepartments } from "@/hooks/useDepartments";
import { useProfiles } from "@/hooks/useProfiles";
import { useAllMissions } from "@/hooks/useMissions";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface RankingMetric {
  key: string;
  label: string;
  icon: React.ReactNode;
  format: (value: number) => string;
}

const departmentMetrics: Record<string, RankingMetric[]> = {
  comercial: [
    { key: "sales_value", label: "Valor em Vendas", icon: "💰", format: (v) => `R$ ${v.toLocaleString()}` },
    { key: "orders_closed", label: "Pedidos Fechados", icon: "📦", format: (v) => `${v} pedidos` },
    { key: "conversion_rate", label: "Taxa Conversão", icon: "📈", format: (v) => `${v}%` },
    { key: "response_time", label: "Tempo Resposta", icon: "⚡", format: (v) => `${v}min` },
  ],
  artes: [
    { key: "layouts_delivered", label: "Layouts Entregues", icon: "🎨", format: (v) => `${v} layouts` },
    { key: "first_approval", label: "Aprovação 1ª", icon: "✅", format: (v) => `${v}%` },
    { key: "avg_time", label: "Tempo Médio", icon: "⏱️", format: (v) => `${v}h` },
    { key: "corrections", label: "Correções", icon: "🔄", format: (v) => `${v}` },
  ],
  compras: [
    { key: "orders_processed", label: "Pedidos Processados", icon: "📋", format: (v) => `${v} pedidos` },
    { key: "savings", label: "Economia Negociada", icon: "💰", format: (v) => `${v}%` },
    { key: "quote_time", label: "Tempo de Cotação", icon: "⏱️", format: (v) => `${v}h` },
    { key: "active_suppliers", label: "Fornecedores Ativos", icon: "🏪", format: (v) => `${v}` },
  ],
  gravacao: [
    { key: "volume_produced", label: "Volume Produzido", icon: "🖨️", format: (v) => `${v} un` },
    { key: "quality_rate", label: "Taxa Qualidade", icon: "✨", format: (v) => `${v}%` },
    { key: "avg_batch_time", label: "Tempo Médio/Lote", icon: "⏱️", format: (v) => `${v}min` },
    { key: "zero_rework", label: "Dias Sem Retrabalho", icon: "🏆", format: (v) => `${v} dias` },
  ],
  expedicao: [
    { key: "checks_done", label: "Conferências", icon: "📦", format: (v) => `${v}` },
    { key: "divergences_found", label: "Divergências Identificadas", icon: "⚠️", format: (v) => `${v}` },
    { key: "processing_time", label: "Tempo Processamento", icon: "⏱️", format: (v) => `${v}min` },
    { key: "box_organization", label: "Organização BOX", icon: "🗃️", format: (v) => `${v}%` },
  ],
};


interface RankingUser {
  id: string;
  name: string;
  avatar: string | null;
  score: number;
  xp: number;
  metrics: { orders: number; rate: number; time: number };
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

function getRankStyles(rank: number) {
  if (rank === 1) return "bg-gradient-to-r from-amber-500/20 to-amber-500/5 border-amber-500/30";
  if (rank === 2) return "bg-gradient-to-r from-slate-400/20 to-slate-400/5 border-slate-400/30";
  if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30";
  return "bg-card/50 border-border/50";
}

function RankingCard({ 
  user, 
  rank, 
  maxScore 
}: { 
  user: RankingUser; 
  rank: number;
  maxScore: number;
}) {
  const scorePercent = (user.score / maxScore) * 100;
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${getRankStyles(rank)}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Rank */}
            <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate">{user.name}</h4>
                {rank <= 3 && (
                  <Badge variant="secondary" className="text-xs">
                    Top {rank}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  {user.xp.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-primary" />
                  {user.score} pts
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="w-24">
              <Progress value={scorePercent} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DepartmentRankings() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly");
  
  const { data: departments = [], isLoading: deptsLoading } = useDepartments();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();

  const isLoading = deptsLoading || profilesLoading;

  // Use profiles as ranking data for now
  const rankings = profiles
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10)
    .map((p, i) => ({
      id: p.id,
      name: p.display_name || "Usuário",
      avatar: p.avatar_url as string | null,
      score: Math.round(p.xp * 0.8 + p.quests_completed * 50 + p.streak * 10),
      xp: p.xp,
      metrics: { orders: 0, rate: 0, time: 0 },
    }));

  const maxScore = rankings[0]?.score || 1;

  // Get department-specific metrics
  const getDepartmentKey = (deptName: string) => {
    const lower = deptName.toLowerCase();
    if (lower.includes("comercial") || lower.includes("vendas") || lower.includes("crm")) return "comercial";
    if (lower.includes("arte")) return "artes";
    if (lower.includes("compra")) return "compras";
    if (lower.includes("gravação") || lower.includes("gravacao")) return "gravacao";
    if (lower.includes("expedição") || lower.includes("estoque")) return "expedicao";
    return null;
  };

  const selectedDept = departments.find(d => d.id === selectedDepartment);
  const deptKey = selectedDept ? getDepartmentKey(selectedDept.name) : null;
  const metrics = deptKey ? departmentMetrics[deptKey] : null;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="glow" shape="card" className="p-2 rounded-xl w-10 h-10" />
              <div className="space-y-2">
                <Skeleton variant="shimmer" className="h-4 w-32" />
                <Skeleton variant="shimmer" className="h-3 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="shimmer" className="h-10 w-32 rounded-lg" />
              <Skeleton variant="shimmer" className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton variant="glow" shape="circle" className="w-10 h-10" />
                <Skeleton variant="shimmer" shape="circle" className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="shimmer" className="h-4 w-32" />
                  <div className="flex gap-3">
                    <Skeleton variant="shimmer" className="h-3 w-16" />
                    <Skeleton variant="shimmer" className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton variant="shimmer" className="h-2 w-24 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Rankings Departamentais</CardTitle>
              <p className="text-sm text-muted-foreground">
                Melhores desempenhos por área
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <AllSelectItem label="Ranking Geral" />
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as "weekly" | "monthly")}>
              <TabsList>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Department Metrics Preview */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2"
          >
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="p-3 rounded-lg bg-muted/50 text-center"
              >
                <span className="text-2xl">{metric.icon as string}</span>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {rankings.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum dado de ranking disponível"
            compact
          />
        ) : (
          rankings.map((user, index) => (
            <RankingCard
              key={user.id}
              user={user}
              rank={index + 1}
              maxScore={maxScore}
            />
          ))
        )}

        {/* Podium visualization for top 3 */}
        {rankings.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-end justify-center gap-4 h-32"
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="h-10 w-10 border-2 border-slate-400">
                <AvatarFallback className="bg-slate-400/20 text-slate-400 text-sm">
                  {rankings[1].name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="w-16 h-20 bg-slate-400/20 rounded-t-lg flex items-center justify-center mt-2">
                <Medal className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-xs font-medium mt-1">2º</span>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <Avatar className="h-12 w-12 border-2 border-amber-400">
                <AvatarFallback className="bg-amber-400/20 text-amber-400">
                  {rankings[0].name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="w-20 h-28 bg-amber-400/20 rounded-t-lg flex items-center justify-center mt-2">
                <Crown className="h-8 w-8 text-amber-400" />
              </div>
              <span className="text-xs font-bold mt-1">1º</span>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="h-10 w-10 border-2 border-amber-600">
                <AvatarFallback className="bg-amber-600/20 text-amber-600 text-sm">
                  {rankings[2].name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="w-16 h-16 bg-amber-600/20 rounded-t-lg flex items-center justify-center mt-2">
                <Medal className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-xs font-medium mt-1">3º</span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
