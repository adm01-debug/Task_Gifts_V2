import { useState } from "react";
import { Target, Plus, TrendingUp, CheckCircle2, Clock, Shield, Zap, Sparkles, Filter, LayoutGrid, List, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageShell } from "@/components/navigation";
import { GoalCard } from "@/components/goals/GoalCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Goals() {
  const seoConfig = useSEO();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { goals, teamGoals, companyGoals, isLoading, createGoal, updateGoal, createKeyResult, deleteGoal, isCreating } = useGoals();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<{ title: string; target_value: number; metric_type: "percentage" | "number" | "currency" | "boolean"; unit: string }>({ title: "", target_value: 100, metric_type: "percentage", unit: "%" });
  const [newGoal, setNewGoal] = useState({ title: "", description: "", goal_type: "personal", priority: "medium", due_date: "" });

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    createGoal({
      title: newGoal.title, description: newGoal.description || undefined,
      goal_type: newGoal.goal_type as "personal" | "team" | "company",
      priority: newGoal.priority as "low" | "medium" | "high",
      due_date: newGoal.due_date || undefined,
    });
    setNewGoal({ title: "", description: "", goal_type: "personal", priority: "medium", due_date: "" });
    setIsDialogOpen(false);
  };

  const renderGoalList = (list: typeof goals, emptyMessage: string) => (
    list.length === 0 ? (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <Target className="h-10 w-10 text-slate-700 opacity-50" />
        </div>
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">{emptyMessage}</h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8 max-w-xs">
          O sistema de diretrizes táticas está vazio. Inicie um novo protocolo de objetivos para monitorar sua evolução.
        </p>
        <Button onClick={() => setIsDialogOpen(true)} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest gap-2">
          <Plus className="h-4 w-4" /> Iniciar Protocolo
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {list.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              selectedGoal={selectedGoal}
              setSelectedGoal={setSelectedGoal}
              newKeyResult={newKeyResult}
              setNewKeyResult={setNewKeyResult}
              onAddKeyResult={(goalId) => createKeyResult({ goal_id: goalId, ...newKeyResult })}
              onUpdateGoal={({ goalId, updates }) => updateGoal({ goalId, updates: updates as any })}
              onDeleteGoal={deleteGoal}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  );

  return (
    <PageShell 
      title="Terminal de Diretrizes" 
      subtitle="Gerencie seus objetivos estratégicos e Key Results de elite"
      icon={<Target className="w-6 h-6 text-primary" />}
      backFallback="/"
    >
      <PageWrapper pageName="Goals" className="container max-w-7xl px-4 pb-24 mx-auto">
        <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
        
        <div className="space-y-10 pt-6">
          {/* Tactical Analytics Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Diretrizes Ativas", value: goals.length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
              { label: "Protocolos Concluídos", value: goals.filter((g) => g.status === "completed").length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Em Execução", value: goals.filter((g) => g.status === "active").length, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "XP Potencial", value: goals.reduce((acc, g) => acc + g.xp_reward, 0), icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
              >
                <Card className="relative overflow-hidden border border-white/5 bg-[#0A0C10] group">
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 rounded-lg", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      <Shield className="h-4 w-4 text-white/5 group-hover:text-primary/20 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                      <p className="text-3xl font-black italic tracking-tighter text-white">{stat.value}</p>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Centro de Operações</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sistema de Alinhamento Estratégico</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] bg-white text-black hover:bg-zinc-200 shadow-2xl transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-4 w-4 mr-2" /> Novo Objetivo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-[#0A0C10] border-white/10 rounded-2xl p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">Criar Nova Diretriz</DialogTitle>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Autorização de protocolo tático nível 1</p>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título da Operação *</Label>
                    <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="Ex: Dominação de Mercado Q3" className="bg-white/5 border-white/10 rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Briefing Técnico</Label>
                    <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Detalhes táticos da missão..." className="bg-white/5 border-white/10 rounded-xl min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nível de Alcance</Label>
                      <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#0A0C10] border-white/10"><SelectItem value="personal">Pessoal</SelectItem><SelectItem value="team">Time</SelectItem><SelectItem value="company">Empresa</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prioridade de Campo</Label>
                      <Select value={newGoal.priority} onValueChange={(v) => setNewGoal({ ...newGoal, priority: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#0A0C10] border-white/10"><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Limite de Sincronização</Label>
                    <Input type="date" value={newGoal.due_date} onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })} className="bg-white/5 border-white/10 rounded-xl h-12" />
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full h-14 rounded-xl font-black uppercase tracking-widest shadow-2xl" disabled={isCreating}>
                    {isCreating ? "PROCESSANDO..." : "AUTORIZAR DIRETRIZ"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="personal" className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
              <TabsList className="bg-transparent h-auto p-0 flex gap-8">
                {[
                  { id: "personal", label: "MEUS GOALS", count: goals.length, icon: Shield },
                  { id: "team", label: "TIME", count: teamGoals.length, icon: LayoutGrid },
                  { id: "company", label: "EMPRESA", count: companyGoals.length, icon: Zap },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all"
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] font-black px-1.5 py-0">
                      {tab.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-[400px]">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => <div key={i} className="h-[400px] rounded-2xl bg-white/5 animate-pulse" />)}
                </div>
              ) : (
                <>
                  <TabsContent value="personal" className="mt-0 focus-visible:outline-none">{renderGoalList(goals, "Sem Objetivos Pessoais")}</TabsContent>
                  <TabsContent value="team" className="mt-0 focus-visible:outline-none">{renderGoalList(teamGoals, "Sem Objetivos de Time")}</TabsContent>
                  <TabsContent value="company" className="mt-0 focus-visible:outline-none">{renderGoalList(companyGoals, "Sem Objetivos Corporativos")}</TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </PageWrapper>
    </PageShell>
  );
}

