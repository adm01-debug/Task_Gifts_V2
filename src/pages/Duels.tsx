import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Swords, Trophy, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { showUndoToast } from "@/components/UndoToast";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PageWrapper } from "@/components/PageWrapper";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
 import { PageShell } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUserDuels, useActiveDuel, useAcceptDuel, useDeclineDuel, useCancelDuel, duelKeys } from "@/hooks/useDuels";
import { DuelCard } from "@/components/duels/DuelCard";
import { CreateDuelDialog } from "@/components/duels/CreateDuelDialog";

const Duels = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: "decline" | "cancel" | null; duelId: string | null; opponentName: string }>({ open: false, type: null, duelId: null, opponentName: "" });
  const [pendingAction, setPendingAction] = useState<{ duelId: string; type: 'accept' | 'decline' | 'cancel' } | null>(null);

  const { data: duels, isLoading: loadingDuels } = useUserDuels(user?.id);
  const acceptDuel = useAcceptDuel();
  const declineDuel = useDeclineDuel();
  const cancelDuel = useCancelDuel();

  const handleConfirmAction = () => {
    if (!confirmDialog.duelId || !user) return;
    const duelIdToRestore = confirmDialog.duelId;
    const opponentNameToRestore = confirmDialog.opponentName;
    
    if (confirmDialog.type === "decline") {
      setPendingAction({ duelId: duelIdToRestore, type: 'decline' });
      declineDuel.mutate({ duelId: confirmDialog.duelId, userId: user.id }, {
        onSuccess: () => { showUndoToast({ message: `Duelo com ${opponentNameToRestore} recusado`, onUndo: async () => { await supabase.from("direct_duels").update({ status: "pending" }).eq("id", duelIdToRestore); queryClient.invalidateQueries({ queryKey: duelKeys.all }); } }); },
        onSettled: () => setPendingAction(null),
      });
    } else if (confirmDialog.type === "cancel") {
      setPendingAction({ duelId: duelIdToRestore, type: 'cancel' });
      cancelDuel.mutate({ duelId: confirmDialog.duelId, userId: user.id }, {
        onSuccess: () => { showUndoToast({ message: `Duelo com ${opponentNameToRestore} cancelado`, onUndo: async () => { await supabase.from("direct_duels").update({ status: "pending" }).eq("id", duelIdToRestore); queryClient.invalidateQueries({ queryKey: duelKeys.all }); } }); },
        onSettled: () => setPendingAction(null),
      });
    }
    setConfirmDialog({ open: false, type: null, duelId: null, opponentName: "" });
  };

  const fabActions = [{ icon: Swords, label: "Novo Duelo", onClick: () => setDialogOpen(true), color: "primary" as const }];

  const seo = useSEO();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const activeDuels = duels?.filter(d => ['pending', 'accepted', 'active'].includes(d.status)) || [];
  const completedDuels = duels?.filter(d => ['completed', 'declined', 'cancelled'].includes(d.status)) || [];

   return (
     <PageShell title="Duelos">
       <PageWrapper pageName="Duelos" className="pb-24">
         <SEOHead {...seo} />
         <div className="min-h-screen bg-background pb-24">
           <ConfirmDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))} title={confirmDialog.type === "decline" ? "Recusar Duelo?" : "Cancelar Duelo?"} description={confirmDialog.type === "decline" ? `Tem certeza que deseja recusar o desafio de ${confirmDialog.opponentName}?` : `Tem certeza que deseja cancelar o duelo com ${confirmDialog.opponentName}?`} confirmText={confirmDialog.type === "decline" ? "Recusar" : "Cancelar Duelo"} variant={confirmDialog.type === "decline" ? "warning" : "danger"} onConfirm={handleConfirmAction} />
           <FloatingActionButton actions={fabActions} />
           <header className="px-4 py-6 border-b border-border/50 mb-6 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 rounded-xl bg-destructive/10">
                 <Swords className="w-8 h-8 text-destructive" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold">Duelos Diretos</h1>
                 <p className="text-muted-foreground text-sm">Desafie colegas para competições 1v1</p>
               </div>
             </div>
             <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
               <DialogTrigger asChild><Button className="gap-2"><Target className="w-4 h-4" />Novo Duelo</Button></DialogTrigger>
               <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><Swords className="w-5 h-5 text-destructive" />Criar Desafio</DialogTitle></DialogHeader>{user && <CreateDuelDialog userId={user.id} onClose={() => setDialogOpen(false)} />}</DialogContent>
             </Dialog>
           </header>
           <main className="container max-w-4xl mx-auto px-6 py-8 space-y-8">
             <SectionErrorBoundary sectionName="Duelos Ativos">
               <section>
                 <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-success" />Duelos Ativos{activeDuels.length > 0 && <span className="text-sm font-normal text-muted-foreground">({activeDuels.length})</span>}</h2>
                 {loadingDuels ? <div className="text-center py-8 text-muted-foreground">Carregando...</div> : activeDuels.length === 0 ? (
                   <div className="text-center py-12 bg-card rounded-2xl border border-border"><Swords className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground mb-4">Nenhum duelo ativo</p><Button onClick={() => setDialogOpen(true)}>Criar Primeiro Duelo</Button></div>
                 ) : (
                   <div className="grid gap-4 md:grid-cols-2">
                     {activeDuels.map(duel => {
                       const isChallenger = duel.challenger_id === user!.id;
                       const opponentName = isChallenger ? (duel.opponent?.display_name || "Oponente") : (duel.challenger?.display_name || "Desafiante");
                       return <DuelCard key={duel.id} duel={duel} userId={user!.id} onAccept={() => { setPendingAction({ duelId: duel.id, type: 'accept' }); acceptDuel.mutate({ duelId: duel.id, userId: user!.id }, { onSettled: () => setPendingAction(null) }); }} onDecline={() => setConfirmDialog({ open: true, type: "decline", duelId: duel.id, opponentName })} onCancel={() => setConfirmDialog({ open: true, type: "cancel", duelId: duel.id, opponentName })} pendingAction={pendingAction} />;
                     })}
                   </div>
                 )}
               </section>
             </SectionErrorBoundary>
             {completedDuels.length > 0 && (
               <SectionErrorBoundary sectionName="Histórico de Duelos">
                 <section><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" />Histórico</h2><div className="grid gap-4 md:grid-cols-2">{completedDuels.slice(0, 6).map(duel => <DuelCard key={duel.id} duel={duel} userId={user!.id} />)}</div></section>
               </SectionErrorBoundary>
             )}
           </main>
         </div>
       </PageWrapper>
     </PageShell>
   );
};

export default Duels;
