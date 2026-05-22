import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { questsService, type Quest } from "@/services/questsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { QuestStatsModal } from "./QuestStatsModal";
import { QuestCard } from "./QuestCard";

export function QuestsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statsQuest, setStatsQuest] = useState<Quest | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");

  const { data: quests, isLoading } = useQuery({
    queryKey: ["manager-quests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return questsService.getByCreator(user.id);
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ questId, status }: { questId: string; status: "active" | "archived" }) => {
      if (status === "active") return questsService.activate(questId);
      return questsService.archive(questId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["manager-quests"] }); toast({ title: "Status atualizado!" }); },
    onError: (error: Error) => { toast({ title: "Erro", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (questId: string) => {
      return questsService.delete(questId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["manager-quests"] }); toast({ title: "Quest excluída!" }); },
    onError: (error: Error) => { toast({ title: "Erro", description: error.message, variant: "destructive" }); },
  });

  const filteredQuests = useMemo(() => quests?.filter(q => statusFilter === "all" || q.status === statusFilter) || [], [quests, statusFilter]);
  const activeCount = useMemo(() => quests?.filter(q => q.status === "active").length || 0, [quests]);
  const draftCount = useMemo(() => quests?.filter(q => q.status === "draft").length || 0, [quests]);

  const handleArchive = useCallback((q: Quest) => updateStatusMutation.mutate({ questId: q.id, status: "archived" }), [updateStatusMutation]);
  const handleActivate = useCallback((q: Quest) => updateStatusMutation.mutate({ questId: q.id, status: "active" }), [updateStatusMutation]);
  const handleDelete = useCallback((q: Quest) => { if (confirm("Tem certeza?")) deleteMutation.mutate(q.id); }, [deleteMutation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quests Criadas</h2>
          <p className="text-sm text-muted-foreground">{activeCount} ativas, {draftCount} rascunhos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["all", "active", "draft", "archived"] as const).map((status) => (
              <button key={status} onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm transition-colors ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted text-muted-foreground"}`}>
                {status === "all" ? "Todas" : status === "active" ? "Ativas" : status === "draft" ? "Rascunhos" : "Arquivadas"}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/quest-builder")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Quest
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Card key={i} className="h-32 animate-pulse bg-muted/50" />)}
        </div>
      ) : filteredQuests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4"><Target className="h-8 w-8 text-primary" /></div>
          <h3 className="text-lg font-semibold">Nenhuma quest encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter === "all" ? "Crie sua primeira trilha de aprendizado" : `Nenhuma quest ${statusFilter === "active" ? "ativa" : statusFilter === "draft" ? "em rascunho" : "arquivada"}`}
          </p>
          <Button onClick={() => navigate("/quest-builder")} className="mt-4 gap-2"><Plus className="h-4 w-4" />Criar Quest</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredQuests.map((quest, index) => (
              <QuestCard key={quest.id} quest={quest} index={index} onViewStats={setStatsQuest} onArchive={handleArchive} onActivate={handleActivate} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <QuestStatsModal quest={statsQuest} open={!!statsQuest} onClose={() => setStatsQuest(null)} />
    </div>
  );
}
