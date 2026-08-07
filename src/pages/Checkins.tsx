import { useState } from "react";
import { Users, Plus, Calendar, CheckCircle2, MessageSquare, Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useCheckins } from "@/hooks/useCheckins";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "@/hooks/useProfiles";
import { useOneOnOnePreparationManual } from "@/hooks/useOneOnOnePreparation";
import { OneOnOnePreparationPanel } from "@/components/checkins/OneOnOnePreparationPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageLayout } from "@/components/mobile";
 import { PageShell } from "@/components/navigation";
import { CheckinCard, getStatusBadge, moodEmojis } from "@/components/checkins/CheckinCard";
import type { Checkin, ActionItem, CheckinTemplate } from "@/services/checkinsService";

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function Checkins() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { templates, checkins, upcomingCheckins, isLoading, createCheckin, completeCheckin, addActionItem, toggleActionItem, isCreating } = useCheckins();
  const { data: profiles } = useProfiles();
  const { toast } = useToast();
  const { preparation, isLoading: isPreparationLoading, prepare: prepareOneOnOne, clear: clearPreparation } = useOneOnOnePreparationManual();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreparationDialogOpen, setIsPreparationDialogOpen] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [newCheckin, setNewCheckin] = useState({ employee_id: "", template_id: "", scheduled_at: "", notes: "" });
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [moodRating, setMoodRating] = useState<number>(3);
  const [newActionItem, setNewActionItem] = useState("");

  const handlePrepareOneOnOne = async (employeeId: string) => {
    try { await prepareOneOnOne(employeeId); setIsPreparationDialogOpen(true); }
    catch { toast({ title: "Erro ao preparar 1:1", variant: "destructive" }); }
  };

  const handleCreateCheckin = () => {
    if (!newCheckin.employee_id || !newCheckin.scheduled_at) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    createCheckin({ employee_id: newCheckin.employee_id, template_id: newCheckin.template_id || undefined, scheduled_at: new Date(newCheckin.scheduled_at).toISOString(), notes: newCheckin.notes || undefined });
    setNewCheckin({ employee_id: "", template_id: "", scheduled_at: "", notes: "" });
    setIsDialogOpen(false);
  };

  const handleCompleteCheckin = () => {
    if (!selectedCheckin) return;
    completeCheckin({ id: selectedCheckin.id, responses, moodRating });
    setSelectedCheckin(null); setResponses({}); setMoodRating(3);
  };

  const handleAddActionItem = () => {
    if (!selectedCheckin || !newActionItem.trim()) return;
    addActionItem({ checkinId: selectedCheckin.id, item: { text: newActionItem, completed: false } });
    setNewActionItem("");
  };

  const pageContent = (
    <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total", value: checkins.length, icon: Users, color: "primary" },
          { label: "Próximos", value: upcomingCheckins.length, icon: Calendar, color: "blue-600" },
          { label: "Concluídos", value: checkins.filter((c) => c.status === "completed").length, icon: CheckCircle2, color: "green-600" },
          { label: "Templates", value: templates.length, icon: MessageSquare, color: "primary" },
        ].map((stat) => (
          <Card key={stat.label}><CardContent className="pt-4 md:pt-6"><div className="flex items-center justify-between"><div><p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p><p className="text-xl md:text-2xl font-bold">{stat.value}</p></div><stat.icon className="h-6 w-6 md:h-8 md:w-8 text-primary/20" /></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Check-in</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>Agendar Check-in 1:1</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Colaborador *</Label><Select value={newCheckin.employee_id} onValueChange={(v) => setNewCheckin({ ...newCheckin, employee_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{(p as Profile).display_name || (p as Profile).email}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Template (opcional)</Label><Select value={newCheckin.template_id} onValueChange={(v) => setNewCheckin({ ...newCheckin, template_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{(t as CheckinTemplate).name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Data e Hora *</Label><Input type="datetime-local" value={newCheckin.scheduled_at} onChange={(e) => setNewCheckin({ ...newCheckin, scheduled_at: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={newCheckin.notes} onChange={(e) => setNewCheckin({ ...newCheckin, notes: e.target.value })} placeholder="Observações..." /></div>
              <Button onClick={handleCreateCheckin} className="w-full" disabled={isCreating}>{isCreating ? "Agendando..." : "Agendar Check-in"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos ({upcomingCheckins.length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({checkins.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : upcomingCheckins.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="text-lg font-medium mb-2">Nenhum check-in agendado</h3><Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Agendar</Button></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{upcomingCheckins.map((c) => <CheckinCard key={c.id} checkin={c} onSelect={setSelectedCheckin} onPrepare={handlePrepareOneOnOne} isPreparationLoading={isPreparationLoading} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="all">
          {checkins.length === 0 ? <Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="text-lg font-medium">Nenhum check-in</h3></CardContent></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{checkins.map((c) => <CheckinCard key={c.id} checkin={c} onSelect={setSelectedCheckin} onPrepare={handlePrepareOneOnOne} isPreparationLoading={isPreparationLoading} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="templates">
          {templates.length === 0 ? <Card><CardContent className="py-12 text-center"><MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="text-lg font-medium">Nenhum template</h3></CardContent></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{templates.map((template) => { const t = template as CheckinTemplate; return (<Card key={t.id}><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">{t.name}</CardTitle>{t.is_default && <Badge>Padrão</Badge>}</div>{t.description && <CardDescription>{t.description}</CardDescription>}</CardHeader><CardContent><p className="text-sm text-muted-foreground">{t.questions?.length || 0} perguntas</p></CardContent></Card>); })}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCheckin} onOpenChange={() => setSelectedCheckin(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Check-in</DialogTitle></DialogHeader>
          {selectedCheckin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarImage src={selectedCheckin.employee?.avatar_url || undefined} /><AvatarFallback>{selectedCheckin.employee?.display_name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                  <div><p className="font-medium">{selectedCheckin.employee?.display_name}</p><p className="text-sm text-muted-foreground">{format(new Date(selectedCheckin.scheduled_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</p></div>
                </div>
                {getStatusBadge(selectedCheckin.status)}
              </div>
              {selectedCheckin.status !== "completed" && (
                <div><Label className="mb-2 block">Como você está se sentindo?</Label><div className="flex gap-2">{moodEmojis.map((emoji, i) => <Button key={i} variant={moodRating === i + 1 ? "default" : "outline"} size="lg" onClick={() => setMoodRating(i + 1)} className="text-2xl">{emoji}</Button>)}</div></div>
              )}
              <div>
                <Label className="mb-2 block">Ações de Acompanhamento</Label>
                <div className="space-y-2 mb-3">{(selectedCheckin.action_items as ActionItem[] | null)?.map((item) => (<div key={item.id} className="flex items-center gap-2"><Checkbox checked={item.completed} onCheckedChange={() => toggleActionItem({ checkinId: selectedCheckin.id, itemId: item.id })} /><span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.text}</span></div>))}</div>
                <div className="flex gap-2"><Input placeholder="Nova ação..." value={newActionItem} onChange={(e) => setNewActionItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddActionItem()} /><Button onClick={handleAddActionItem} size="icon"><Plus className="h-4 w-4" /></Button></div>
              </div>
              {selectedCheckin.notes && <div><Label>Notas</Label><p className="text-sm text-muted-foreground mt-1">{selectedCheckin.notes}</p></div>}
              {selectedCheckin.status !== "completed" && <Button onClick={handleCompleteCheckin} className="w-full"><CheckCircle2 className="h-4 w-4 mr-2" />Concluir Check-in (+{selectedCheckin.xp_reward} XP)</Button>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPreparationDialogOpen} onOpenChange={(open) => { setIsPreparationDialogOpen(open); if (!open) clearPreparation(); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />Preparação Inteligente para 1:1</DialogTitle></DialogHeader>
          <OneOnOnePreparationPanel preparation={preparation} isLoading={isPreparationLoading} />
        </DialogContent>
      </Dialog>
    </main>
  );

   return (
     <PageShell title="Check-ins 1:1">
       {isMobile ? (
         <MobilePageLayout title="Check-ins 1:1" icon={Users} backPath="/" subtitle="Reuniões de acompanhamento">
           {pageContent}
         </MobilePageLayout>
       ) : (
         <div className="min-h-screen bg-background">
           <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
             <Users className="h-6 w-6 text-primary" />
             <h1 className="text-xl font-bold">Check-ins 1:1</h1>
             <span className="text-muted-foreground ml-2">Reuniões de acompanhamento</span>
           </header>
           {pageContent}
         </div>
       )}
     </PageShell>
   );
}
