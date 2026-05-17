import { useState } from "react";
import { Target, Plus, TrendingUp, CheckCircle2, Clock } from "lucide-react";
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
import { MobilePageLayout } from "@/components/mobile";
 import { PageShell } from "@/components/navigation";
import { GoalCard } from "@/components/goals/GoalCard";

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
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground mb-4">Crie seu primeiro objetivo para começar!</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Goal</Button>
        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    )
  );

  const pageContent = (
    <>
      <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
      <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total de Goals</p><p className="text-2xl font-bold">{goals.length}</p></div><Target className="h-8 w-8 text-primary/20" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Concluídos</p><p className="text-2xl font-bold text-green-600">{goals.filter((g) => g.status === "completed").length}</p></div><CheckCircle2 className="h-8 w-8 text-green-500/20" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Em Progresso</p><p className="text-2xl font-bold text-yellow-600">{goals.filter((g) => g.status === "active").length}</p></div><Clock className="h-8 w-8 text-yellow-500/20" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">XP Potencial</p><p className="text-2xl font-bold text-primary">{goals.reduce((acc, g) => acc + g.xp_reward, 0)}</p></div><TrendingUp className="h-8 w-8 text-primary/20" /></div></CardContent></Card>
        </div>

        <div className="flex justify-between items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Goal</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Criar Novo Goal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Título *</Label><Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="Ex: Aumentar produtividade do time" /></div>
                <div><Label>Descrição</Label><Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Descreva o objetivo..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo</Label><Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="personal">Pessoal</SelectItem><SelectItem value="team">Time</SelectItem><SelectItem value="company">Empresa</SelectItem></SelectContent></Select></div>
                  <div><Label>Prioridade</Label><Select value={newGoal.priority} onValueChange={(v) => setNewGoal({ ...newGoal, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label>Data Limite</Label><Input type="date" value={newGoal.due_date} onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })} /></div>
                <Button onClick={handleCreateGoal} className="w-full" disabled={isCreating}>{isCreating ? "Criando..." : "Criar Goal"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Meus Goals ({goals.length})</TabsTrigger>
            <TabsTrigger value="team">Time ({teamGoals.length})</TabsTrigger>
            <TabsTrigger value="company">Empresa ({companyGoals.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">{isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : renderGoalList(goals, "Nenhum goal pessoal")}</TabsContent>
          <TabsContent value="team">{renderGoalList(teamGoals, "Nenhum goal de time")}</TabsContent>
          <TabsContent value="company">{renderGoalList(companyGoals, "Nenhum goal da empresa")}</TabsContent>
        </Tabs>
      </main>
    </>
  );

   return (
     <PageShell title="Goals & OKRs" backFallback="/">
       <header className="px-4 py-6 border-b border-border/50 mb-6 flex items-center gap-3">
         <div className="p-3 rounded-xl bg-primary/10">
           <Target className="w-8 h-8 text-primary" />
         </div>
         <div>
           <h1 className="text-3xl font-bold">Goals & OKRs</h1>
           <p className="text-muted-foreground text-sm">Gerencie seus objetivos estratégicos</p>
         </div>
       </header>
       <PageWrapper pageName="Goals">
         {pageContent}
       </PageWrapper>
     </PageShell>
   );
}
