import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import {
  Users, AlertTriangle, TrendingUp, TrendingDown, Target,
  ChevronDown, ChevronUp, BookOpen, Sparkles, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { competencyService, CompetencyData } from "@/services/competencyService";
import { profilesService } from "@/services/profilesService";
import { CompetencyRecommendationsDialog, type RecommendationsResponse } from "./CompetencyRecommendationsDialog";

interface TeamMemberCompetency {
  userId: string; displayName: string; email: string; level: number;
  competencies: CompetencyData[]; avgScore: number; gaps: string[]; strengths: string[];
}

const COMPETENCY_COLORS: Record<string, string> = {
  "Conhecimento Técnico": "hsl(var(--primary))", "Resolução de Problemas": "hsl(265, 89%, 66%)",
  "Colaboração": "hsl(142, 71%, 45%)", "Disciplina": "hsl(38, 92%, 50%)",
  "Liderança": "hsl(330, 81%, 60%)", "Comunicação": "hsl(199, 89%, 48%)",
};
const getCompetencyColor = (area: string) => COMPETENCY_COLORS[area] || "hsl(var(--muted-foreground))";

export function TeamCompetencyDashboard() {
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedMemberForRecs, setSelectedMemberForRecs] = useState<TeamMemberCompetency | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);

  const { data: teamMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ["team-members-profiles"],
    queryFn: () => profilesService.getTopByLevel(20),
  });

  const { data: teamCompetencies, isLoading: loadingCompetencies } = useQuery({
    queryKey: ["team-competencies", teamMembers?.map(m => m.id)],
    queryFn: async () => {
      if (!teamMembers?.length) return [];
      const results: TeamMemberCompetency[] = [];
      for (const member of teamMembers) {
        const competencies = await competencyService.getUserCompetencies(member.id);
        const avgScore = competencies.reduce((acc, c) => acc + c.value, 0) / competencies.length;
        results.push({
          userId: member.id, displayName: member.display_name || member.email?.split("@")[0] || "Usuário",
          email: member.email || "", level: member.level, competencies, avgScore: Math.round(avgScore),
          gaps: competencies.filter(c => c.value < 40).map(c => c.area),
          strengths: competencies.filter(c => c.value >= 70).map(c => c.area),
        });
      }
      return results;
    },
    enabled: !!teamMembers?.length,
  });

  const recommendationsMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trail-recommendations`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) { if (response.status === 429) throw new Error("Limite de requisições excedido."); if (response.status === 402) throw new Error("Créditos insuficientes."); throw new Error("Erro ao buscar recomendações"); }
      return response.json() as Promise<RecommendationsResponse>;
    },
    onSuccess: (data) => { setRecommendations(data); setShowRecommendations(true); },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Erro ao buscar recomendações"); },
  });

  const handleGetRecommendations = (member: TeamMemberCompetency) => {
    setSelectedMemberForRecs(member); setRecommendations(null); recommendationsMutation.mutate(member.userId);
  };

  const teamStats = useMemo(() => {
    if (!teamCompetencies?.length) return null;
    const competencyAggregates: Record<string, { total: number; count: number }> = {};
    let membersWithGaps = 0;
    teamCompetencies.forEach((member) => {
      if (member.gaps.length > 0) membersWithGaps++;
      member.competencies.forEach((c) => {
        if (!competencyAggregates[c.area]) competencyAggregates[c.area] = { total: 0, count: 0 };
        competencyAggregates[c.area].total += c.value; competencyAggregates[c.area].count++;
      });
    });
    const teamAverage = Object.entries(competencyAggregates).map(([area, data]) => ({ area, value: Math.round(data.total / data.count), maxValue: 100 }));
    return {
      teamAverage, teamStrengths: teamAverage.filter(c => c.value >= 60).sort((a, b) => b.value - a.value),
      teamGaps: teamAverage.filter(c => c.value < 50).sort((a, b) => a.value - b.value),
      membersWithGaps, totalMembers: teamCompetencies.length,
      avgTeamScore: Math.round(teamAverage.reduce((acc, c) => acc + c.value, 0) / teamAverage.length),
    };
  }, [teamCompetencies]);

  const toggleMember = (userId: string) => { 
    setExpandedMembers(prev => { 
      const next = new Set(prev); 
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next; 
    }); 
  };

  if (loadingMembers || loadingCompetencies) return <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-80" /></div>;
  if (!teamStats || !teamCompetencies?.length) return <Card className="p-8 text-center bg-card/50 border-border/50"><Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold text-foreground">Nenhum dado disponível</h3></Card>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Target, color: "bg-primary/20", textColor: "text-primary", value: `${teamStats.avgTeamScore}%`, label: "Média da Equipe" },
          { icon: TrendingUp, color: "bg-green-500/20", textColor: "text-green-500", value: teamStats.teamStrengths.length, label: "Competências Fortes" },
          { icon: AlertTriangle, color: "bg-amber-500/20", textColor: "text-amber-500", value: teamStats.teamGaps.length, label: "Gaps Identificados" },
          { icon: Users, color: "bg-red-500/20", textColor: "text-red-500", value: teamStats.membersWithGaps, label: "Membros com Gaps" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-4 bg-card/50 border-border/50"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className={`w-5 h-5 ${stat.textColor}`} /></div><div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></div></Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 bg-card/50 border-border/50"><h3 className="text-lg font-semibold text-foreground mb-4">Radar de Competências</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={teamStats.teamAverage}><PolarGrid stroke="hsl(var(--border))" /><PolarAngleAxis dataKey="area" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} /><Radar name="Média" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} strokeWidth={2} /></RadarChart></ResponsiveContainer></div></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 bg-card/50 border-border/50"><h3 className="text-lg font-semibold text-foreground mb-4">Distribuição por Competência</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={teamStats.teamAverage} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><YAxis type="category" dataKey="area" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{teamStats.teamAverage.map((entry, index) => <Cell key={`cell-${index}`} fill={getCompetencyColor(entry.area)} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
        </motion.div>
      </div>

      {/* Gaps Alert */}
      {teamStats.teamGaps.length > 0 && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30"><div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" /><div className="flex-1"><h4 className="font-semibold text-amber-400">Gaps de Competência</h4><div className="flex flex-wrap gap-2 mt-3">{teamStats.teamGaps.map(gap => <Badge key={gap.area} variant="outline" className="border-amber-500/30 text-amber-400">{gap.area}: {gap.value}%</Badge>)}</div></div>
          <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400" onClick={() => { const m = [...teamCompetencies].sort((a, b) => b.gaps.length - a.gaps.length)[0]; if (m) handleGetRecommendations(m); }} disabled={recommendationsMutation.isPending}>{recommendationsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Sugerir Trilhas IA</Button>
        </div></Card>
      )}

      {/* Individual Analysis */}
      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Análise Individual</h3>
        <div className="space-y-3">
          {teamCompetencies.sort((a, b) => a.avgScore - b.avgScore).map((member, index) => (
            <motion.div key={member.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <Collapsible open={expandedMembers.has(member.userId)} onOpenChange={() => toggleMember(member.userId)}>
                <Card className="p-4 bg-card/30 border-border/30 hover:border-primary/30 transition-colors">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">{member.displayName.slice(0, 2).toUpperCase()}</div>
                        <div className="text-left"><h4 className="font-medium text-foreground">{member.displayName}</h4><p className="text-xs text-muted-foreground">Nível {member.level}</p></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2">
                          {member.gaps.length > 0 && <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">{member.gaps.length} gap{member.gaps.length > 1 ? "s" : ""}</Badge>}
                          {member.strengths.length > 0 && <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">{member.strengths.length} forte{member.strengths.length > 1 ? "s" : ""}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 min-w-[120px]"><Progress value={member.avgScore} className="h-2 flex-1" /><span className="text-sm font-medium w-10 text-right">{member.avgScore}%</span></div>
                        {expandedMembers.has(member.userId) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t border-border/30 grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">{member.competencies.map(c => <div key={c.area} className="flex items-center gap-2"><span className="w-6 text-center">{c.icon}</span><span className="text-sm text-muted-foreground flex-1 truncate">{c.area}</span><Progress value={c.value} className="h-2 w-24" /><span className={`text-xs font-medium w-8 text-right ${c.value < 40 ? "text-red-400" : c.value >= 70 ? "text-green-400" : "text-foreground"}`}>{c.value}%</span></div>)}</div>
                      <div className="space-y-3">
                        {member.gaps.length > 0 && <div><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-400" />Áreas para Desenvolvimento</p><div className="flex flex-wrap gap-1">{member.gaps.map(gap => <Badge key={gap} variant="destructive" className="text-xs">{gap}</Badge>)}</div></div>}
                        {member.strengths.length > 0 && <div><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-400" />Pontos Fortes</p><div className="flex flex-wrap gap-1">{member.strengths.map(s => <Badge key={s} variant="outline" className="text-xs border-green-500/30 text-green-400">{s}</Badge>)}</div></div>}
                        {member.gaps.length > 0 && <Button size="sm" variant="outline" className="mt-3 border-primary/30 text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); handleGetRecommendations(member); }} disabled={recommendationsMutation.isPending}>{recommendationsMutation.isPending && selectedMemberForRecs?.userId === member.userId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Recomendar Trilhas</Button>}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      </Card>

      <CompetencyRecommendationsDialog open={showRecommendations} onOpenChange={setShowRecommendations} memberName={selectedMemberForRecs?.displayName || ""} isLoading={recommendationsMutation.isPending} recommendations={recommendations} />
    </div>
  );
}
