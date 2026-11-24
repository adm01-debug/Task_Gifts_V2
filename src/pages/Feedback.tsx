import { useState } from "react";
import { MessageCircle, Inbox, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeedback360 } from "@/hooks/useFeedback360";
import { useRBAC } from "@/hooks/useRBAC";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { FeedbackRequestForm } from "@/components/feedback/FeedbackRequestForm";
import { FeedbackSummaryCard } from "@/components/feedback/FeedbackSummaryCard";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { FeedbackCycle, FeedbackRequest } from "@/services/feedbackService";

export default function Feedback() {
  const { cycles, pendingRequests, isLoading, submitFeedback, isSubmitting } = useFeedback360();
  const { isAdmin, isManager } = useRBAC();
  const canManageRequests = isAdmin || isManager;
  const seoData = useSEO();
  const [activeRequest, setActiveRequest] = useState<FeedbackRequest | null>(null);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [overallRating, setOverallRating] = useState<"1" | "2" | "3" | "4" | "5">("5");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const openRespond = (req: FeedbackRequest) => {
    setActiveRequest(req);
    setStrengths("");
    setImprovements("");
    setOverallRating("5");
    setIsAnonymous(false);
  };

  const handleSubmit = () => {
    if (!activeRequest) return;
    submitFeedback(
      {
        requestId: activeRequest.id,
        answers: {},
        strengths,
        improvements,
        overallRating: Number(overallRating),
        isAnonymous,
      },
      {
        onSuccess: () => setActiveRequest(null),
      }
    );
  };

   if (isLoading) {
     return (
       <PageShell title="Feedback 360°">
         <div className="min-h-screen bg-background flex items-center justify-center">
           <LoadingState message="Carregando feedbacks..." />
         </div>
       </PageShell>
     );
   }

  return (
    <PageShell title="Feedback 360°">
      <div className="min-h-screen bg-background">
        <SEOHead {...seoData} />
        <div className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Feedback 360°</h1>
          {canManageRequests && (
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => setIsRequestFormOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Solicitar feedback
            </Button>
          )}
        </div>

      <main className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Ciclos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {cycles.length === 0 ? (
              <EmptyState 
                icon={Inbox}
                title="Nenhum ciclo ativo"
                description="Não há ciclos de feedback ativos no momento"
              />
            ) : (
              <div className="space-y-3">
                {cycles.map((cycle: FeedbackCycle) => (
                  <div key={cycle.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{cycle.name}</h3>
                      <Badge>{cycle.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{cycle.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedbacks Pendentes ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <EmptyState 
                icon={MessageCircle}
                title="Nenhum feedback pendente"
                description="Você não possui feedbacks para responder"
              />
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req: FeedbackRequest) => (
                  <div key={req.id} className="p-3 border rounded-lg flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        Feedback para {req.to_user?.display_name || "colaborador"}
                      </p>
                      {req.cycle?.name && (
                        <p className="text-sm text-muted-foreground truncate">{req.cycle.name}</p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => openRespond(req)}>
                      Responder
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <FeedbackSummaryCard />
      </main>

      <Dialog open={!!activeRequest} onOpenChange={(open) => !open && setActiveRequest(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Responder Feedback</DialogTitle>
            <DialogDescription>
              {activeRequest?.to_user?.display_name || "Colaborador"} — {activeRequest?.cycle?.name || "Ciclo 360°"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pontuação geral</Label>
              <RadioGroup value={overallRating} onValueChange={(v) => setOverallRating(v as "1" | "2" | "3" | "4" | "5")} className="flex gap-2">
                {["1", "2", "3", "4", "5"].map((v) => (
                  <div key={v} className="flex items-center gap-1">
                    <RadioGroupItem value={v} id={`rating-${v}`} />
                    <Label htmlFor={`rating-${v}`} className="cursor-pointer">{v}★</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengths">Pontos fortes</Label>
              <Textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="O que essa pessoa faz bem?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improvements">Pontos a melhorar</Label>
              <Textarea
                id="improvements"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="O que essa pessoa pode desenvolver?"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="anonymous" className="cursor-pointer">Enviar anonimamente</Label>
              <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveRequest(null)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FeedbackRequestForm
        open={isRequestFormOpen}
        onOpenChange={setIsRequestFormOpen}
        cycles={cycles}
      />
    </div>
  </PageShell>
  );
}
